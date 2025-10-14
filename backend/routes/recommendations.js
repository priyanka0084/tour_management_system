import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// GET /api/recommendations/offers - Get Active Offers
// ==========================================
router.get('/offers', async (req, res) => {
    try {
        const { limit = 6 } = req.query;

        // Query to fetch offers with calculated discount and place details
        // Uses places table price_per_person as the base price
        const query = `
            SELECT 
                p.id as place_id,
                p.name as place_name,
                p.image_url,
                p.description,
                p.rating,
                p.duration_days,
                p.price_per_person,
                c.name as country_name,
                
                -- Calculate random discount (10% to 30%)
                p.price_per_person as new_price,
                ROUND(p.price_per_person / (1 - (FLOOR(10 + (RAND() * 20)) / 100)), 2) as old_price,
                FLOOR(10 + (RAND() * 20)) as discount_percent,
                
                -- Generate random offer details
                FLOOR(5 + (RAND() * 15)) as spots_left,
                DATE_ADD(NOW(), INTERVAL FLOOR(3 + (RAND() * 27)) DAY) as valid_until,
                DATEDIFF(DATE_ADD(NOW(), INTERVAL FLOOR(3 + (RAND() * 27)) DAY), NOW()) as days_remaining,
                
                CONCAT('Special ', FLOOR(10 + (RAND() * 20)), '% OFF on ', p.name) as title
            FROM places p
            JOIN countries c ON p.country_id = c.id
            WHERE p.price_per_person IS NOT NULL
            ORDER BY RAND()
            LIMIT ?
        `;

        const [offers] = await pool.execute(query, [parseInt(limit)]);

        // Format offers to ensure proper data types
        const formattedOffers = offers.map(offer => ({
            id: offer.place_id,
            place_id: offer.place_id,
            place_name: offer.place_name,
            title: offer.title,
            description: offer.description || `Exclusive discount on ${offer.place_name}! Limited time offer.`,
            image_url: offer.image_url,
            country_name: offer.country_name,
            rating: parseFloat(offer.rating) || 4.5,
            duration_days: parseInt(offer.duration_days) || 3,
            
            // Pricing
            old_price: parseFloat(offer.old_price),
            new_price: parseFloat(offer.new_price),
            discount_percent: parseInt(offer.discount_percent),
            
            // Availability
            spots_left: parseInt(offer.spots_left),
            valid_until: offer.valid_until,
            days_remaining: parseInt(offer.days_remaining)
        }));

        res.json({
            success: true,
            data: formattedOffers,
            count: formattedOffers.length
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
                COALESCE(ps.total_views, 0) as total_views,
                COALESCE(ps.total_likes, 0) as total_likes,
                COALESCE(ps.trending_score, 0) as trending_score
            FROM places p
            JOIN countries c ON p.country_id = c.id
            LEFT JOIN place_stats ps ON p.id = ps.place_id
            ORDER BY ps.trending_score DESC, p.rating DESC
            LIMIT ?
        `;

        const [places] = await pool.execute(query, [parseInt(limit)]);

        res.json({
            success: true,
            data: places,
            count: places.length
        });

    } catch (error) {
        console.error('Get trending places error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch trending places' 
        });
    }
});

// ==========================================
// GET /api/recommendations - Get Personalized Recommendations
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { tags, limit = 12, userId } = req.query;

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
                LIMIT ?
            `;

            const [places] = await pool.execute(query, [parseInt(limit)]);

            return res.json({
                success: true,
                data: places,
                count: places.length
            });
        }

        // Get recommendations based on tags
        const tagArray = tags.split(',').map(t => t.trim());

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
            WHERE t.name IN (${tagArray.map(() => '?').join(',')})
            GROUP BY p.id
            ORDER BY tag_match_count DESC, p.rating DESC
            LIMIT ?
        `;

        const [places] = await pool.execute(query, [...tagArray, parseInt(limit)]);

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
            error: 'Failed to fetch recommendations' 
        });
    }
});

// ==========================================
// GET /api/recommendations/preferences/:userId - Get User Preferences
// ==========================================
router.get('/preferences/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

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

export default router;