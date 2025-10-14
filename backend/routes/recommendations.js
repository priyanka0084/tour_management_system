import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper function to safely parse integer with default
const safeParseInt = (value, defaultValue) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
};

// ==========================================
// GET /api/recommendations/offers - Get Active Offers
// ==========================================
router.get('/offers', async (req, res) => {
    try {
        const limit = safeParseInt(req.query.limit, 6);

        // Simple query without complex calculations - get all data first
        const query = `
            SELECT 
                p.id as place_id,
                p.name as place_name,
                p.image_url,
                p.description,
                p.rating,
                p.duration_days,
                p.price_per_person,
                c.name as country_name
            FROM places p
            JOIN countries c ON p.country_id = c.id
            WHERE p.price_per_person IS NOT NULL
            ORDER BY RAND()
        `;

        // Execute query without LIMIT parameter
        const [allPlaces] = await pool.query(query);
        
        // Apply limit in JavaScript and calculate discounts
        const offers = allPlaces.slice(0, limit).map(place => {
            const discountPercent = Math.floor(10 + Math.random() * 20); // 10-30%
            const newPrice = parseFloat(place.price_per_person);
            const oldPrice = Math.round(newPrice / (1 - discountPercent / 100) * 100) / 100;
            const spotsLeft = Math.floor(5 + Math.random() * 15);
            const daysToExpire = Math.floor(3 + Math.random() * 27);
            
            return {
                id: place.place_id,
                place_id: place.place_id,
                place_name: place.place_name,
                title: `Special ${discountPercent}% OFF on ${place.place_name}`,
                description: place.description || `Exclusive discount on ${place.place_name}! Limited time offer.`,
                image_url: place.image_url,
                country_name: place.country_name,
                rating: parseFloat(place.rating) || 4.5,
                duration_days: parseInt(place.duration_days) || 3,
                old_price: oldPrice,
                new_price: newPrice,
                discount_percent: discountPercent,
                spots_left: spotsLeft,
                valid_until: new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000).toISOString(),
                days_remaining: daysToExpire
            };
        });

        res.json({
            success: true,
            data: offers,
            count: offers.length
        });

    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch offers',
            message: error.message 
        });
    }
});

// ==========================================
// GET /api/recommendations/trending - Get Trending Places
// ==========================================
router.get('/trending', async (req, res) => {
    try {
        const limit = safeParseInt(req.query.limit, 10);

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
                COALESCE(ps.total_views, 0) as total_views,
                COALESCE(ps.total_likes, 0) as total_likes,
                COALESCE(ps.trending_score, 0) as trending_score
            FROM places p
            JOIN countries c ON p.country_id = c.id
            LEFT JOIN place_stats ps ON p.id = ps.place_id
            ORDER BY ps.trending_score DESC, p.rating DESC
        `;

        // Execute without LIMIT parameter
        const [allPlaces] = await pool.query(query);
        
        // Apply limit in JavaScript
        const places = allPlaces.slice(0, limit);

        res.json({
            success: true,
            data: places,
            count: places.length
        });

    } catch (error) {
        console.error('Get trending places error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch trending places',
            message: error.message 
        });
    }
});

// ==========================================
// GET /api/recommendations - Get Personalized Recommendations
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { tags, userId } = req.query;
        const limit = safeParseInt(req.query.limit, 12);

        if (!tags) {
            // If no tags provided, return trending
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
                    COALESCE(ps.total_views, 0) as total_views,
                    COALESCE(ps.total_likes, 0) as total_likes
                FROM places p
                JOIN countries c ON p.country_id = c.id
                LEFT JOIN place_stats ps ON p.id = ps.place_id
                ORDER BY p.rating DESC
            `;

            const [allPlaces] = await pool.query(query);
            const places = allPlaces.slice(0, limit);

            return res.json({
                success: true,
                data: places,
                count: places.length
            });
        }

        // Get recommendations based on tags
        const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (tagArray.length === 0) {
            // If no valid tags after filtering, return trending
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
                    COALESCE(ps.total_views, 0) as total_views,
                    COALESCE(ps.total_likes, 0) as total_likes
                FROM places p
                JOIN countries c ON p.country_id = c.id
                LEFT JOIN place_stats ps ON p.id = ps.place_id
                ORDER BY p.rating DESC
            `;

            const [allPlaces] = await pool.query(query);
            const places = allPlaces.slice(0, limit);

            return res.json({
                success: true,
                data: places,
                count: places.length
            });
        }

        // Build query with proper number of placeholders
        const placeholders = tagArray.map(() => '?').join(',');
        
        const query = `
            SELECT DISTINCT
                p.id,
                p.name,
                p.image_url,
                p.description,
                p.rating,
                p.price_per_person,
                p.duration_days,
                c.name as country_name,
                COALESCE(ps.total_views, 0) as total_views,
                COALESCE(ps.total_likes, 0) as total_likes,
                COUNT(DISTINCT pt.tag_id) as tag_match_count
            FROM places p
            JOIN countries c ON p.country_id = c.id
            LEFT JOIN place_stats ps ON p.id = ps.place_id
            LEFT JOIN place_tags pt ON p.id = pt.place_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE t.name IN (${placeholders})
            GROUP BY p.id
            ORDER BY tag_match_count DESC, p.rating DESC
        `;

        const [allPlaces] = await pool.execute(query, tagArray);
        const places = allPlaces.slice(0, limit);

        res.json({
            success: true,
            data: places,
            count: places.length,
            tags: tagArray
        });

    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch recommendations',
            message: error.message 
        });
    }
});

// ==========================================
// GET /api/recommendations/preferences/:userId - Get User Preferences
// ==========================================
router.get('/preferences/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user is accessing their own preferences
        if (req.user.id !== parseInt(userId)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const query = `
            SELECT 
                selected_tags,
                updated_at
            FROM user_preferences
            WHERE user_id = ?
        `;

        const [rows] = await pool.execute(query, [userId]);

        if (rows.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No preferences found'
            });
        }

        // Parse selected_tags if it's stored as JSON string
        const preferences = {
            selected_tags: typeof rows[0].selected_tags === 'string' 
                ? JSON.parse(rows[0].selected_tags) 
                : rows[0].selected_tags,
            updated_at: rows[0].updated_at
        };

        res.json({
            success: true,
            data: preferences
        });

    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch user preferences' 
        });
    }
});

// ==========================================
// POST /api/recommendations/preferences - Save User Preferences
// ==========================================
router.post('/preferences', authMiddleware, async (req, res) => {
    try {
        const { selectedTags } = req.body;
        const userId = req.user.id;

        if (!selectedTags || !Array.isArray(selectedTags)) {
            return res.status(400).json({
                success: false,
                error: 'Selected tags must be an array'
            });
        }

        // Convert array to JSON string for storage
        const tagsJSON = JSON.stringify(selectedTags);

        const query = `
            INSERT INTO user_preferences (user_id, selected_tags, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                selected_tags = VALUES(selected_tags),
                updated_at = NOW()
        `;

        await pool.execute(query, [userId, tagsJSON]);

        res.json({
            success: true,
            message: 'Preferences saved successfully',
            data: {
                selected_tags: selectedTags
            }
        });

    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save preferences' 
        });
    }
});

// ==========================================
// GET /api/recommendations/tags - Get All Available Tags
// ==========================================
router.get('/tags', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                display_name,
                tag_type,
                icon,
                description
            FROM tags 
            ORDER BY tag_type, name ASC
        `;
        const [tags] = await pool.query(query);

        // Group tags by tag_type for the personality quiz
        const grouped = {
            personality: [],
            activity: [],
            vibe: [],
            location: []
        };

        // Group tags by their tag_type from database
        tags.forEach(tag => {
            const tagType = tag.tag_type || 'personality';
            if (grouped[tagType]) {
                grouped[tagType].push(tag);
            } else {
                // Default to personality if tag_type doesn't match
                grouped.personality.push(tag);
            }
        });

        res.json({
            success: true,
            data: tags,
            grouped: grouped,
            count: tags.length
        });

    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch tags',
            message: error.message 
        });
    }
});

export default router;