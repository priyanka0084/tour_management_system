// ========================================
// ADMIN REVIEWS ROUTES - COMPLETELY FIXED
// Endpoints for managing all reviews
// ========================================

import express from 'express';
import { pool } from '../../db.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';

const router = express.Router();

// Apply auth + admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// ========================================
// GET /api/admin/reviews/stats - Get review statistics
// ========================================
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_reviews,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reviews,
                AVG(CASE WHEN status = 'approved' THEN rating ELSE NULL END) as average_rating,
                SUM(CASE WHEN report_count > 0 THEN 1 ELSE 0 END) as reported_reviews
            FROM reviews
        `;

        const [stats] = await pool.execute(statsQuery);

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch stats' 
        });
    }
});

// ========================================
// GET /api/admin/reviews - Get all reviews with filters
// ========================================
router.get('/', async (req, res) => {
    try {
        const { status, rating, sort_by, limit = 50 } = req.query;

        let query = `
            SELECT 
                r.id,
                r.booking_id,
                r.user_id,
                r.place_id,
                r.package_id,
                r.rating,
                r.title,
                r.review_text,
                r.images,
                r.status,
                r.admin_response,
                r.helpful_count,
                r.report_count,
                r.verified_purchase,
                r.visit_date,
                r.created_at,
                r.updated_at,
                u.name as user_name,
                u.email as user_email,
                p.name as place_name,
                c.name as country_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN places p ON r.place_id = p.id
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE 1=1
        `;

        const params = [];

        // Filter by status
        if (status && status !== 'all') {
            query += ' AND r.status = ?';
            params.push(status);
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
            case 'reported':
                query += ' ORDER BY r.report_count DESC, r.created_at DESC';
                break;
            case 'recent':
            default:
                query += ' ORDER BY r.created_at DESC';
        }

        query += ' LIMIT ?';
        params.push(parseInt(limit));

        const [reviews] = await pool.execute(query, params);

        // Parse images JSON
        const reviewsWithImages = reviews.map(review => ({
            ...review,
            images: review.images ? JSON.parse(review.images) : []
        }));

        res.json({
            success: true,
            reviews: reviewsWithImages,
            count: reviews.length
        });

    } catch (error) {
        console.error('Get admin reviews error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch reviews' 
        });
    }
});

// ========================================
// GET /api/admin/reviews/:id - Get single review details
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.*,
                u.name as user_name,
                u.email as user_email,
                p.name as place_name,
                c.name as country_name,
                b.booking_date,
                b.amount as total_amount,
                b.payment_status as booking_status
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN places p ON r.place_id = p.id
            LEFT JOIN countries c ON p.country_id = c.id
            LEFT JOIN bookings b ON r.booking_id = b.id
            WHERE r.id = ?
        `;

        const [reviews] = await pool.execute(query, [id]);

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        const review = reviews[0];
        review.images = review.images ? JSON.parse(review.images) : [];

        res.json({
            success: true,
            review
        });

    } catch (error) {
        console.error('Get review details error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch review details' 
        });
    }
});

// ========================================
// PUT /api/admin/reviews/:id/approve - Approve a review
// ========================================
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const updateQuery = `
            UPDATE reviews 
            SET status = 'approved',
                updated_at = NOW()
            WHERE id = ?
        `;

        const [result] = await pool.execute(updateQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review approved successfully'
        });

    } catch (error) {
        console.error('Approve review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to approve review' 
        });
    }
});

// ========================================
// PUT /api/admin/reviews/:id/reject - Reject a review
// ========================================
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;

        const updateQuery = `
            UPDATE reviews 
            SET status = 'rejected',
                updated_at = NOW()
            WHERE id = ?
        `;

        const [result] = await pool.execute(updateQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review rejected'
        });

    } catch (error) {
        console.error('Reject review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to reject review' 
        });
    }
});

// ========================================
// DELETE /api/admin/reviews/:id - Delete a review
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deleteQuery = 'DELETE FROM reviews WHERE id = ?';
        const [result] = await pool.execute(deleteQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete review' 
        });
    }
});

// ========================================
// POST /api/admin/reviews/bulk-approve - Bulk approve reviews
// ========================================
router.post('/bulk-approve', async (req, res) => {
    try {
        const { review_ids } = req.body;

        if (!Array.isArray(review_ids) || review_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid review IDs'
            });
        }

        const placeholders = review_ids.map(() => '?').join(',');
        const updateQuery = `
            UPDATE reviews 
            SET status = 'approved',
                updated_at = NOW()
            WHERE id IN (${placeholders})
        `;

        const [result] = await pool.execute(updateQuery, review_ids);

        res.json({
            success: true,
            message: `${result.affectedRows} reviews approved`,
            affected_rows: result.affectedRows
        });

    } catch (error) {
        console.error('Bulk approve error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to bulk approve reviews' 
        });
    }
});

// ========================================
// POST /api/admin/reviews/bulk-reject - Bulk reject reviews
// ========================================
router.post('/bulk-reject', async (req, res) => {
    try {
        const { review_ids } = req.body;

        if (!Array.isArray(review_ids) || review_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid review IDs'
            });
        }

        const placeholders = review_ids.map(() => '?').join(',');
        const updateQuery = `
            UPDATE reviews 
            SET status = 'rejected',
                updated_at = NOW()
            WHERE id IN (${placeholders})
        `;

        const [result] = await pool.execute(updateQuery, review_ids);

        res.json({
            success: true,
            message: `${result.affectedRows} reviews rejected`,
            affected_rows: result.affectedRows
        });

    } catch (error) {
        console.error('Bulk reject error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to bulk reject reviews' 
        });
    }
});

// ========================================
// PUT /api/admin/reviews/:id/response - Add admin response
// ========================================
router.put('/:id/response', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_response } = req.body;

        if (!admin_response || admin_response.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Admin response is required'
            });
        }

        const updateQuery = `
            UPDATE reviews 
            SET admin_response = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        const [result] = await pool.execute(updateQuery, [admin_response.trim(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Admin response added successfully'
        });

    } catch (error) {
        console.error('Add admin response error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add admin response' 
        });
    }
});

export default router;