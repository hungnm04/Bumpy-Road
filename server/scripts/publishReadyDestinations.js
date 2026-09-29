const pool = require("../config/db");

async function publishReadyDestinations() {
  const { rows } = await pool.query(`
    UPDATE mountains m
    SET publication_status = 'published',
        updated_at = CURRENT_TIMESTAMP
    WHERE m.publication_status = 'draft'
      AND m.name <> ''
      AND m.location <> 'Unknown'
      AND m.country_code IS NOT NULL
      AND m.continent <> 'Unknown'
      AND m.latitude IS NOT NULL
      AND m.longitude IS NOT NULL
      AND length(m.description) >= 120
      AND EXISTS (
        SELECT 1
        FROM mountain_media media
        WHERE media.mountain_id = m.id
          AND media.is_primary = true
          AND media.thumbnail_url LIKE 'https://%'
      )
    RETURNING id
  `);

  console.log(
    JSON.stringify(
      {
        published: rows.length,
        policy: "complete-geography-with-attributed-https-media",
      },
      null,
      2
    )
  );
}

publishReadyDestinations()
  .catch((error) => {
    console.error("Publishing ready destinations failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
