-- Cloud Mind Social — inquiries, admin accounts, sessions.
-- Applied with: npx wrangler d1 migrations apply cloud-mind-social --remote

CREATE TABLE IF NOT EXISTS admin_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS inquiries (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  business   TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  stage      TEXT NOT NULL,
  message    TEXT,
  -- new | reading | replied | archived
  status     TEXT NOT NULL DEFAULT 'new',
  source     TEXT NOT NULL DEFAULT 'website',
  ip_hash    TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status  ON inquiries(status, created_at DESC);

-- Replies she sends from the admin inbox.
CREATE TABLE IF NOT EXISTS inquiry_replies (
  id           TEXT PRIMARY KEY,
  inquiry_id   TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  author_id    TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name  TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  -- sent | failed
  delivery     TEXT NOT NULL DEFAULT 'sent',
  provider_id  TEXT,
  error        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_replies_inquiry ON inquiry_replies(inquiry_id, created_at);

-- Private notes — never emailed to anyone.
CREATE TABLE IF NOT EXISTS inquiry_notes (
  id          TEXT PRIMARY KEY,
  inquiry_id  TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  author_id   TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_inquiry ON inquiry_notes(inquiry_id, created_at);

-- Fixed-window counters backing both form-spam and login throttling.
CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL DEFAULT 0,
  expires_at  INTEGER NOT NULL
);
