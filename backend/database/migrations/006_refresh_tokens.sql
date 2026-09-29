-- Migration 006: Refresh Token Management Tables
-- Purpose: Add refresh token tracking for rotation and revocation

-- Table to store active refresh tokens (for validation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    token_jti VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT refresh_tokens_username_jti UNIQUE (username, token_jti)
);

-- Table to store revoked refresh tokens (for checking if token was invalidated)
CREATE TABLE IF NOT EXISTS revoked_refresh_tokens (
    token_jti VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_username ON refresh_tokens(username);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(token_jti);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_refresh_tokens(expires_at);

-- Function to clean up expired revoked tokens (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM revoked_refresh_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale refresh tokens (old tokens without matching revoked entry)
CREATE OR REPLACE FUNCTION cleanup_stale_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete tokens that are older than 14 days and not in revoked list
    DELETE FROM refresh_tokens
    WHERE created_at < NOW() - INTERVAL '14 days'
      AND token_jti NOT IN (SELECT token_jti FROM revoked_refresh_tokens);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
