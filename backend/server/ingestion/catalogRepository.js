const pool = require("../config/db");

const FALLBACK_PHOTO_URL = "/storage/mountain-photos/mountain_town_1.jpg";

function slugify(name, externalId) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "destination"}-${externalId.toLowerCase()}`;
}

async function getWikidataSources() {
  const { rows } = await pool.query(`
    SELECT
      s.external_id,
      m.name,
      m.location,
      m.region,
      m.country_code,
      m.continent,
      m.latitude,
      m.longitude,
      m.elevation_m,
      m.destination_type,
      m.source_description
    FROM mountain_sources s
    JOIN mountains m ON m.id = s.mountain_id
    WHERE s.provider = 'wikidata'
    ORDER BY s.external_id
  `);

  return rows;
}

async function createRun(mode) {
  const { rows } = await pool.query(
    `INSERT INTO ingestion_runs (provider, mode, status)
     VALUES ('wikidata', $1, 'running')
     RETURNING id`,
    [mode]
  );

  return rows[0].id;
}

async function completeRun(runId, status, counts, errors) {
  await pool.query(
    `UPDATE ingestion_runs
     SET status = $2,
         fetched_count = $3,
         staged_count = $4,
         updated_count = $5,
         error_count = $6,
         summary = $7,
         completed_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [
      runId,
      status,
      counts.fetched,
      counts.staged,
      counts.updated,
      errors.length,
      JSON.stringify({ errors: errors.slice(0, 50) }),
    ]
  );
}

async function upsertDestination(destination, media, { existingOnly = false } = {}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT mountain_id
       FROM mountain_sources
       WHERE provider = $1 AND external_id = $2`,
      [destination.provider, destination.externalId]
    );

    let mountainId;
    let result;

    if (existing.rowCount > 0) {
      mountainId = existing.rows[0].mountain_id;
      await client.query(
        `UPDATE mountains
         SET name = COALESCE($2, name),
             location = COALESCE($3, location),
             region = COALESCE($4, region),
             country_code = COALESCE($5, country_code),
             continent = COALESCE($6, continent),
             latitude = COALESCE($7, latitude),
             longitude = COALESCE($8, longitude),
             elevation_m = $9,
             destination_type = COALESCE($10, destination_type),
             source_tags = COALESCE($11, source_tags),
             source_description = COALESCE($12, source_description),
             description = CASE WHEN publication_status = 'draft' THEN $13 ELSE description END,
             source_updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          mountainId,
          destination.name,
          destination.location,
          destination.region,
          destination.countryCode,
          destination.continent,
          destination.latitude,
          destination.longitude,
          destination.elevationM,
          destination.destinationType,
          destination.sourceTags,
          destination.sourceDescription,
          destination.description,
        ]
      );
      result = "updated";
    } else {
      if (existingOnly) {
        await client.query("ROLLBACK");
        return "skipped";
      }

      const inserted = await client.query(
        `INSERT INTO mountains (
           slug, name, location, description, photo_url, continent, region, country_code,
           latitude, longitude, elevation_m, destination_type, source_tags,
           source_description, source_updated_at, publication_status
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, 'draft'
         )
         RETURNING id`,
        [
          slugify(destination.name, destination.externalId),
          destination.name,
          destination.location,
          destination.description,
          media?.thumbnailUrl || FALLBACK_PHOTO_URL,
          destination.continent || "Unknown",
          destination.region,
          destination.countryCode,
          destination.latitude,
          destination.longitude,
          destination.elevationM,
          destination.destinationType,
          destination.sourceTags,
          destination.sourceDescription,
        ]
      );
      mountainId = inserted.rows[0].id;
      result = "staged";
    }

    await client.query(
      `INSERT INTO mountain_sources (
         mountain_id, provider, external_id, source_url, license_code,
         attribution_text, raw_payload, fetched_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (provider, external_id)
       DO UPDATE SET
         mountain_id = EXCLUDED.mountain_id,
         source_url = EXCLUDED.source_url,
         license_code = EXCLUDED.license_code,
         attribution_text = EXCLUDED.attribution_text,
         raw_payload = EXCLUDED.raw_payload,
         fetched_at = CURRENT_TIMESTAMP`,
      [
        mountainId,
        destination.provider,
        destination.externalId,
        destination.sourceUrl,
        destination.licenseCode,
        destination.attributionText,
        destination.rawPayload,
      ]
    );

    if (media) {
      await client.query(
        "UPDATE mountain_media SET is_primary = false WHERE mountain_id = $1",
        [mountainId]
      );
      await client.query(
        `INSERT INTO mountain_media (
           mountain_id, provider, source_url, thumbnail_url, author,
           license_code, license_url, attribution_text, is_primary, fetched_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP)
         ON CONFLICT (provider, source_url)
         DO UPDATE SET
           mountain_id = EXCLUDED.mountain_id,
           thumbnail_url = EXCLUDED.thumbnail_url,
           author = EXCLUDED.author,
           license_code = EXCLUDED.license_code,
           license_url = EXCLUDED.license_url,
           attribution_text = EXCLUDED.attribution_text,
           is_primary = true,
           fetched_at = CURRENT_TIMESTAMP`,
        [
          mountainId,
          media.provider,
          media.sourceUrl,
          media.thumbnailUrl,
          media.author,
          media.licenseCode,
          media.licenseUrl,
          media.attributionText,
        ]
      );
      await client.query(
        `UPDATE mountains
         SET photo_url = CASE WHEN photo_verified = false THEN $2 ELSE photo_url END,
             photo_verified = true,
             guide_updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [mountainId, media.thumbnailUrl]
      );
    }

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  completeRun,
  createRun,
  getWikidataSources,
  pool,
  upsertDestination,
};
