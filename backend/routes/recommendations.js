import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ==================== GET RECOMMENDED PLACES ====================
// GET /api/recommendations?tags=introvert,peace&limit=12
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
        ps.total_views,
        ps.total_likes,
        ps.trending_score,
        GROUP_CONCAT(DISTINCT t.name) as place_tags,
        GROUP_CONCAT(DISTINCT t.icon) as tag_icons,
        (
          SELECT COUNT(*) 
          FROM likes l 
          WHERE l.place_id = p.id AND l.user_id = ?
        ) as is_liked
      FROM places p
      JOIN countries c ON p.country_id = c.id
      LEFT JOIN place_stats ps ON p.id = ps.place_id
      LEFT JOIN place_tags pt ON p.id = pt.place_id
      LEFT JOIN tags t ON pt.tag_id = t.id
    `;

    const queryParams = [userId || null];

    // Filter by personality tags if provided
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      const placeholders = tagArray.map(() => '?').join(',');
      
      query += `
        WHERE p.id IN (
          SELECT DISTINCT pt2.place_id 
          FROM place_tags pt2
          JOIN tags t2 ON pt2.tag_id = t2.id
          WHERE t2.name IN (${placeholders})
        )
      `;
      queryParams.push(...tagArray);
    }

    query += `
      GROUP BY p.id, p.name, p.image_url, p.description, p.rating, 
               p.price_per_person, p.duration_days, c.name, c.code,
               ps.total_views, ps.total_likes, ps.trending_score
      ORDER BY 
        CASE 
          WHEN ? IS NOT NULL THEN ps.trending_score
          ELSE (ps.trending_score * 0.6 + p.rating * 0.4)
        END DESC
      LIMIT ?
    `;

    queryParams.push(tags || null, parseInt(limit));

    const [places] = await pool.query(query, queryParams);

    // Process results
    const processedPlaces = places.map(place => ({
      ...place,
      place_tags: place.place_tags ? place.place_tags.split(',') : [],
      tag_icons: place.tag_icons ? place.tag_icons.split(',') : [],
      is_liked: place.is_liked > 0
    }));

    res.json({
      success: true,
      count: processedPlaces.length,
      data: processedPlaces
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});


// ==================== GET TRENDING PLACES ====================
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
        ps.total_views,
        ps.views_last_7_days,
        ps.total_likes,
        ps.trending_score,
        GROUP_CONCAT(DISTINCT t.name) as place_tags,
        GROUP_CONCAT(DISTINCT t.icon) as tag_icons
      FROM places p
      JOIN countries c ON p.country_id = c.id
      LEFT JOIN place_stats ps ON p.id = ps.place_id
      LEFT JOIN place_tags pt ON p.id = pt.place_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id, p.name, p.image_url, p.description, p.rating,
               p.price_per_person, p.duration_days, c.name, c.code,
               ps.total_views, ps.views_last_7_days, ps.total_likes, ps.trending_score
      ORDER BY ps.trending_score DESC, ps.views_last_7_days DESC
      LIMIT ?
    `;

    const [places] = await pool.query(query, [parseInt(limit)]);

    const processedPlaces = places.map(place => ({
      ...place,
      place_tags: place.place_tags ? place.place_tags.split(',') : [],
      tag_icons: place.tag_icons ? place.tag_icons.split(',') : []
    }));

    res.json({
      success: true,
      count: processedPlaces.length,
      data: processedPlaces
    });

  } catch (error) {
    console.error('Get trending places error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending places'
    });
  }
});


// ==================== GET ACTIVE OFFERS ====================
// GET /api/recommendations/offers?limit=6
router.get('/offers', async (req, res) => {
  try {
    const { limit = 6, userId } = req.query;

    const query = `
      SELECT 
        o.id,
        o.title,
        o.description,
        o.old_price,
        o.new_price,
        o.discount_percent,
        o.valid_until,
        o.spots_left,
        p.id as place_id,
        p.name as place_name,
        p.image_url,
        p.rating,
        p.duration_days,
        c.name as country_name,
        c.code as country_code,
        DATEDIFF(o.valid_until, NOW()) as days_remaining,
        (
          SELECT COUNT(*) 
          FROM likes l 
          WHERE l.place_id = p.id AND l.user_id = ?
        ) as is_liked
      FROM offers o
      JOIN places p ON o.place_id = p.id
      JOIN countries c ON p.country_id = c.id
      WHERE o.is_active = TRUE 
        AND o.valid_until > NOW()
      ORDER BY o.discount_percent DESC, o.valid_until ASC
      LIMIT ?
    `;

    const [offers] = await pool.query(query, [userId || null, parseInt(limit)]);

    const processedOffers = offers.map(offer => ({
      ...offer,
      is_liked: offer.is_liked > 0,
      is_expiring_soon: offer.days_remaining <= 3,
      is_limited: offer.spots_left <= 5
    }));

    res.json({
      success: true,
      count: processedOffers.length,
      data: processedOffers
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offers'
    });
  }
});


// ==================== GET ALL TAGS ====================
// GET /api/recommendations/tags
router.get('/tags', async (req, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM tags';
    const params = [];

    if (type) {
      query += ' WHERE tag_type = ?';
      params.push(type);
    }

    query += ' ORDER BY tag_type, name';

    const [tags] = await pool.query(query, params);

    // Group by type
    const groupedTags = tags.reduce((acc, tag) => {
      if (!acc[tag.tag_type]) {
        acc[tag.tag_type] = [];
      }
      acc[tag.tag_type].push(tag);
      return acc;
    }, {});

    res.json({
      success: true,
      count: tags.length,
      data: tags,
      grouped: groupedTags
    });

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
});


// ==================== SAVE USER PREFERENCES (Protected) ====================
// POST /api/recommendations/preferences
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      selectedTags,
      budgetRange,
      preferredDuration,
      travelStyle,
      interests,
      quizCompleted,
      quizResults
    } = req.body;

    // Check if preferences exist
    const [existing] = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    const selectedTagsJson = JSON.stringify(selectedTags || []);
    const interestsJson = JSON.stringify(interests || []);
    const quizResultsJson = JSON.stringify(quizResults || {});

    if (existing.length > 0) {
      // Update existing preferences
      await pool.query(
        `UPDATE user_preferences 
         SET selected_tags = ?, 
             budget_range = ?, 
             preferred_duration = ?,
             travel_style = ?,
             interests = ?,
             quiz_completed = ?,
             quiz_results = ?,
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
         (user_id, selected_tags, budget_range, preferred_duration, 
          travel_style, interests, quiz_completed, quiz_results)
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

    // Update user's personality_tags column for quick access
    if (selectedTags && selectedTags.length > 0) {
      const tagsString = selectedTags.join(',');
      await pool.query(
        'UPDATE users SET personality_tags = ?, last_recommendation_update = NOW() WHERE id = ?',
        [tagsString, userId]
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


// ==================== GET USER PREFERENCES (Protected) ====================
// GET /api/recommendations/preferences/:userId
router.get('/preferences/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure user can only access their own preferences
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


// ==================== TRACK PLACE VIEW ====================
// POST /api/recommendations/track-view
router.post('/track-view', async (req, res) => {
  try {
    const { placeId, userId, sessionId } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        error: 'Place ID is required'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Insert or update view count for today
    await pool.query(
      `INSERT INTO views (place_id, user_id, view_date, view_count, session_id)
       VALUES (?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
      [placeId, userId || null, today, sessionId || null]
    );

    // Update place_stats
    await pool.query(
      `INSERT INTO place_stats (place_id, total_views, views_last_7_days, views_last_30_days, last_viewed_at)
       VALUES (?, 1, 1, 1, NOW())
       ON DUPLICATE KEY UPDATE 
         total_views = total_views + 1,
         views_last_7_days = (
           SELECT SUM(view_count) 
           FROM views 
           WHERE place_id = ? 
             AND view_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         ),
         views_last_30_days = (
           SELECT SUM(view_count) 
           FROM views 
           WHERE place_id = ? 
             AND view_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         ),
         last_viewed_at = NOW()`,
      [placeId, placeId, placeId]
    );

    res.json({
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track view'
    });
  }
});


// ==================== TRACK PLACE LIKE (Protected) ====================
// POST /api/recommendations/track-like
router.post('/track-like', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        error: 'Place ID is required'
      });
    }

    // Check if already liked
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND place_id = ?',
      [userId, placeId]
    );

    if (existing.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM likes WHERE user_id = ? AND place_id = ?',
        [userId, placeId]
      );

      // Update place_stats
      await pool.query(
        'UPDATE place_stats SET total_likes = total_likes - 1 WHERE place_id = ?',
        [placeId]
      );

      res.json({
        success: true,
        message: 'Place unliked',
        liked: false
      });
    } else {
      // Like
      await pool.query(
        'INSERT INTO likes (user_id, place_id) VALUES (?, ?)',
        [userId, placeId]
      );

      // Update place_stats
      await pool.query(
        `INSERT INTO place_stats (place_id, total_likes)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE total_likes = total_likes + 1`,
        [placeId]
      );

      res.json({
        success: true,
        message: 'Place liked',
        liked: true
      });
    }

  } catch (error) {
    console.error('Track like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track like'
    });
  }
});


// ==================== LOG RECOMMENDATION REQUEST ====================
// POST /api/recommendations/log (Internal use)
router.post('/log', async (req, res) => {
  try {
    const {
      userId,
      inputProfile,
      selectedTags,
      algorithmVersion,
      recommendedPlaces,
      totalResults,
      executionTimeMs,
      ipAddress,
      userAgent
    } = req.body;

    await pool.query(
      `INSERT INTO recommendation_logs 
       (user_id, input_profile, selected_tags, algorithm_version, 
        recommended_places, total_results, execution_time_ms, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        JSON.stringify(inputProfile || {}),
        JSON.stringify(selectedTags || []),
        algorithmVersion || 'v1.0',
        JSON.stringify(recommendedPlaces || []),
        totalResults || 0,
        executionTimeMs || 0,
        ipAddress || null,
        userAgent || null
      ]
    );

    res.json({
      success: true,
      message: 'Recommendation logged'
    });

  } catch (error) {
    console.error('Log recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log recommendation'
    });
  }
});


export default router;