-- ============================================================
-- FILE: server/db/schema.sql
-- ROLE: طرح کامل دیتابیس BarakatHub — Cloudflare D1 (SQLite)
-- PROJECT: BarakatHub Karbala Backend
-- VERSION: 1.0.0
-- ============================================================
-- اجرا در Cloudflare D1:
--   wrangler d1 execute barakathub-db --file=server/db/schema.sql
-- یا از پنل Cloudflare → D1 → barakathub-db → Console
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ════════════════════════════════════════════════════════════
-- ۱. جدول کاربران
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            TEXT      PRIMARY KEY,          -- Google profile.id
  email         TEXT      NOT NULL UNIQUE,
  name          TEXT      NOT NULL DEFAULT '',
  avatar        TEXT      NOT NULL DEFAULT '',
  role          TEXT      NOT NULL DEFAULT 'user'
                          CHECK(role IN ('user','admin','moderator')),
  is_active     INTEGER   NOT NULL DEFAULT 1,   -- 0=banned
  created_at    TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ════════════════════════════════════════════════════════════
-- ۲. جدول آیات / تدبرات
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ayahs (
  id                   TEXT    PRIMARY KEY,     -- مثال: surah2_ayah255
  surah_num            INTEGER,
  ayah_num             INTEGER,
  surah_name           TEXT    NOT NULL DEFAULT '',
  arabic               TEXT    NOT NULL,
  summary_fa           TEXT    NOT NULL DEFAULT '',
  tadabbur_fa          TEXT    NOT NULL DEFAULT '',
  author               TEXT    NOT NULL DEFAULT '',
  audio_url            TEXT    NOT NULL DEFAULT '',
  video_url            TEXT    NOT NULL DEFAULT '',
  extracted_audio_url  TEXT    NOT NULL DEFAULT '',
  -- دوبله ۷ زبان
  dubbed_ar            TEXT    NOT NULL DEFAULT '',
  dubbed_ur            TEXT    NOT NULL DEFAULT '',
  dubbed_az            TEXT    NOT NULL DEFAULT '',
  dubbed_tr            TEXT    NOT NULL DEFAULT '',
  dubbed_ru            TEXT    NOT NULL DEFAULT '',
  dubbed_en            TEXT    NOT NULL DEFAULT '',
  dubbed_id            TEXT    NOT NULL DEFAULT '',
  -- صوت دوبله ۷ زبان
  audio_ar             TEXT    NOT NULL DEFAULT '',
  audio_ur             TEXT    NOT NULL DEFAULT '',
  audio_az             TEXT    NOT NULL DEFAULT '',
  audio_tr             TEXT    NOT NULL DEFAULT '',
  audio_ru             TEXT    NOT NULL DEFAULT '',
  audio_en             TEXT    NOT NULL DEFAULT '',
  audio_id             TEXT    NOT NULL DEFAULT '',
  published            INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_ayahs_surah     ON ayahs(surah_num);
CREATE INDEX IF NOT EXISTS idx_ayahs_published ON ayahs(published);

-- ════════════════════════════════════════════════════════════
-- ۳. جدول کدهای معرف
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id      TEXT    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code         TEXT    NOT NULL UNIQUE,         -- مثال: BRK-A7K2
  referred_by  TEXT,                            -- کد معرف که این کاربر با آن آمده
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(code);

-- ════════════════════════════════════════════════════════════
-- ۴. جدول ثبت معرفی‌ها
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT    NOT NULL DEFAULT 'visit'
               CHECK(type IN ('visit','purchase')),
  section      TEXT,                            -- null=عمومی  'quran'=دانشگاه
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(referrer_id, referred_id)              -- هر کاربر فقط یک‌بار ثبت می‌شود
);

CREATE INDEX IF NOT EXISTS idx_ref_entries_referrer ON referral_entries(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ref_entries_type     ON referral_entries(type);

-- ════════════════════════════════════════════════════════════
-- ۵. جدول جوایز معرف
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_rewards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config_id   TEXT    NOT NULL,
  at_count    INTEGER NOT NULL,
  reward_type TEXT    NOT NULL,
  section     TEXT,
  granted_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at  TEXT    NOT NULL,
  UNIQUE(user_id, config_id, at_count)
);

CREATE INDEX IF NOT EXISTS idx_ref_rewards_user    ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_ref_rewards_expires ON referral_rewards(expires_at);

-- ════════════════════════════════════════════════════════════
-- ۶. جدول تنظیمات جوایز (ادمین)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS prize_configs (
  id          TEXT    PRIMARY KEY,             -- مثال: g1, s1
  scope       TEXT    NOT NULL DEFAULT 'global'
              CHECK(scope IN ('global','section')),
  type        TEXT    NOT NULL CHECK(type IN ('visit','purchase')),
  threshold   INTEGER NOT NULL,
  reward      TEXT    NOT NULL,
  section     TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- داده‌های پیش‌فرض جوایز
INSERT OR IGNORE INTO prize_configs VALUES
  ('g1','global','visit',   10,'premium_1month', NULL,   1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('g2','global','visit',   25,'premium_3month', NULL,   1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('g3','global','visit',   50,'premium_6month', NULL,   1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('s1','section','purchase', 3,'quran_1month',  'quran',1, strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('s2','section','purchase',10,'quran_3month',  'quran',1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- ════════════════════════════════════════════════════════════
-- ۷. جدول لاگ امنیتی
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS security_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  TEXT,
  ip          TEXT,
  method      TEXT,
  path        TEXT,
  user_agent  TEXT,
  user_id     TEXT,
  event_type  TEXT    NOT NULL DEFAULT 'SECURITY_AUDIT',
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_security_logs_ip   ON security_logs(ip);
CREATE INDEX IF NOT EXISTS idx_security_logs_date ON security_logs(created_at);
