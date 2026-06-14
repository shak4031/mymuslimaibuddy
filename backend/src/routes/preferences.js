const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Get user preferences
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const prefs = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [user.rows[0].id]
    );

    if (!prefs.rows.length) {
      // Create defaults
      await query(
        'INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [user.rows[0].id]
      );
      return res.json({
        success: true,
        data: {
          notification_frequency: 'normal',
          quran_goal: 'daily_ayah',
          calculation_method: 'mwl',
          daily_hadith_enabled: true,
          daily_ayah_enabled: true,
        }
      });
    }

    res.json({ success: true, data: prefs.rows[0] });
  } catch (err) {
    console.error('[Preferences/Get] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update preferences
router.put('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const {
      notification_frequency,
      quran_goal,
      calculation_method,
      daily_hadith_enabled,
      daily_ayah_enabled,
    } = req.body;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await query(
      `UPDATE user_preferences SET
        notification_frequency = COALESCE($1, notification_frequency),
        quran_goal = COALESCE($2, quran_goal),
        calculation_method = COALESCE($3, calculation_method),
        daily_hadith_enabled = COALESCE($4, daily_hadith_enabled),
        daily_ayah_enabled = COALESCE($5, daily_ayah_enabled),
        updated_at = NOW()
      WHERE user_id = $6`,
      [
        notification_frequency || null,
        quran_goal || null,
        calculation_method || null,
        daily_hadith_enabled !== undefined ? daily_hadith_enabled : null,
        daily_ayah_enabled !== undefined ? daily_ayah_enabled : null,
        user.rows[0].id,
      ]
    );

    const prefs = await query('SELECT * FROM user_preferences WHERE user_id = $1', [user.rows[0].id]);

    res.json({ success: true, data: prefs.rows[0] });
  } catch (err) {
    console.error('[Preferences/Update] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;