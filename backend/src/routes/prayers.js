const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { PrayerTimesEngine } = require('../prayer-times');
const { generateBuddyResponse } = require('../ai-buddy');

// Register or get user by device_id
router.post('/register', async (req, res) => {
  try {
    const { deviceId, timezone, latitude, longitude } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'deviceId required' });
    }

    const result = await query(
      `INSERT INTO users (device_id, timezone, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (device_id)
       DO UPDATE SET timezone = COALESCE($2, users.timezone),
                     latitude = COALESCE($3, users.latitude),
                     longitude = COALESCE($4, users.longitude)
       RETURNING id, device_id, created_at`,
      [deviceId, timezone || 'UTC', latitude || null, longitude || null]
    );

    // Ensure user_preferences exist
    await query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [result.rows[0].id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Prayers/Register] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get today's prayer records
router.get('/:deviceId/today', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const user = await query('SELECT id, latitude, longitude, timezone FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const u = user.rows[0];
    const records = await query(
      `SELECT prayer_name, status, prayed_at, notified_1_at, notified_2_at
       FROM prayer_records
       WHERE user_id = $1 AND prayer_date = $2
       ORDER BY
         CASE prayer_name
           WHEN 'fajr' THEN 1 WHEN 'dhuhr' THEN 2
           WHEN 'asr' THEN 3 WHEN 'maghrib' THEN 4
           WHEN 'isha' THEN 5 ELSE 6
         END`,
      [u.id, today]
    );

    // Get prayer times
    const lat = parseFloat(u.latitude) || 21.4225;
    const lng = parseFloat(u.longitude) || 39.8262;
    const tz = u.timezone || 'UTC';
    const engine = new PrayerTimesEngine(lat, lng, tz);
    const times = engine.getTimes();
    const nextPrayer = engine.getNextPrayer();

    // Calculate streak
    const streakResult = await query(
      `WITH daily_counts AS (
         SELECT prayer_date,
                COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
         FROM prayer_records
         WHERE user_id = $1
         GROUP BY prayer_date
         ORDER BY prayer_date DESC
       )
       SELECT COUNT(*) AS current_streak FROM (
         SELECT prayer_date, all_prayed,
                SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC ROWS UNBOUNDED PRECEDING) AS break_group
         FROM daily_counts
       ) sub
       WHERE all_prayed = true AND break_group = 0`,
      [u.id]
    );

    // Calculate today's progress
    const todayProgress = await query(
      `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS prayed_count
       FROM prayer_records
       WHERE user_id = $1 AND prayer_date = $2`,
      [u.id, today]
    );

    // Ensure all prayers exist for today (create missing ones)
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const existing = records.rows.map(r => r.prayer_name);
    for (const name of prayerNames) {
      if (!existing.includes(name)) {
        await query(
          `INSERT INTO prayer_records (user_id, prayer_name, prayer_date, status)
           VALUES ($1, $2, $3, 'pending')
           ON CONFLICT (user_id, prayer_name, prayer_date) DO NOTHING`,
          [u.id, name, today]
        );
      }
    }

    // Re-fetch after ensuring all exist
    const fullRecords = await query(
      `SELECT prayer_name, status, prayed_at, notified_1_at, notified_2_at
       FROM prayer_records
       WHERE user_id = $1 AND prayer_date = $2
       ORDER BY
         CASE prayer_name
           WHEN 'fajr' THEN 1 WHEN 'dhuhr' THEN 2
           WHEN 'asr' THEN 3 WHEN 'maghrib' THEN 4
           WHEN 'isha' THEN 5 ELSE 6
         END`,
      [u.id, today]
    );

    res.json({
      success: true,
      data: {
        prayers: fullRecords.rows,
        prayerTimes: times,
        nextPrayer: nextPrayer ? {
          name: nextPrayer.name,
          time: nextPrayer.time.toISOString(),
          remainingMinutes: nextPrayer.remainingMinutes,
          isTomorrow: nextPrayer.isTomorrow || false,
        } : null,
        progress: {
          today: parseInt(todayProgress.rows[0]?.prayed_count || '0'),
          total: 5,
          percentage: Math.round((parseInt(todayProgress.rows[0]?.prayed_count || '0') / 5) * 100),
        },
        streak: parseInt(streakResult.rows[0]?.current_streak || '0'),
      }
    });
  } catch (err) {
    console.error('[Prayers/Today] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark a prayer as prayed
router.post('/:deviceId/mark', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { prayerName, status = 'prayed' } = req.body;

    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'fajr_sunnah', 'dhuhr_sunnah', 'witr'].includes(prayerName)) {
      return res.status(400).json({ success: false, error: 'Invalid prayer name' });
    }

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    await query(
      `INSERT INTO prayer_records (user_id, prayer_name, prayer_date, status, prayed_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, prayer_name, prayer_date)
       DO UPDATE SET status = $4, prayed_at = NOW(), updated_at = NOW()`,
      [user.rows[0].id, prayerName, today, status]
    );

    // Get updated progress for AI context
    const streak = await query(
      `WITH daily_counts AS (
         SELECT prayer_date,
                COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
         FROM prayer_records
         WHERE user_id = $1
         GROUP BY prayer_date
         ORDER BY prayer_date DESC
       )
       SELECT COUNT(*) AS current_streak FROM (
         SELECT prayer_date, all_prayed,
                SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC ROWS UNBOUNDED PRECEDING) AS break_group
         FROM daily_counts
       ) sub
       WHERE all_prayed = true AND break_group = 0`,
      [user.rows[0].id]
    );

    const todayPrayed = await query(
      `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS count FROM prayer_records
       WHERE user_id = $1 AND prayer_date = $2`,
      [user.rows[0].id, today]
    );

    const streakVal = parseInt(streak.rows[0]?.current_streak || '0');

    // Respond immediately with prayer confirmation — don't wait for AI
    res.json({
      success: true,
      data: {
        prayer: prayerName,
        status,
        progress: {
          today: parseInt(todayPrayed.rows[0]?.count || '0'),
          total: 5,
          percentage: Math.round((parseInt(todayPrayed.rows[0]?.count || '0') / 5) * 100),
        },
        streak: streakVal,
        message: 'MashaAllah! ✓',
      }
    });

    // Fire-and-forget: AI encouragement + logging in background
    generateBuddyResponse('prayer_completed', '', {
      prayerName,
      currentStreak: streakVal,
    }).then(aiResult => {
      query(
        `INSERT INTO ai_interactions (user_id, context_type, tone_used, user_message, ai_response)
         VALUES ($1, 'prayer_completed', 'encouraging', $2, $3)`,
        [user.rows[0].id, `Marked ${prayerName} as prayed`, aiResult.response || aiResult.fallback?.[0] || 'MashaAllah!']
      ).catch(e => console.error('[Prayers/Mark-AI] Log error:', e.message));
    }).catch(e => console.error('[Prayers/Mark-AI] Error:', e.message));
  } catch (err) {
    console.error('[Prayers/Mark] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Undo / unmark a prayer — revert from 'prayed' back to 'pending'
router.post('/:deviceId/unmark', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { prayerName } = req.body;

    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'fajr_sunnah', 'dhuhr_sunnah', 'witr'].includes(prayerName)) {
      return res.status(400).json({ success: false, error: 'Invalid prayer name' });
    }

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    await query(
      `UPDATE prayer_records SET status = 'pending', prayed_at = NULL, updated_at = NOW()
       WHERE user_id = $1 AND prayer_name = $2 AND prayer_date = $3`,
      [user.rows[0].id, prayerName, today]
    );

    // Recalculate progress after undo
    const [streakResult, todayPrayed] = await Promise.all([
      query(
        `WITH daily_counts AS (
           SELECT prayer_date, COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
           FROM prayer_records WHERE user_id = $1
           GROUP BY prayer_date ORDER BY prayer_date DESC
         )
         SELECT COUNT(*) AS current_streak FROM (
           SELECT prayer_date, all_prayed,
                  SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC ROWS UNBOUNDED PRECEDING) AS break_group
           FROM daily_counts
         ) sub WHERE all_prayed = true AND break_group = 0`,
        [user.rows[0].id]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'prayed') AS count FROM prayer_records
         WHERE user_id = $1 AND prayer_date = $2`,
        [user.rows[0].id, today]
      ),
    ]);

    res.json({
      success: true,
      data: {
        prayer: prayerName,
        status: 'pending',
        progress: {
          today: parseInt(todayPrayed.rows[0]?.count || '0'),
          total: 5,
          percentage: Math.round((parseInt(todayPrayed.rows[0]?.count || '0') / 5) * 100),
        },
        streak: parseInt(streakResult.rows[0]?.current_streak || '0'),
        message: 'Undone ✓',
      }
    });
  } catch (err) {
    console.error('[Prayers/Unmark] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Record a notification check (for nudge scheduling)
router.post('/:deviceId/notified', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { prayerName, nudgeNumber = 1 } = req.body;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const column = nudgeNumber === 1 ? 'notified_1_at' : 'notified_2_at';

    await query(
      `UPDATE prayer_records SET ${column} = NOW()
       WHERE user_id = $1 AND prayer_name = $2 AND prayer_date = $3`,
      [user.rows[0].id, prayerName, today]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Prayers/Notified] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get weekly summary
router.get('/:deviceId/weekly', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const records = await query(
      `SELECT prayer_date, prayer_name, status
       FROM prayer_records
       WHERE user_id = $1 AND prayer_date >= $2
       ORDER BY prayer_date DESC, prayer_name`,
      [user.rows[0].id, weekAgoStr]
    );

    // Aggregate by day
    const daily = {};
    for (const row of records.rows) {
      if (!daily[row.prayer_date]) {
        daily[row.prayer_date] = { date: row.prayer_date, prayed: 0, total: 0, prayers: [] };
      }
      daily[row.prayer_date].total++;
      if (row.status === 'prayed') daily[row.prayer_date].prayed++;
      daily[row.prayer_date].prayers.push({ name: row.prayer_name, status: row.status });
    }

    const totalPrayed = records.rows.filter(r => r.status === 'prayed').length;
    const totalPossible = 35; // 5 prayers × 7 days

    res.json({
      success: true,
      data: {
        daily: Object.values(daily).sort((a, b) => b.date.localeCompare(a.date)),
        summary: {
          totalPrayed,
          totalPossible,
          percentage: Math.round((totalPrayed / totalPossible) * 100),
        },
      }
    });
  } catch (err) {
    console.error('[Prayers/Weekly] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;