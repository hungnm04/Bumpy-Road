ALTER TABLE mountains
  ADD COLUMN IF NOT EXISTS guide_status VARCHAR(20) NOT NULL DEFAULT 'preview',
  ADD COLUMN IF NOT EXISTS guide_quality_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guide_quality_issues TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS traveler_fit TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avoid_if TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS best_seasons TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stay_style TEXT,
  ADD COLUMN IF NOT EXISTS transport_notes TEXT,
  ADD COLUMN IF NOT EXISTS planning_notes TEXT,
  ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS editorial_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guide_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mountains_guide_status_check'
  ) THEN
    ALTER TABLE mountains
      ADD CONSTRAINT mountains_guide_status_check
      CHECK (guide_status IN ('preview', 'guide_ready'));
  END IF;
END;
$$;

UPDATE mountains m
SET photo_verified = true
WHERE EXISTS (
  SELECT 1
  FROM mountain_media media
  WHERE media.mountain_id = m.id
    AND media.is_primary = true
    AND media.thumbnail_url LIKE 'https://%'
);

CREATE INDEX IF NOT EXISTS idx_mountains_guide_status ON mountains(guide_status);
CREATE INDEX IF NOT EXISTS idx_mountains_public_guide_status
  ON mountains(publication_status, guide_status);
