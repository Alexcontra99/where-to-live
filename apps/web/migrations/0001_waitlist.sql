-- Waitlist sign-ups. One row per email; repeated sign-ups are ignored (INSERT OR IGNORE).
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  city TEXT NOT NULL,
  locale TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing',
  -- Date of the privacy policy shown when consent was given (src/config.ts PRIVACY_VERSION).
  policy_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_city ON waitlist (city);
