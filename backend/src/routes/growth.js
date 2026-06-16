/**
 * MyMuslimBuddy — Growth & Character Development Routes
 * 
 * These routes track the user's spiritual growth beyond just prayer counts.
 * They show how consistency in worship ripples into character change
 * — better patience, kindness, family relations, community impact.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { generateBuddyResponse } = require('../ai-buddy');

/**
 * GET /:deviceId/overview — Full spiritual growth overview
 * Returns: composite score, character breakdown, milestones, current streak context
 */
router.get('/:deviceId/overview', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await query('SELECT id, created_at FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const uid = user.rows[0].id;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Current streak
    const streakResult = await query(
      `WITH daily_counts AS (
         SELECT prayer_date,
                COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
         FROM prayer_records WHERE user_id = $1
         GROUP BY prayer_date ORDER BY prayer_date DESC
       )
       SELECT COUNT(*) AS streak FROM (
         SELECT prayer_date, all_prayed,
                SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC) AS break_group
         FROM daily_counts
       ) sub WHERE all_prayed = true AND break_group = 0`,
      [uid]
    );
    const streak = parseInt(streakResult.rows[0]?.streak || '0');

    // Best ever streak
    const bestStreak = await query(
      `WITH streaks AS (
         SELECT prayer_date, all_prayed,
                SUM(CASE WHEN all_prayed THEN 0 ELSE 1 END) OVER (ORDER BY prayer_date DESC) AS grp
         FROM (
           SELECT prayer_date,
                  COUNT(*) FILTER (WHERE status = 'prayed') = 5 AS all_prayed
           FROM prayer_records WHERE user_id = $1
           GROUP BY prayer_date
         ) daily
       )
       SELECT MAX(cnt) AS best FROM (
         SELECT COUNT(*) AS cnt FROM streaks WHERE all_prayed = true GROUP BY grp
       ) streak_groups`,
      [uid]
    );
    const bestStreakValue = parseInt(bestStreak.rows[0]?.best || '0');

    // Weekly stats
    const weekStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'prayed') AS prayed,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) AS total
       FROM prayer_records
       WHERE user_id = $1 AND prayer_date >= $2`,
      [uid, weekAgo]
    );

    // Character growth records (last 30 days)
    const charGrowth = await query(
      `SELECT record_date, prayer_completion, patience_score, gratitude_score,
              kindness_score, honesty_score, family_score, community_score
       FROM character_growth
       WHERE user_id = $1
       ORDER BY record_date DESC
       LIMIT 30`,
      [uid]
    );

    // Calculate trend: compare first 7 days vs last 7 days
    const recentGrowth = charGrowth.rows.slice(0, 7);
    const olderGrowth = charGrowth.rows.slice(-7);

    const avgRecent = recentGrowth.length > 0
      ? {
          patience: recentGrowth.reduce((s, r) => s + parseFloat(r.patience_score || 0), 0) / recentGrowth.length,
          gratitude: recentGrowth.reduce((s, r) => s + parseFloat(r.gratitude_score || 0), 0) / recentGrowth.length,
          kindness: recentGrowth.reduce((s, r) => s + parseFloat(r.kindness_score || 0), 0) / recentGrowth.length,
        }
      : null;

    const avgOlder = olderGrowth.length > 0
      ? {
          patience: olderGrowth.reduce((s, r) => s + parseFloat(r.patience_score || 0), 0) / olderGrowth.length,
          gratitude: olderGrowth.reduce((s, r) => s + parseFloat(r.gratitude_score || 0), 0) / olderGrowth.length,
          kindness: olderGrowth.reduce((s, r) => s + parseFloat(r.kindness_score || 0), 0) / olderGrowth.length,
        }
      : null;

    const trend = avgRecent && avgOlder
      ? {
          patience: Math.round((avgRecent.patience - avgOlder.patience) * 10) / 10,
          gratitude: Math.round((avgRecent.gratitude - avgOlder.gratitude) * 10) / 10,
          kindness: Math.round((avgRecent.kindness - avgOlder.kindness) * 10) / 10,
        }
      : null;

    // Milestones
    const milestones = await query(
      `SELECT milestone_type, title, description, achieved_at
       FROM spiritual_milestones
       WHERE user_id = $1
       ORDER BY achieved_at DESC
       LIMIT 10`,
      [uid]
    );

    // Recent behavior journal entries
    const journal = await query(
      `SELECT id, entry_date, entry_type, content, ai_reflection
       FROM behavior_journal
       WHERE user_id = $1 AND NOT is_private
       ORDER BY entry_date DESC
       LIMIT 5`,
      [uid]
    );

    // Composite "spiritual growth" score (0-100)
    const totalPossible = 35; // 5 × 7 days
    const weeklyPct = totalPossible > 0
      ? Math.round((parseInt(weekStats.rows[0]?.prayed || '0') / totalPossible) * 100)
      : 0;

    // Score = prayer completion weight + streak bonus + character development
    const prayerScore = weeklyPct * 0.4;
    const streakBonus = Math.min(streak / 30, 1) * 25; // 30-day streak = full bonus
    const charScore = avgRecent
      ? ((avgRecent.patience + avgRecent.gratitude + avgRecent.kindness) / 30) * 35
      : 0;
    const compositeScore = Math.round(prayerScore + streakBonus + charScore);

    // Determine spiritual stage
    const spiritualStage = streak >= 30 ? 'fruiting'
      : streak >= 7 ? 'blooming'
      : streak >= 3 ? 'sprouting'
      : 'seedling';

    res.json({
      success: true,
      data: {
        compositeScore,             // 0-100
        spiritualStage,              // seedling/sprouting/blooming/fruiting
        streak,
        bestStreak: bestStreakValue,
        weekly: {
          prayed: parseInt(weekStats.rows[0]?.prayed || '0'),
          pending: parseInt(weekStats.rows[0]?.pending || '0'),
          total: parseInt(weekStats.rows[0]?.total || '0'),
          percentage: weeklyPct,
        },
        characterGrowth: {
          recent: charGrowth.rows.slice(0, 7),
          trend,
          currentAverages: avgRecent ? {
            patience: Math.round(avgRecent.patience * 10) / 10,
            gratitude: Math.round(avgRecent.gratitude * 10) / 10,
            kindness: Math.round(avgRecent.kindness * 10) / 10,
          } : null,
        },
        milestones: milestones.rows,
        journal: journal.rows,
        userSince: user.rows[0].created_at,
      }
    });
  } catch (err) {
    console.error('[Growth/Overview] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /:deviceId/reflect — Add a behavior journal entry
 * Body: { entryType, content, isPrivate }
 * AI generates a reflection on the entry
 */
router.post('/:deviceId/reflect', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { entryType, content, isPrivate = true } = req.body;

    if (!entryType || !content) {
      return res.status(400).json({ success: false, error: 'entryType and content required' });
    }

    const validTypes = ['daily_reflection','gratitude_note','kindness_act','patience_moment',
      'family_moment','neighbor_deed','forgiveness','self_improvement','goal_setting'];
    if (!validTypes.includes(entryType)) {
      return res.status(400).json({ success: false, error: `Invalid type. Use: ${validTypes.join(', ')}` });
    }

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate AI reflection on the journal entry
    const aiResult = await generateBuddyResponse('character_reflection', '', {
      currentStreak: 0,
      growthFoci: [entryType.replace('_', ' ')],
    });

    const result = await query(
      `INSERT INTO behavior_journal (user_id, entry_date, entry_type, content, ai_reflection, is_private)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       RETURNING id, entry_date, entry_type, created_at`,
      [user.rows[0].id, entryType, content, aiResult.response || null, isPrivate]
    );

    res.json({
      success: true,
      data: {
        entry: result.rows[0],
        aiReflection: aiResult.response || null,
      }
    });
  } catch (err) {
    console.error('[Growth/Reflect] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /:deviceId/preferences — Set growth foci and user role
 * Body: { growthFoci: string[], userRole: string }
 */
router.post('/:deviceId/preferences', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { growthFoci = [], userRole = '' } = req.body;

    const user = await query('SELECT id FROM users WHERE device_id = $1', [deviceId]);
    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Store in user_preferences metadata column
    await query(
      `UPDATE user_preferences SET
        metadata = COALESCE(metadata, '{}') || $2::jsonb,
        updated_at = NOW()
       WHERE user_id = $1`,
      [user.rows[0].id, JSON.stringify({ growthFoci, userRole })]
    );

    res.json({ success: true, data: { growthFoci, userRole } });
  } catch (err) {
    console.error('[Growth/Preferences] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /:deviceId/preferences — Get current preferences
 */
router.get('/:deviceId/preferences', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await query(
      `SELECT u.id, up.metadata
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.device_id = $1`,
      [deviceId]
    );

    if (!user.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const meta = user.rows[0]?.metadata || {};
    res.json({
      success: true,
      data: {
        growthFoci: meta.growthFoci || [],
        userRole: meta.userRole || '',
      }
    });
  } catch (err) {
    console.error('[Growth/Preferences] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;