const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "../../storage/ingestion-cache");
const DEFAULT_ALLOWED_HOSTS = [
  "query.wikidata.org",
  "www.wikidata.org",
  "commons.wikimedia.org",
  "api.open-meteo.com",
];
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAllowedHosts() {
  return new Set(
    (process.env.INGEST_ALLOWED_HOSTS || DEFAULT_ALLOWED_HOSTS.join(","))
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

function getUserAgent() {
  const userAgent = process.env.INGEST_USER_AGENT?.trim();

  if (!userAgent) {
    throw new Error("INGEST_USER_AGENT is required for provider requests");
  }

  return userAgent;
}

function assertAllowedUrl(value) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error(`Ingestion provider URL must use HTTPS: ${url.href}`);
  }

  if (!getAllowedHosts().has(url.hostname.toLowerCase())) {
    throw new Error(`Ingestion provider host is not allowed: ${url.hostname}`);
  }

  return url;
}

function cacheFileFor(url) {
  const hash = crypto.createHash("sha256").update(url.href).digest("hex");
  return path.join(cacheDir, `${hash}.json`);
}

function readCache(url, cacheTtlMs) {
  const cacheFile = cacheFileFor(url);

  try {
    const stats = fs.statSync(cacheFile);

    if (Date.now() - stats.mtimeMs > cacheTtlMs) {
      return null;
    }

    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(url, value) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cacheFileFor(url), JSON.stringify(value), "utf8");
}

async function fetchJson(value, { cacheTtlMs = 24 * 60 * 60 * 1000 } = {}) {
  const url = assertAllowedUrl(value);
  const cached = readCache(url, cacheTtlMs);

  if (cached) {
    return cached;
  }

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": getUserAgent(),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Provider returned HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get("content-length") || 0);

      if (contentLength > MAX_RESPONSE_BYTES) {
        throw new Error("Provider response exceeded the configured size limit");
      }

      const text = await response.text();

      if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
        throw new Error("Provider response exceeded the configured size limit");
      }

      const valueFromProvider = JSON.parse(text);
      writeCache(url, valueFromProvider);
      return valueFromProvider;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(attempt * 500);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Provider request failed after 3 attempts: ${lastError.message}`);
}

module.exports = {
  assertAllowedUrl,
  fetchJson,
};
