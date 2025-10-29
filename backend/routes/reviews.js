
import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for review images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/reviews';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// ========================================
// GET /api/reviews - Get all APPROVED reviews
// ========================================
router.get('/', async (req, res) => {
    try {
        const { 
            rating, 
            place_id, 
            sort_by = 'recent'
        } = req.query;

        // Parse and validate limit and offset
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const offset = Math.max(0, parseInt(req.query.offset) || 0);

        let query = `
            SELECT 
                r.id,
                r.user_id,
                r.place_id,
                r.rating,
                r.title,
                r.review_text,
                r.images,
                r.helpful_count,
                r.verified_purchase,
                r.visit_date,
                r.created_at,
                u.name as user_name,
                p.name as place_name,
                c.name as country_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN places p ON r.place_id = p.id
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE r.status = 'approved'
        `;

        const params = [];

        // Filter by place
        if (place_id) {
            query += ' AND r.place_id = ?';
            params.push(parseInt(place_id));
        }

        // Filter by rating
        if (rating && rating !== 'all') {
            query += ' AND r.rating >= ?';
            params.push(parseInt(rating));
        }

        // Sort
        switch (sort_by) {
            case 'oldest':
                query += ' ORDER BY r.created_at ASC';
                break;
            case 'rating_high':
                query += ' ORDER BY r.rating DESC, r.created_at DESC';
                break;
            case 'rating_low':
                query += ' ORDER BY r.rating ASC, r.created_at DESC';
                break;
            case 'helpful':
                query += ' ORDER BY r.helpful_count DESC, r.created_at DESC';
                break;
            case 'recent':
            default:
                query += ' ORDER BY r.created_at DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        console.log('Executing query with params:', params); // Debug log

        const [reviews] = await pool.execute(query, params);

        // Parse images JSON
        const reviewsWithImages = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images) : []
        }));

        // Get stats
        const statsQuery = `
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE status = 'approved'
        `;

        const statsParams = [];
        
        if (place_id) {
            const statsQueryWithPlace = statsQuery + ' AND place_id = ?';
            const [stats] = await pool.execute(statsQueryWithPlace, [parseInt(place_id)]);
            return res.json({
                success: true,
                reviews: reviewsWithImages,
                stats: stats[0],
                count: reviews.length
            });
        }

        const [stats] = await pool.execute(statsQuery, statsParams);

        res.json({
            success: true,
            reviews: reviewsWithImages,
            stats: stats[0],
            count: reviews.length
        });

    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch reviews' 
        });
    }
});

// ========================================
// GET /api/reviews/place/:placeId - Get reviews for a place
// ========================================
router.get('/place/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const { sort_by = 'recent' } = req.query;
        
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const offset = Math.max(0, parseInt(req.query.offset) || 0);

        let query = `
            SELECT 
                r.id,
                r.user_id,
                r.rating,
                r.title,
                r.review_text,
                r.images,
                r.helpful_count,
                r.verified_purchase,
                r.visit_date,
                r.created_at,
                u.name as user_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.place_id = ? AND r.status = 'approved'
        `;

        // Sort
        switch (sort_by) {
            case 'oldest':
                query += ' ORDER BY r.created_at ASC';
                break;
            case 'rating_high':
                query += ' ORDER BY r.rating DESC, r.created_at DESC';
                break;
            case 'rating_low':
                query += ' ORDER BY r.rating ASC, r.created_at DESC';
                break;
            case 'helpful':
                query += ' ORDER BY r.helpful_count DESC, r.created_at DESC';
                break;
            case 'recent':
            default:
                query += ' ORDER BY r.created_at DESC';
        }

        query += ' LIMIT ? OFFSET ?';

        const [reviews] = await pool.execute(query, [parseInt(placeId), limit, offset]);

        // Parse images
        const reviewsWithImages = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images) : []
        }));

        // Get stats for this place
        const statsQuery = `
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            FROM reviews
            WHERE place_id = ? AND status = 'approved'
        `;

        const [stats] = await pool.execute(statsQuery, [parseInt(placeId)]);

        res.json({
            success: true,
            reviews: reviewsWithImages,
            stats: stats[0],
            count: reviews.length
        });

    } catch (error) {
        console.error('Get place reviews error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch place reviews' 
        });
    }
});

// ========================================
// GET /api/reviews/user/my-reviews - Get user's reviews
// ========================================
router.get('/user/my-reviews', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT 
                r.*,
                p.name as place_name,
                c.name as country_name,
                p.image_url as place_image
            FROM reviews r
            LEFT JOIN places p ON r.place_id = p.id
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `;

        const [reviews] = await pool.execute(query, [userId]);

        // Parse images
        const reviewsWithImages = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images) : []
        }));

        res.json({
            success: true,
            reviews: reviewsWithImages
        });

    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch your reviews' 
        });
    }
});

// ========================================
// GET /api/reviews/user/bookings-for-review - Get completed bookings
// ========================================
router.get('/user/bookings-for-review', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get completed bookings that don't have reviews yet
        const query = `
            SELECT 
                b.id as booking_id,
                b.tour_destination,
                b.tour_date,
                b.booking_date,
                p.id as place_id,
                p.name as place_name,
                p.image_url as place_image,
                c.name as country_name
            FROM bookings b
            LEFT JOIN places p ON b.tour_destination = p.name
            LEFT JOIN countries c ON p.country_id = c.id
            LEFT JOIN reviews r ON b.id = r.booking_id
            WHERE b.email = (SELECT email FROM users WHERE id = ?)
            AND b.payment_status = 'success'
            AND b.tour_date < NOW()
            AND r.id IS NULL
            ORDER BY b.tour_date DESC
        `;

        const [bookings] = await pool.execute(query, [userId]);

        res.json({
            success: true,
            bookings
        });

    } catch (error) {
        console.error('Get bookings for review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch bookings' 
        });
    }
});

// ========================================
// POST /api/reviews - Submit a new review
// ========================================
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            booking_id,
            place_id,
            package_id,
            rating,
            title,
            review_text,
            visit_date
        } = req.body;

        // Validation
        if (!place_id || !rating || !title || !review_text) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        // Check if user has already reviewed this booking
        if (booking_id) {
            const [existing] = await pool.execute(
                'SELECT id FROM reviews WHERE booking_id = ? AND user_id = ?',
                [booking_id, userId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already reviewed this booking'
                });
            }
        }

        // Process uploaded images
        const images = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

        // Check if verified purchase
        let verified_purchase = false;
        if (booking_id) {
            const [bookings] = await pool.execute(
                'SELECT id FROM bookings b INNER JOIN users u ON b.email = u.email WHERE b.id = ? AND u.id = ? AND b.payment_status = "success"',
                [booking_id, userId]
            );
            verified_purchase = bookings.length > 0;
        }

        // Insert review
        const insertQuery = `
            INSERT INTO reviews (
                user_id, booking_id, place_id, package_id, rating,
                title, review_text, images, verified_purchase, visit_date,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const [result] = await pool.execute(insertQuery, [
            userId,
            booking_id || null,
            place_id,
            package_id || null,
            rating,
            title,
            review_text,
            JSON.stringify(images),
            verified_purchase,
            visit_date || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully and is pending approval',
            review_id: result.insertId
        });

    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit review' 
        });
    }
});

// ========================================
// PUT /api/reviews/:id/helpful - Mark review as helpful
// ========================================
router.put('/:id/helpful', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const updateQuery = `
            UPDATE reviews 
            SET helpful_count = helpful_count + 1
            WHERE id = ? AND status = 'approved'
        `;

        const [result] = await pool.execute(updateQuery, [parseInt(id)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Thank you for your feedback!'
        });

    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark review as helpful' 
        });
    }
});

// ========================================
// POST /api/reviews/:id/report - Report a review
// ========================================
router.post('/:id/report', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Report reason is required'
            });
        }

        const updateQuery = `
            UPDATE reviews 
            SET report_count = report_count + 1
            WHERE id = ?
        `;

        const [result] = await pool.execute(updateQuery, [parseInt(id)]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review reported successfully'
        });

    } catch (error) {
        console.error('Report review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to report review' 
        });
    }
});

export default router;