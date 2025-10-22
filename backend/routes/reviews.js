// ========================================
// REVIEWS API ROUTES
// ExploreEase Travel Booking Platform
// ========================================

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// MULTER CONFIGURATION FOR IMAGE UPLOADS
// ========================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'reviews');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: review_userId_timestamp_random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `review_${req.user.id}_${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
};

// Multer upload configuration (max 5 images per review, max 5MB each)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Maximum 5 images
    },
    fileFilter: fileFilter
});


// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// GET /api/reviews - Get all approved reviews with filters
router.get('/', async (req, res) => {
    try {
        const {
            place_id,
            package_id,
            rating,
            sort_by = 'recent',
            limit = 20,
            offset = 0
        } = req.query;

        let query = `
            SELECT 
                r.id,
                r.rating,
                r.title,
                r.review_text,
                r.helpful_count,
                r.created_at,
                r.verified_purchase,
                u.name as user_name,
                u.profile_picture as user_image,
                p.name as place_name,
                p.image_url as place_image,
                c.name as country_name,
                pkg.title as package_name,
                (SELECT GROUP_CONCAT(image_url) 
                 FROM review_images 
                 WHERE review_id = r.id 
                 ORDER BY image_order) as images
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            INNER JOIN places p ON r.place_id = p.id
            INNER JOIN countries c ON p.country_id = c.id
            LEFT JOIN packages pkg ON r.package_id = pkg.id
            WHERE r.status = 'approved'
        `;

        const params = [];

        // Apply filters
        if (place_id) {
            query += ' AND r.place_id = ?';
            params.push(place_id);
        }

        if (package_id) {
            query += ' AND r.package_id = ?';
            params.push(package_id);
        }

        if (rating) {
            query += ' AND r.rating >= ?';
            params.push(rating);
        }

        // Apply sorting
        switch (sort_by) {
            case 'helpful':
                query += ' ORDER BY r.helpful_count DESC, r.created_at DESC';
                break;
            case 'rating_high':
                query += ' ORDER BY r.rating DESC, r.created_at DESC';
                break;
            case 'rating_low':
                query += ' ORDER BY r.rating ASC, r.created_at DESC';
                break;
            case 'recent':
            default:
                query += ' ORDER BY r.created_at DESC';
                break;
        }

        // Apply pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(query, [parseInt(limit), parseInt(offset)]);

        // Process images - convert comma-separated string to array
        const reviews = rows.map(review => ({
            ...review,
            images: review.images ? review.images.split(',') : []
        }));

        res.json({
            success: true,
            reviews,
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

// GET /api/reviews/place/:placeId - Get reviews for a specific place
router.get('/place/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const query = `
            SELECT 
                r.id,
                r.rating,
                r.title,
                r.review_text,
                r.helpful_count,
                r.created_at,
                r.verified_purchase,
                u.name as user_name,
                u.profile_picture as user_image,
                (SELECT GROUP_CONCAT(image_url) 
                 FROM review_images 
                 WHERE review_id = r.id 
                 ORDER BY image_order) as images
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.place_id = ? AND r.status = 'approved'
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.execute(query, [placeId, parseInt(limit), parseInt(offset)]);

        // Process images
        const reviews = rows.map(review => ({
            ...review,
            images: review.images ? review.images.split(',') : []
        }));

        // Get average rating and count
        const [stats] = await pool.execute(`
            SELECT 
                ROUND(AVG(rating), 2) as average_rating,
                COUNT(*) as total_reviews,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
            FROM reviews
            WHERE place_id = ? AND status = 'approved'
        `, [placeId]);

        res.json({
            success: true,
            reviews,
            stats: stats[0] || {
                average_rating: 0,
                total_reviews: 0,
                stars_5: 0,
                stars_4: 0,
                stars_3: 0,
                stars_2: 0,
                stars_1: 0
            }
        });

    } catch (error) {
        console.error('Get place reviews error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch place reviews'
        });
    }
});

// GET /api/reviews/:id - Get single review details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.*,
                u.name as user_name,
                u.profile_picture as user_image,
                p.name as place_name,
                p.image_url as place_image,
                c.name as country_name,
                pkg.title as package_name
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            INNER JOIN places p ON r.place_id = p.id
            INNER JOIN countries c ON p.country_id = c.id
            LEFT JOIN packages pkg ON r.package_id = pkg.id
            WHERE r.id = ?
        `;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Get review images
        const [images] = await pool.execute(
            'SELECT image_url, caption FROM review_images WHERE review_id = ? ORDER BY image_order',
            [id]
        );

        const review = {
            ...rows[0],
            images
        };

        res.json({
            success: true,
            review
        });

    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review'
        });
    }
});


// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// POST /api/reviews - Submit a new review (with image upload)
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            booking_id,
            place_id,
            package_id,
            rating,
            title,
            review_text
        } = req.body;

        const user_id = req.user.id;

        // Validation
        if (!booking_id || !place_id || !rating || !title || !review_text) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: booking_id, place_id, rating, title, review_text'
            });
        }

        if (rating < 1 || rating > 5) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        // Verify booking exists and belongs to user
        const [bookings] = await connection.execute(
            `SELECT id, user_id, booking_status, tour_date 
             FROM bookings 
             WHERE id = ?`,
            [booking_id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const booking = bookings[0];

        // Check if booking belongs to user
        if (booking.user_id !== user_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'You can only review your own bookings'
            });
        }

        // Check if booking is completed (tour date has passed)
        const tourDate = new Date(booking.tour_date);
        const today = new Date();
        if (tourDate > today) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'You can only review completed trips'
            });
        }

        // Check if review already exists for this booking
        const [existingReviews] = await connection.execute(
            'SELECT id FROM reviews WHERE booking_id = ?',
            [booking_id]
        );

        if (existingReviews.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this booking'
            });
        }

        // Insert review
        const [result] = await connection.execute(
            `INSERT INTO reviews 
            (booking_id, user_id, place_id, package_id, rating, title, review_text, status, verified_purchase)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', TRUE)`,
            [booking_id, user_id, place_id, package_id || null, rating, title, review_text]
        );

        const reviewId = result.insertId;

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const imageInserts = req.files.map((file, index) => {
                const imageUrl = `/uploads/reviews/${file.filename}`;
                return [reviewId, imageUrl, index];
            });

            await connection.query(
                'INSERT INTO review_images (review_id, image_url, image_order) VALUES ?',
                [imageInserts]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully! It will be visible after admin approval.',
            review_id: reviewId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Submit review error:', error);

        // Clean up uploaded files if error
        if (req.files) {
            req.files.forEach(file => {
                const filePath = file.path;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to submit review'
        });
    } finally {
        connection.release();
    }
});

// GET /api/reviews/my-reviews - Get user's own reviews
router.get('/user/my-reviews', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;

        const query = `
            SELECT 
                r.id,
                r.rating,
                r.title,
                r.review_text,
                r.status,
                r.helpful_count,
                r.created_at,
                r.updated_at,
                p.name as place_name,
                p.image_url as place_image,
                c.name as country_name,
                pkg.title as package_name,
                b.tour_date,
                (SELECT GROUP_CONCAT(image_url) 
                 FROM review_images 
                 WHERE review_id = r.id 
                 ORDER BY image_order) as images
            FROM reviews r
            INNER JOIN bookings b ON r.booking_id = b.id
            INNER JOIN places p ON r.place_id = p.id
            INNER JOIN countries c ON p.country_id = c.id
            LEFT JOIN packages pkg ON r.package_id = pkg.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `;

        const [rows] = await pool.execute(query, [user_id]);

        // Process images
        const reviews = rows.map(review => ({
            ...review,
            images: review.images ? review.images.split(',') : []
        }));

        res.json({
            success: true,
            reviews
        });

    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your reviews'
        });
    }
});

// GET /api/reviews/bookings-for-review - Get user's completed bookings without reviews
router.get('/user/bookings-for-review', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;

        const query = `
            SELECT 
                b.id,
                b.tour_destination as package_name,
                b.tour_date,
                b.package_id,
                p.id as place_id,
                p.name as place_name,
                p.image_url as place_image,
                c.name as country_name
            FROM bookings b
            LEFT JOIN reviews r ON b.id = r.booking_id
            LEFT JOIN packages pkg ON b.package_id = pkg.id
            LEFT JOIN places p ON pkg.place_id = p.id
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE b.user_id = ? 
            AND r.id IS NULL
            AND b.payment_status = 'success'
            ORDER BY b.tour_date DESC
        `;

        const [rows] = await pool.execute(query, [user_id]);

        res.json({
            success: true,
            bookings: rows
        });

    } catch (error) {
        console.error('Get bookings for review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
});

// PUT /api/reviews/:id - Update own review
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { rating, title, review_text } = req.body;

        // Validation
        if (!rating || !title || !review_text) {
            return res.status(400).json({
                success: false,
                error: 'Rating, title, and review text are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        // Verify review belongs to user
        const [reviews] = await pool.execute(
            'SELECT user_id FROM reviews WHERE id = ?',
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        if (reviews[0].user_id !== user_id) {
            return res.status(403).json({
                success: false,
                error: 'You can only edit your own reviews'
            });
        }

        // Update review
        await pool.execute(
            `UPDATE reviews 
             SET rating = ?, title = ?, review_text = ?, status = 'pending', updated_at = NOW()
             WHERE id = ?`,
            [rating, title, review_text, id]
        );

        res.json({
            success: true,
            message: 'Review updated successfully! It will be re-reviewed by admin.'
        });

    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update review'
        });
    }
});

// DELETE /api/reviews/:id - Delete own review
router.delete('/:id', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const user_id = req.user.id;

        // Verify review belongs to user
        const [reviews] = await connection.execute(
            'SELECT user_id, place_id FROM reviews WHERE id = ?',
            [id]
        );

        if (reviews.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        if (reviews[0].user_id !== user_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own reviews'
            });
        }

        const place_id = reviews[0].place_id;

        // Get review images before deletion
        const [images] = await connection.execute(
            'SELECT image_url FROM review_images WHERE review_id = ?',
            [id]
        );

        // Delete review (cascade will delete images from DB)
        await connection.execute('DELETE FROM reviews WHERE id = ?', [id]);

        // Delete image files from filesystem
        images.forEach(img => {
            const filename = img.image_url.split('/').pop();
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Update place ratings
        await connection.query('CALL UpdatePlaceRatings(?)', [place_id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review'
        });
    } finally {
        connection.release();
    }
});

// POST /api/reviews/:id/helpful - Mark review as helpful
router.post('/:id/helpful', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if user already voted
        const [existing] = await pool.execute(
            'SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ?',
            [id, user_id]
        );

        if (existing.length > 0) {
            // Remove vote (unlike)
            await pool.execute(
                'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
                [id, user_id]
            );

            return res.json({
                success: true,
                message: 'Removed helpful vote',
                helpful: false
            });
        } else {
            // Add vote
            await pool.execute(
                'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
                [id, user_id]
            );

            return res.json({
                success: true,
                message: 'Marked as helpful',
                helpful: true
            });
        }

    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark review as helpful'
        });
    }
});

// POST /api/reviews/:id/report - Report inappropriate review
router.post('/:id/report', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { reason, description } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Reason is required'
            });
        }

        // Check if user already reported this review
        const [existing] = await pool.execute(
            'SELECT id FROM review_reports WHERE review_id = ? AND reported_by = ?',
            [id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'You have already reported this review'
            });
        }

        // Insert report
        await pool.execute(
            `INSERT INTO review_reports (review_id, reported_by, reason, description) 
             VALUES (?, ?, ?, ?)`,
            [id, user_id, reason, description || null]
        );

        // Update review reported_count
        await pool.execute(
            'UPDATE reviews SET reported_count = reported_count + 1 WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Report submitted successfully. We will review it soon.'
        });

    } catch (error) {
        console.error('Report review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit report'
        });
    }
});


export default router;