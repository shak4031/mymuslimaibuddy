const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('[DB] No DATABASE_URL set — running without database. Some features will be limited.');
      return null;
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) {
    console.log(`[DB-SKIP] No database: ${text.substring(0, 60)}`);
    return { rows: [] };
  }
  const start = Date.now();
  const result = await p.query(text, params);
  const duration = Date.now() - start;
  console.log(`[DB] ${text.substring(0, 80)}... ${duration}ms | ${result.rowCount} rows`);
  return result;
}

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  latitude DECIMAL,
  longitude DECIMAL,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prayer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL CHECK (prayer_name IN ('fajr','dhuhr','asr','maghrib','isha','fajr_sunnah','dhuhr_sunnah','witr')),
  prayer_date DATE NOT NULL,
  prayed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','prayed','missed','excused')),
  notified_1_at TIMESTAMPTZ,
  notified_2_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prayer_name, prayer_date)
);

CREATE TABLE IF NOT EXISTS quran_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  surah_number INT NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_number INT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  times_read INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_number, ayah_number)
);

CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  tone_used TEXT,
  user_message TEXT,
  ai_response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  notification_frequency TEXT DEFAULT 'normal' CHECK (notification_frequency IN ('low','normal','high')),
  quran_goal TEXT DEFAULT 'daily_ayah',
  calculation_method TEXT DEFAULT 'mwl',
  daily_hadith_enabled BOOLEAN DEFAULT TRUE,
  daily_ayah_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_records_user_date ON prayer_records(user_id, prayer_date);
CREATE INDEX IF NOT EXISTS idx_prayer_records_status ON prayer_records(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quran_progress_user ON quran_progress(user_id, surah_number);
`;

async function migrate() {
  console.log('[Migration] Running schema...');
  const p = getPool();
  if (!p) {
    console.error('[Migration] No DATABASE_URL configured');
    process.exit(1);
  }
  await p.query(SCHEMA);
  console.log('[Migration] Schema applied successfully');
  process.exit(0);
}

async function seed() {
  console.log('[Seed] No initial seed data needed — data comes from user usage');
  process.exit(0);
}

if (require.main === module) {
  const command = process.argv[2];
  if (command === 'migrate') migrate();
  else if (command === 'seed') seed();
  else console.log('Usage: node src/db.js [migrate|seed]');
}

module.exports = { query, getPool, migrate, SCHEMA };