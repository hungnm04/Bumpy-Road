const pool = require("../config/db");
const { buildGuideProfile, evaluateGuideQuality } = require("../services/destinationQuality");

const DEFAULT_LIMIT = 150;
const TYPE_QUOTAS = {
  mountain_resort: 55,
  mountain_pass: 35,
  mountain_hut: 30,
  ski_area: 30,
};

function parseLimit() {
  const limitIndex = process.argv.indexOf("--limit");
  const value = limitIndex >= 0 ? Number.parseInt(process.argv[limitIndex + 1], 10) : DEFAULT_LIMIT;

  return Number.isFinite(value) ? Math.min(Math.max(value, 1), 500) : DEFAULT_LIMIT;
}

async function loadPublishedDestinations() {
  const { rows } = await pool.query(`
    SELECT
      m.*,
      EXISTS (
        SELECT 1
        FROM mountain_media media
        WHERE media.mountain_id = m.id
          AND media.is_primary = true
          AND media.thumbnail_url LIKE 'https://%'
      ) AS has_primary_media,
      EXISTS (
        SELECT 1 FROM mountain_sources source WHERE source.mountain_id = m.id
      ) AS has_source
    FROM mountains m
    WHERE m.publication_status = 'published'
    ORDER BY m.destination_type, m.name
  `);

  return rows;
}

function rankCandidates(destinations) {
  return destinations
    .map((destination) => {
      const profile = buildGuideProfile(destination);
      const sourceBonus = destination.has_source ? 4 : 0;
      const elevationBonus = destination.elevation_m !== null ? 2 : 0;

      return { ...profile, selection_score: profile.score + sourceBonus + elevationBonus };
    })
    .filter((destination) => destination.ready)
    .sort((left, right) =>
      right.selection_score - left.selection_score || left.name.localeCompare(right.name)
    );
}

function selectBalancedGuides(candidates, limit) {
  const selected = [];
  const selectedIds = new Set();

  for (const [destinationType, quota] of Object.entries(TYPE_QUOTAS)) {
    for (const candidate of candidates.filter((row) => row.destination_type === destinationType)) {
      if (selected.filter((row) => row.destination_type === destinationType).length >= quota) break;
      if (selected.length >= limit) break;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (!selectedIds.has(candidate.id)) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  return selected;
}

async function updatePreviewQuality(client, destination) {
  const quality = evaluateGuideQuality(destination);

  await client.query(
    `UPDATE mountains
     SET guide_status = 'preview',
         guide_quality_score = $2,
         guide_quality_issues = $3,
         guide_updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [destination.id, quality.score, quality.issues]
  );
}

async function promoteGuide(client, destination) {
  await client.query(
    `UPDATE mountains
     SET guide_status = 'guide_ready',
         guide_quality_score = $2,
         guide_quality_issues = '{}',
         description = $3,
         traveler_fit = $4,
         avoid_if = $5,
         best_seasons = $6,
         stay_style = $7,
         transport_notes = $8,
         planning_notes = $9,
         photo_verified = true,
         editorial_reviewed_at = CURRENT_TIMESTAMP,
         guide_updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [
      destination.id,
      destination.score,
      destination.description,
      destination.traveler_fit,
      destination.avoid_if,
      destination.best_seasons,
      destination.stay_style,
      destination.transport_notes,
      destination.planning_notes,
    ]
  );
}

async function auditDestinationGuides() {
  const limit = parseLimit();
  const destinations = await loadPublishedDestinations();
  const candidates = rankCandidates(destinations);
  const selected = selectBalancedGuides(candidates, limit);
  const selectedIds = new Set(selected.map((destination) => destination.id));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const destination of destinations) {
      if (!selectedIds.has(destination.id)) {
        await updatePreviewQuality(client, destination);
      }
    }

    for (const destination of selected) {
      await promoteGuide(client, destination);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const byType = selected.reduce((counts, destination) => {
    counts[destination.destination_type] = (counts[destination.destination_type] || 0) + 1;
    return counts;
  }, {});

  console.log(JSON.stringify({
    reviewedPublished: destinations.length,
    eligible: candidates.length,
    guideReady: selected.length,
    previews: destinations.length - selected.length,
    byType,
  }, null, 2));
}

auditDestinationGuides()
  .catch((error) => {
    console.error("Destination guide audit failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
