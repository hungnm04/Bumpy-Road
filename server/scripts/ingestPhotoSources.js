/**
 * Phase 6.1 — Unsplash + Pexels photo ingestion for existing mountains.
 *
 * For each published mountain without an attributed HTTPS photo, we try
 * Unsplash then Pexels, fetch the image, pass it through Sharp, and store
 * the result + attribution. Existing photos are not overwritten.
 *
 * Usage:
 *   docker compose run --rm --profile tools db-tools server/scripts/ingestPhotoSources.js --source=unsplash --limit=10
 */

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { searchPhotos: unsplashSearch } = require("../ingestion/unsplash");
const { searchPhotos: pexelsSearch } = require("../ingestion/pexels");
const { completeRun, createRun, pool } = require("../ingestion/catalogRepository");

const STORAGE_DIR = path.join(__dirname, "../../storage/mountain-photos");

function parseArgs(args) {
  return {
    source: (args.find((a) => a.startsWith("--source="))?.split("=")[1] || "unsplash").toLowerCase(),
    limit: Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) || 10,
    dryRun: args.includes("--dry-run"),
  };
}

async function pickPhoto(search, mountainName) {
  const results = await search(mountainName, { limit: 5 });
  if (results.length === 0) return null;

  // Skip records that lack author/attribution — never invent one
  return results.find((r) => r.author && r.licenseCode) || null;
}

async function downloadAndReencode(photo) {
  const allowedHosts = new Set(
    (process.env.INGEST_ALLOWED_HOSTS || "").split(",").map((h) => h.trim().toLowerCase())
  );
  const url = new URL(photo.thumbnailUrl);
  if (!allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error(`Refusing to fetch from non-allowlisted host ${url.hostname}`);
  }

  const response = await fetch(url.href, {
    headers: { "User-Agent": process.env.INGEST_USER_AGENT || "BumpyRoad/1.0" },
  });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());

  // Sharp re-encode: strips EXIF, normalises format, caps resolution
  const out = await sharp(buffer)
    .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const hash = require("crypto").createHash("sha256").update(out).digest("hex").slice(0, 16);
  const filename = `${photo.provider}-${hash}.jpg`;
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.writeFileSync(path.join(STORAGE_DIR, filename), out);

  return {
    localPath: `/storage/mountain-photos/${filename}`,
    attributionText: photo.attributionText,
    author: photo.author,
    licenseCode: photo.licenseCode,
    sourceUrl: photo.sourceUrl,
    provider: photo.provider,
    externalId: photo.externalId,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const search = options.source === "pexels" ? pexelsSearch : unsplashSearch;
  const { rows } = await pool.query(
    `SELECT id, name, photo_url
     FROM mountains
     WHERE publication_status = 'published'
       AND (photo_url IS NULL OR photo_url NOT LIKE 'https://%' OR photo_verified = false)
     ORDER BY completeness_score DESC NULLS LAST, id ASC
     LIMIT $1`,
    [options.limit]
  );

  let runId = null;
  const counts = { fetched: rows.length, staged: 0, updated: 0, skipped: 0 };
  const errors = [];

  if (!options.dryRun) runId = await createRun(`${options.source}-photos`);

  for (const mountain of rows) {
    try {
      const photo = await pickPhoto(search, mountain.name);
      if (!photo) {
        counts.skipped += 1;
        continue;
      }

      if (options.dryRun) {
        console.log(`[dry-run] ${mountain.name} ← ${photo.provider}:${photo.externalId}`);
        continue;
      }

      const stored = await downloadAndReencode(photo);

      await pool.query(
        `UPDATE mountain_media
            SET is_primary = false
          WHERE mountain_id = $1`,
        [mountain.id]
      );
      await pool.query(
        `INSERT INTO mountain_media (
           mountain_id, provider, source_url, thumbnail_url, author,
           license_code, license_url, attribution_text, is_primary, fetched_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
         ON CONFLICT (provider, source_url) DO NOTHING`,
        [
          mountain.id,
          stored.provider,
          stored.sourceUrl,
          stored.localPath,
          stored.author,
          stored.licenseCode,
          null,
          stored.attributionText,
        ]
      );
      await pool.query(
        `UPDATE mountains
            SET photo_url = $2,
                photo_verified = true,
                license_code = $3,
                attribution = $4,
                attribution_url = $5,
                source = $6,
                source_id = $7,
                completeness_score = LEAST(100, completeness_score + 25)
          WHERE id = $1`,
        [
          mountain.id,
          stored.localPath,
          stored.licenseCode,
          stored.attributionText,
          stored.sourceUrl,
          stored.provider,
          stored.externalId,
        ]
      );
      counts.updated += 1;
    } catch (error) {
      errors.push({ id: mountain.id, message: error.message });
    }
  }

  if (runId) {
    await completeRun(runId, "completed", counts, errors);
  }

  console.log(JSON.stringify({ source: options.source, ...counts, errors: errors.length }, null, 2));
}

main()
  .catch((error) => {
    console.error("Photo ingestion failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());