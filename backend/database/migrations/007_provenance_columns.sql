-- Migration 007: Provenance columns on mountains
-- Phase 6 of master_prompt.md: every record traceable to source

ALTER TABLE mountains
  ADD COLUMN IF NOT EXISTS source VARCHAR(40),
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS license_code VARCHAR(120),
  ADD COLUMN IF NOT EXISTS attribution TEXT,
  ADD COLUMN IF NOT EXISTS attribution_url TEXT,
  ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completeness_score INTEGER NOT NULL DEFAULT 0;

-- Idempotency for re-runs of ingestion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mountains_source_unique'
  ) THEN
    ALTER TABLE mountains
      ADD CONSTRAINT mountains_source_unique UNIQUE (source, source_id);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_mountains_source ON mountains(source);
CREATE INDEX IF NOT EXISTS idx_mountains_completeness ON mountains(completeness_score DESC);