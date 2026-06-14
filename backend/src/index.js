const express = require('express');
const cors = require('cors');
const { getPool, SCHEMA } = require('./db');
const prayersRouter = require('./routes/prayers');
const quranRouter = require('./routes/quran');
const hadithRouter = require('./routes/hadith');
const buddyRouter = require('./routes/buddy');
const preferenceRouter = require('./routes/preferences');
const { getNextPrayer, getAllPrayerTimes } = require('./prayer-times');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mymuslimaibuddy',
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL ? 'connected' : 'not-configured'
  });
});

// V1 API routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/prayers`, prayersRouter);
app.use(`${API_PREFIX}/quran`, quranRouter);
app.use(`${API_PREFIX}/hadith`, hadithRouter);
app.use(`${API_PREFIX}/buddy`, buddyRouter);
app.use(`${API_PREFIX}/preferences`, preferenceRouter);

// Prayer times info (public, no auth needed)
app.get('/api/v1/prayer-times', async (req, res) => {
  try {
    const { latitude, longitude, timezone } = req.query;
    const lat = parseFloat(latitude) || 21.4225;
    const lng = parseFloat(longitude) || 39.8262;
    const tz = timezone || 'Asia/Riyadh';

    const times = await getAllPrayerTimes(lat, lng, tz);
    const next = await getNextPrayer(lat, lng, tz);

    res.json({
      success: true,
      data: {
        times,
        nextPrayer: next ? {
          name: next.name,
          time: next.time.toISOString(),
          remainingMinutes: next.remainingMinutes
        } : null
      }
    });
  } catch (err) {
    console.error('[PrayerTimes] Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to calculate prayer times' });
  }
});

// Auto-migrate on startup
async function init() {
  const pool = getPool();
  if (pool) {
    try {
      console.log('[Init] Running schema migration...');
      await pool.query(SCHEMA);
      console.log('[Init] Schema ready');
    } catch (err) {
      console.error('[Init] Migration failed:', err.message);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] MyMuslimBuddy API running on port ${PORT}`);
    console.log(`[Server] Health: http://0.0.0.0:${PORT}/health`);
  });
}

init();