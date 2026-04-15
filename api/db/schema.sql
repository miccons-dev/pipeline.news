-- Pipeline.news referral system — run once to initialise the database
-- Usage: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Main invites table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invites (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  token          CHAR(64)     UNIQUE NOT NULL,
  referrer_email VARCHAR(254) NOT NULL,
  invited_email  VARCHAR(254) NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  -- Same referrer cannot invite the same email twice
  UNIQUE (referrer_email, invited_email)
);

CREATE INDEX IF NOT EXISTS idx_invites_token      ON invites (token);
CREATE INDEX IF NOT EXISTS idx_invites_referrer   ON invites (referrer_email);
CREATE INDEX IF NOT EXISTS idx_invites_invited    ON invites (invited_email);
-- Partial index for efficient expiry sweeps
CREATE INDEX IF NOT EXISTS idx_invites_expires    ON invites (expires_at)
  WHERE status = 'pending';

-- ── Per-referrer aggregated stats ─────────────────────────────
CREATE TABLE IF NOT EXISTS referral_stats (
  email            VARCHAR(254) PRIMARY KEY,
  invites_sent     INTEGER      NOT NULL DEFAULT 0,
  invites_accepted INTEGER      NOT NULL DEFAULT 0,
  last_invite_at   TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
