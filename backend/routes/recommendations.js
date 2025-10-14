import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js'; // ⭐ IMPORT THIS

const router = express.Router();

// ==================== GET PERSONALIZED RECOMMENDATIONS (Public) ====================
// GET /api/recommendations?tags=beach,adventure&limit=12&userId=8
router.get('/', async (req, res) => {
  try {
    const { tags, limit = 12, userId } = req.query;

    let query = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.image_url,
        p.description,
        p.rating,
        p.price_per_person,
        p.duration_days,
        c.name as country_name,
        c.code as country_code,
        GROUP_CONCAT(DISTINCT t.name) as matching_tags,
        COUNT(DISTINCT pt.tag_id) as tag_match_count,
        COALESCE(v.total_views, 0) as views,
        COALESCE(l.like_count, 0) as likes
      FROM places p
      JOIN countries c ON p.country_id = c.id
      LEFT JOIN place_tags pt ON p.id = pt.place_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN (
        SELECT place_id, SUM(view_count) as total_views
        FROM views
        WHERE view_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY place_id
      ) v ON p.id = v.place_id
      LEFT JOIN (
        SELECT place_id, COUNT(*) as like_count
        FROM likes
        GROUP BY place_id
      ) l ON p.id = l.place_id
    `;

    const params = [];

    if (tags) {
      const tagArray = tags.split(',');
      const placeholders = tagArray.map(() => '?').join(',');
      query += ` WHERE t.name IN (${placeholders})`;
      params.push(...tagArray);
    }

    query += `
      GROUP BY p.id, p.name, p.image_url, p.description, p.rating, 
               p.price_per_person, p.duration_days, c.name, c.code
      ORDER BY tag_match_count DESC, p.rating DESC, views DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const [places] = await pool.query(query, params);

    res.json({
      success: true,
      data: places,
      count: places.length
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// ==================== GET TRENDING PLACES (Public) ====================
// GET /api/recommendations/trending?limit=10
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.image_url,
        p.description,
        p.rating,
        p.price_per_person,
        p.duration_days,
        c.name as country_name,
        c.code as country_code,
        COALESCE(v.total_views, 0) as views,
        COALESCE(l.like_count, 0) as likes
      FROM places p
      JOIN countries c ON p.country_id = c.id
      LEFT JOIN (
        SELECT place_id, SUM(view_count) as total_views
        FROM views
        WHERE view_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY place_id
      ) v ON p.id = v.place_id
      LEFT JOIN (
        SELECT place_id, COUNT(*) as like_count
        FROM likes
        GROUP BY place_id
      ) l ON p.id = l.place_id
      ORDER BY views DESC, likes DESC, p.rating DESC
      LIMIT ?
    `;

    const [places] = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: places,
      count: places.length
    });

  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending places'
    });
  }
});

// ==================== SAVE USER PREFERENCES (Protected - ⭐ authMiddleware) ====================
// POST /api/recommendations/preferences
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware
    const { selectedTags, budgetRange, preferredDuration, travelStyle, interests, quizCompleted, quizResults } = req.body;

    if (!selectedTags || selectedTags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one tag must be selected'
      });
    }

    // Convert arrays to JSON strings
    const selectedTagsJson = JSON.stringify(selectedTags);
    const interestsJson = interests ? JSON.stringify(interests) : null;
    const quizResultsJson = quizResults ? JSON.stringify(quizResults) : null;

    // Check if preferences already exist
    const [existing] = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Update existing preferences
      await pool.query(
        `UPDATE user_preferences 
         SET selected_tags = ?, budget_range = ?, preferred_duration = ?, 
             travel_style = ?, interests = ?, quiz_completed = ?, quiz_results = ?, 
             updated_at = NOW()
         WHERE user_id = ?`,
        [
          selectedTagsJson,
          budgetRange,
          preferredDuration,
          travelStyle,
          interestsJson,
          quizCompleted || false,
          quizResultsJson,
          userId
        ]
      );
    } else {
      // Insert new preferences
      await pool.query(
        `INSERT INTO user_preferences 
         (user_id, selected_tags, budget_range, preferred_duration, travel_style, interests, quiz_completed, quiz_results)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          selectedTagsJson,
          budgetRange,
          preferredDuration,
          travelStyle,
          interestsJson,
          quizCompleted || false,
          quizResultsJson
        ]
      );
    }

    res.json({
      success: true,
      message: 'Preferences saved successfully'
    });

  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save preferences'
    });
  }
});

// ==================== GET USER PREFERENCES (Protected - ⭐ authMiddleware) ====================
// GET /api/recommendations/preferences/:userId
router.get('/preferences/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // ⭐ IMPORTANT: Only allow users to access their own preferences (or admins)
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [preferences] = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (preferences.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No preferences found'
      });
    }

    const pref = preferences[0];

    res.json({
      success: true,
      data: {
        ...pref,
        selected_tags: JSON.parse(pref.selected_tags || '[]'),
        interests: JSON.parse(pref.interests || '[]'),
        quiz_results: JSON.parse(pref.quiz_results || '{}')
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences'
    });
  }
});

// ==================== GET OFFERS (Public) ====================
// GET /api/recommendations/offers?limit=6
router.get('/offers', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.image_url,
        p.description,
        p.rating,
        p.price_per_person,
        p.duration_days,
        c.name as country_name,
        '20' as discount_percentage
      FROM places p
      JOIN countries c ON p.country_id = c.id
      WHERE p.rating >= 4.0
      ORDER BY RAND()
      LIMIT ?
    `;

    const [offers] = await pool.query(query, [parseInt(limit)]);

    res.json({
      success: true,
      data: offers,
      count: offers.length
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offers'
    });
  }
});

export default router;