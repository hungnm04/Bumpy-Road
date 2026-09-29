-- Migration 008: Security Hardening
-- Purpose: Account lockout, audit log, email verification, breach detection

---------------------------------------------------------------
-- 1. Account lockout tracking
---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_lockout (
    username VARCHAR(50) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_lockout_locked ON account_lockout(locked_until)
    WHERE locked_until IS NOT NULL;

---------------------------------------------------------------
-- 2. Admin audit log
---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_username VARCHAR(50) NOT NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(60),
    resource_id VARCHAR(120),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log(actor_username);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

COMMENT ON TABLE admin_audit_log IS 'Immutable log of all admin actions for compliance and incident response';

---------------------------------------------------------------
-- 3. Email verification tokens
---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verif_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verif_username ON email_verification_tokens(username);
CREATE INDEX IF NOT EXISTS idx_email_verif_expires ON email_verification_tokens(expires_at)
    WHERE verified_at IS NULL;

---------------------------------------------------------------
-- 4. Users table — email verified flag
---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

---------------------------------------------------------------
-- 5. Add breach_checked flag (for HIBP tracking)
---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS breach_checked_at TIMESTAMPTZ;

---------------------------------------------------------------
-- 6. Cleanup function for expired verification tokens
---------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM email_verification_tokens
    WHERE expires_at < NOW() AND verified_at IS NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------
-- 7. Grant / revoke admin (separate table for clarity)
---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_role_changes (
    id SERIAL PRIMARY KEY,
    admin_username VARCHAR(50) NOT NULL,
    target_username VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'promoted' | 'demoted'
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admin_role_changes_action_check CHECK (action IN ('promoted', 'demoted'))
);

CREATE INDEX IF NOT EXISTS idx_admin_role_changes_target ON admin_role_changes(target_username);
CREATE INDEX IF NOT EXISTS idx_admin_role_changes_admin ON admin_role_changes(admin_username);
