const pool = require("../config/db");

function normalizeTags(tags) {
  if (!tags) return [];

  const values = Array.isArray(tags) ? tags : String(tags).split(",");
  return values.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 10);
}

async function searchMountains(filters = {}) {
  const params = [];
  const conditions = ["m.publication_status = 'published'"];
  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const query = filters.q?.trim();
  let rankExpression = "0";

  if (query) {
    const queryParam = addParam(query);
    conditions.push(`(
      lower(m.name) = lower(${queryParam})
      OR m.name % ${queryParam}
      OR m.search_document @@ websearch_to_tsquery('simple', ${queryParam})
      OR m.name ILIKE '%' || ${queryParam} || '%'
      OR m.location ILIKE '%' || ${queryParam} || '%'
      OR COALESCE(m.region, '') ILIKE '%' || ${queryParam} || '%'
    )`);
    rankExpression = `(
      CASE WHEN lower(m.name) = lower(${queryParam}) THEN 100 ELSE 0 END
      + similarity(m.name, ${queryParam}) * 10
      + ts_rank(m.search_document, websearch_to_tsquery('simple', ${queryParam})) * 5
    )`;
  }

  if (filters.continent) {
    conditions.push(`lower(m.continent) = lower(${addParam(filters.continent)})`);
  }

  if (filters.countryCode) {
    conditions.push(`upper(m.country_code) = upper(${addParam(filters.countryCode)})`);
  }

  if (filters.destinationType) {
    conditions.push(`m.destination_type = ${addParam(filters.destinationType)}`);
  }

  if (Number.isFinite(filters.minElevationM)) {
    conditions.push(`m.elevation_m >= ${addParam(filters.minElevationM)}`);
  }

  if (Number.isFinite(filters.maxElevationM)) {
    conditions.push(`m.elevation_m <= ${addParam(filters.maxElevationM)}`);
  }

  const tags = normalizeTags(filters.tags);

  if (tags.length > 0) {
    const tagsParam = addParam(tags);
    conditions.push(`(m.source_tags && ${tagsParam}::text[] OR m.editorial_tags && ${tagsParam}::text[])`);
  }

  const limitParam = addParam(filters.limit);
  const offsetParam = addParam(filters.offset);
  const { rows } = await pool.query(
    `SELECT
       m.id,
       m.slug,
       m.name,
       m.location,
       CASE WHEN m.photo_verified THEN m.photo_url ELSE NULL END AS photo_url,
       m.continent,
       m.region,
       m.country_code,
       m.elevation_m,
       m.destination_type,
       m.source_tags,
       m.editorial_tags,
       m.guide_status,
       m.guide_quality_score,
       m.traveler_fit,
       m.description,
       m.attribution,
       m.attribution_url,
       m.license_code,
       m.source,
       m.completeness_score,
       ${rankExpression} AS relevance
     FROM mountains m
     WHERE ${conditions.join(" AND ")}
     ORDER BY relevance DESC, m.name ASC
     LIMIT ${limitParam}
     OFFSET ${offsetParam}`,
    params
  );

  return rows;
}

async function getPlaceById(id) {
  const { rows } = await pool.query(
    `SELECT
       m.*,
       CASE WHEN m.photo_verified THEN m.photo_url ELSE NULL END AS public_photo_url,
       media.source_url AS media_source_url,
       media.attribution_text AS media_attribution,
       media.license_code AS media_license_code,
       media.license_url AS media_license_url,
       COALESCE(gallery.items, '[]'::json) AS media_gallery
     FROM mountains m
     LEFT JOIN LATERAL (
       SELECT source_url, attribution_text, license_code, license_url
       FROM mountain_media
       WHERE mountain_id = m.id AND is_primary = true
       ORDER BY fetched_at DESC
       LIMIT 1
     ) media ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(
         json_build_object(
           'thumbnail_url', thumbnail_url,
           'source_url', source_url,
           'attribution_text', attribution_text,
           'license_code', license_code,
           'license_url', license_url
         )
         ORDER BY is_primary DESC, fetched_at DESC
       ) AS items
       FROM mountain_media
       WHERE mountain_id = m.id
         AND thumbnail_url LIKE 'https://%'
     ) gallery ON true
     WHERE m.id = $1 AND m.publication_status = 'published'`,
    [id]
  );

  if (!rows[0]) return null;

  const place = {
    ...rows[0],
    photo_url: rows[0].public_photo_url,
  };
  delete place.public_photo_url;

  const alternatives = await pool.query(
    `SELECT
       id, slug, name, location, region, country_code, elevation_m, destination_type,
       CASE WHEN photo_verified THEN photo_url ELSE NULL END AS photo_url,
       traveler_fit
     FROM mountains
     WHERE publication_status = 'published'
       AND guide_status = 'guide_ready'
       AND id <> $1
       AND destination_type = $2
     ORDER BY (country_code = $3) DESC, guide_quality_score DESC, name ASC
     LIMIT 3`,
    [place.id, place.destination_type, place.country_code]
  );

  return { ...place, alternatives: alternatives.rows };
}

async function getFeaturedPlacesFromDB() {
  const { rows } = await pool.query(`
    SELECT
      id, slug, name, location, photo_url, continent, region, country_code,
      elevation_m, destination_type, source_tags, editorial_tags, traveler_fit,
      guide_status, guide_quality_score
    FROM mountains
    WHERE publication_status = 'published'
      AND guide_status = 'guide_ready'
      AND photo_verified = true
    ORDER BY RANDOM()
    LIMIT 6
  `);

  return rows;
}

module.exports = {
  getFeaturedPlacesFromDB,
  getPlaceById,
  searchMountains,
};
