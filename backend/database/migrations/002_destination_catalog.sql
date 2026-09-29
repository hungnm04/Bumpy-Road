CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE mountains
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS elevation_m INTEGER,
  ADD COLUMN IF NOT EXISTS destination_type VARCHAR(40) NOT NULL DEFAULT 'mountain_town',
  ADD COLUMN IF NOT EXISTS source_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editorial_tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_description TEXT,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publication_status VARCHAR(20) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS search_document TSVECTOR;

UPDATE mountains
SET slug = regexp_replace(trim(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), '^-|-$', '', 'g')
  || '-' || id
WHERE slug IS NULL OR slug = '';

ALTER TABLE mountains
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mountains_slug_unique'
  ) THEN
    ALTER TABLE mountains ADD CONSTRAINT mountains_slug_unique UNIQUE (slug);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mountains_publication_status_check'
  ) THEN
    ALTER TABLE mountains
      ADD CONSTRAINT mountains_publication_status_check
      CHECK (publication_status IN ('draft', 'published', 'rejected'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION set_mountain_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug :=
      regexp_replace(trim(BOTH '-' FROM regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g')), '^-|-$', '', 'g')
      || '-' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mountains_set_slug ON mountains;
CREATE TRIGGER mountains_set_slug
BEFORE INSERT ON mountains
FOR EACH ROW EXECUTE FUNCTION set_mountain_slug();

CREATE TABLE IF NOT EXISTS mountain_sources (
  id SERIAL PRIMARY KEY,
  mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  provider VARCHAR(40) NOT NULL,
  external_id VARCHAR(120) NOT NULL,
  source_url TEXT NOT NULL,
  license_code VARCHAR(120),
  attribution_text TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, external_id)
);

CREATE TABLE IF NOT EXISTS mountain_media (
  id SERIAL PRIMARY KEY,
  mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  provider VARCHAR(40) NOT NULL,
  source_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  author TEXT,
  license_code VARCHAR(120),
  license_url TEXT,
  attribution_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, source_url)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(40) NOT NULL,
  mode VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  staged_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT ingestion_runs_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE OR REPLACE FUNCTION set_mountain_search_document()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_document :=
    to_tsvector(
      'simple',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.location, '') || ' ' ||
      coalesce(NEW.region, '') || ' ' ||
      coalesce(NEW.continent, '') || ' ' ||
      coalesce(NEW.destination_type, '') || ' ' ||
      coalesce(NEW.description, '') || ' ' ||
      array_to_string(coalesce(NEW.source_tags, '{}'), ' ') || ' ' ||
      array_to_string(coalesce(NEW.editorial_tags, '{}'), ' ')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mountains_set_search_document ON mountains;
CREATE TRIGGER mountains_set_search_document
BEFORE INSERT OR UPDATE OF name, location, region, continent, destination_type, description, source_tags, editorial_tags
ON mountains
FOR EACH ROW EXECUTE FUNCTION set_mountain_search_document();

UPDATE mountains
SET search_document =
  to_tsvector(
    'simple',
    coalesce(name, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(region, '') || ' ' ||
    coalesce(continent, '') || ' ' ||
    coalesce(destination_type, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    array_to_string(coalesce(source_tags, '{}'), ' ') || ' ' ||
    array_to_string(coalesce(editorial_tags, '{}'), ' ')
  );

CREATE INDEX IF NOT EXISTS idx_mountains_publication_status ON mountains(publication_status);
CREATE INDEX IF NOT EXISTS idx_mountains_country_code ON mountains(country_code);
CREATE INDEX IF NOT EXISTS idx_mountains_destination_type ON mountains(destination_type);
CREATE INDEX IF NOT EXISTS idx_mountains_search_document ON mountains USING GIN(search_document);
CREATE INDEX IF NOT EXISTS idx_mountains_name_trgm ON mountains USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mountain_sources_mountain_id ON mountain_sources(mountain_id);
CREATE INDEX IF NOT EXISTS idx_mountain_media_mountain_id ON mountain_media(mountain_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at ON ingestion_runs(started_at DESC);
