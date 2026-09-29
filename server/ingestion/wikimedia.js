const { fetchJson } = require("./httpClient");

function plainText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function filenameFromImageValue(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return decodeURIComponent(url.pathname.split("/").pop());
  } catch {
    return value.replace(/^File:/i, "").trim();
  }
}

function metadataValue(metadata, key) {
  return plainText(metadata?.[key]?.value || "");
}

async function getCommonsMedia(imageValue) {
  const filename = filenameFromImageValue(imageValue);

  if (!filename) {
    return null;
  }

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1200",
    titles: `File:${filename}`,
  });
  const payload = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const page = Object.values(payload.query?.pages || {})[0];
  const imageInfo = page?.imageinfo?.[0];

  if (!imageInfo?.thumburl && !imageInfo?.url) {
    return null;
  }

  const metadata = imageInfo.extmetadata || {};
  const author = metadataValue(metadata, "Artist") || "Wikimedia Commons contributor";
  const licenseCode = metadataValue(metadata, "LicenseShortName") || "See source";
  const licenseUrl = metadataValue(metadata, "LicenseUrl") || imageInfo.descriptionurl;

  return {
    provider: "wikimedia_commons",
    sourceUrl: imageInfo.descriptionurl,
    thumbnailUrl: imageInfo.thumburl || imageInfo.url,
    author,
    licenseCode,
    licenseUrl,
    attributionText: `${author} / ${licenseCode}`,
    rawPayload: payload,
  };
}

module.exports = {
  getCommonsMedia,
  plainText,
};
