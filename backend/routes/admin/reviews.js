// ========================================
// ADMIN REVIEWS API ROUTES
// ExploreEase Travel Booking Platform
// ========================================

import express from 'express';
import { pool } from '../../db.js';  
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);


// ========================================
// ADMIN REVIEW MANAGEMENT ROUTES
// ========================================

// GET /api/admin/reviews - Get all reviews with filters
router.get('/', async (req, res) => {
    try {
        const {
            status = 'all',
            place_id,
            user_id,
            rating,
            sort_by = 'recent',
            limit = 50,
            offset = 0
        } = req.query;

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
                r.status,
                r.verified_purchase,
                r.helpful_count,
                r.reported_count,
                r.created_at,
                r.updated_at,
                r.moderation_date,
                r.admin_notes,
                u.full_name as user_name,
                u.email as user_email,
                u.profile_picture as user_image,
                p.name as place_name,
                c.name as country_name,
                pkg.title as package_name,
                mod_user.full_name as moderated_by_name,
                (SELECT GROUP_CONCAT(image_url) 
                 FROM review_images 
                 WHERE review_id = r.id 
                 ORDER BY image_order) as images
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            INNER JOIN places p ON r.place_id = p.id
            INNER JOIN countries c ON p.country_id = c.id
            LEFT JOIN packages pkg ON r.package_id = pkg.id
            LEFT JOIN users mod_user ON r.moderated_by = mod_user.id
            WHERE 1=1
        `;

        const params = [];

        // Apply filters
        if (status !== 'all') {
            query += ' AND r.status = ?';
            params.push(status);
        }

        if (place_id) {
            query += ' AND r.place_id = ?';
            params.push(place_id);
        }

        if (user_id) {
            query += ' AND r.user_id = ?';
            params.push(user_id);
        }

        if (rating) {
            query += ' AND r.rating = ?';
            params.push(rating);
        }

        // Apply sorting
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
                query += ' ORDER BY r.reported_count DESC, r.created_at DESC';
                break;
            case 'recent':
            default:
                query += ' ORDER BY r.created_at DESC';
                break;
        }

        // Apply pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(query, params);

        // Process images
        const reviews = rows.map(review => ({
            ...review,
            images: review.images ? review.images.split(',') : []
        }));

        // Get counts for each status
        const [counts] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM reviews
            GROUP BY status
        `);

        const statusCounts = {
            all: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        };

        counts.forEach(({ status, count }) => {
            statusCounts[status] = count;
            statusCounts.all += count;
        });

        res.json({
            success: true,
            reviews,
            counts: statusCounts,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: reviews.length
            }
        });

    } catch (error) {
        console.error('Admin get reviews error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
});

// GET /api/admin/reviews/stats - Get review statistics
router.get('/stats', async (req, res) => {
    try {
        // Overall stats
        const [overallStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_reviews,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reviews,
                ROUND(AVG(rating), 2) as average_rating,
                SUM(helpful_count) as total_helpful_votes,
                COUNT(CASE WHEN reported_count > 0 THEN 1 END) as reported_reviews
            FROM reviews
        `);

        // Recent reviews (last 30 days)
        const [recentStats] = await pool.execute(`
            SELECT 
                COUNT(*) as reviews_last_30_days,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_last_30_days
            FROM reviews
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAYS)
        `);

        // Top reviewed places
        const [topPlaces] = await pool.execute(`
            SELECT 
                p.id,
                p.name,
                p.image_url,
                COUNT(r.id) as review_count,
                ROUND(AVG(r.rating), 2) as average_rating
            FROM places p
            INNER JOIN reviews r ON p.id = r.place_id
            WHERE r.status = 'approved'
            GROUP BY p.id
            ORDER BY review_count DESC
            LIMIT 5
        `);

        // Rating distribution
        const [ratingDist] = await pool.execute(`
            SELECT 
                rating,
                COUNT(*) as count
            FROM reviews
            WHERE status = 'approved'
            GROUP BY rating
            ORDER BY rating DESC
        `);

        res.json({
            success: true,
            stats: {
                ...overallStats[0],
                ...recentStats[0],
                top_places: topPlaces,
                rating_distribution: ratingDist
            }
        });

    } catch (error) {
        console.error('Admin review stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review statistics'
        });
    }
});

// GET /api/admin/reviews/:id - Get single review details (admin view)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                r.*,
                u.full_name as user_name,
                u.email as user_email,
                u.profile_picture as user_image,
                p.name as place_name,
                c.name as country_name,
                pkg.title as package_name,
                b.tour_date,
                b.tour_destination,
                mod_user.full_name as moderated_by_name
            FROM reviews r
            INNER JOIN users u ON r.user_id = u.id
            INNER JOIN bookings b ON r.booking_id = b.id
            INNER JOIN places p ON r.place_id = p.id
            INNER JOIN countries c ON p.country_id = c.id
            LEFT JOIN packages pkg ON r.package_id = pkg.id
            LEFT JOIN users mod_user ON r.moderated_by = mod_user.id
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
            'SELECT id, image_url, caption, image_order FROM review_images WHERE review_id = ? ORDER BY image_order',
            [id]
        );

        // Get reports for this review
        const [reports] = await pool.execute(`
            SELECT 
                rr.id,
                rr.reason,
                rr.description,
                rr.status,
                rr.created_at,
                u.full_name as reported_by_name,
                u.email as reported_by_email
            FROM review_reports rr
            INNER JOIN users u ON rr.reported_by = u.id
            WHERE rr.review_id = ?
            ORDER BY rr.created_at DESC
        `, [id]);

        const review = {
            ...rows[0],
            images,
            reports
        };

        res.json({
            success: true,
            review
        });

    } catch (error) {
        console.error('Admin get review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review'
        });
    }
});

// PUT /api/admin/reviews/:id/approve - Approve review
router.put('/:id/approve', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const admin_id = req.user.id;
        const { admin_notes } = req.body;

        // Get review details
        const [reviews] = await connection.execute(
            'SELECT place_id, status FROM reviews WHERE id = ?',
            [id]
        );

        if (reviews.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        const { place_id, status } = reviews[0];

        if (status === 'approved') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Review is already approved'
            });
        }

        // Approve review
        await connection.execute(
            `UPDATE reviews 
             SET status = 'approved', 
                 moderated_by = ?, 
                 moderation_date = NOW(),
                 admin_notes = ?
             WHERE id = ?`,
            [admin_id, admin_notes || null, id]
        );

        // Update place ratings
        await connection.query('CALL UpdatePlaceRatings(?)', [place_id]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Review approved successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Approve review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve review'
        });
    } finally {
        connection.release();
    }
});

// PUT /api/admin/reviews/:id/reject - Reject review
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const admin_id = req.user.id;
        const { admin_notes } = req.body;

        // Get review details
        const [reviews] = await pool.execute(
            'SELECT status FROM reviews WHERE id = ?',
            [id]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        const { status } = reviews[0];

        if (status === 'rejected') {
            return res.status(400).json({
                success: false,
                error: 'Review is already rejected'
            });
        }

        // Reject review
        await pool.execute(
            `UPDATE reviews 
             SET status = 'rejected', 
                 moderated_by = ?, 
                 moderation_date = NOW(),
                 admin_notes = ?
             WHERE id = ?`,
            [admin_id, admin_notes || null, id]
        );

        res.json({
            success: true,
            message: 'Review rejected successfully'
        });

    } catch (error) {
        console.error('Reject review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject review'
        });
    }
});

// DELETE /api/admin/reviews/:id - Delete review (admin only)
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Get review details
        const [reviews] = await connection.execute(
            'SELECT place_id FROM reviews WHERE id = ?',
            [id]
        );

        if (reviews.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        const place_id = reviews[0].place_id;

        // Get review images before deletion
        const [images] = await connection.execute(
            'SELECT image_url FROM review_images WHERE review_id = ?',
            [id]
        );

        // Delete review (cascade will delete images and reports from DB)
        await connection.execute('DELETE FROM reviews WHERE id = ?', [id]);

        // Delete image files from filesystem
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'reviews');
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
        console.error('Admin delete review error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review'
        });
    } finally {
        connection.release();
    }
});

// PUT /api/admin/reviews/:id/notes - Update admin notes
router.put('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        await pool.execute(
            'UPDATE reviews SET admin_notes = ? WHERE id = ?',
            [admin_notes || null, id]
        );

        res.json({
            success: true,
            message: 'Admin notes updated successfully'
        });

    } catch (error) {
        console.error('Update admin notes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update admin notes'
        });
    }
});

// GET /api/admin/reviews/reports - Get all reported reviews
router.get('/management/reports', async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        let query = `
            SELECT 
                rr.id,
                rr.review_id,
                rr.reason,
                rr.description,
                rr.status,
                rr.created_at,
                rr.reviewed_at,
                rr.admin_action,
                u.full_name as reported_by_name,
                u.email as reported_by_email,
                r.title as review_title,
                r.rating as review_rating,
                r.review_text,
                reviewer.full_name as reviewer_name,
                p.name as place_name
            FROM review_reports rr
            INNER JOIN users u ON rr.reported_by = u.id
            INNER JOIN reviews r ON rr.review_id = r.id
            INNER JOIN users reviewer ON r.user_id = reviewer.id
            INNER JOIN places p ON r.place_id = p.id
        `;

        const params = [];

        if (status !== 'all') {
            query += ' WHERE rr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY rr.created_at DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            reports: rows
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports'
        });
    }
});

// PUT /api/admin/reviews/reports/:id/resolve - Resolve a report
router.put('/reports/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const admin_id = req.user.id;
        const { status, admin_action } = req.body;

        if (!['reviewed', 'dismissed', 'action_taken'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        await pool.execute(
            `UPDATE review_reports 
             SET status = ?, 
                 reviewed_by = ?, 
                 reviewed_at = NOW(),
                 admin_action = ?
             WHERE id = ?`,
            [status, admin_id, admin_action || null, id]
        );

        res.json({
            success: true,
            message: 'Report resolved successfully'
        });

    } catch (error) {
        console.error('Resolve report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resolve report'
        });
    }
});

// POST /api/admin/reviews/bulk-approve - Bulk approve reviews
router.post('/bulk-approve', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { review_ids } = req.body;
        const admin_id = req.user.id;

        if (!review_ids || !Array.isArray(review_ids) || review_ids.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Review IDs array is required'
            });
        }

        // Get place IDs for reviews
        const placeholders = review_ids.map(() => '?').join(',');
        const [reviews] = await connection.execute(
            `SELECT DISTINCT place_id FROM reviews WHERE id IN (${placeholders})`,
            review_ids
        );

        // Approve reviews
        await connection.execute(
            `UPDATE reviews 
             SET status = 'approved', 
                 moderated_by = ?, 
                 moderation_date = NOW()
             WHERE id IN (${placeholders})`,
            [admin_id, ...review_ids]
        );

        // Update place ratings for all affected places
        for (const { place_id } of reviews) {
            await connection.query('CALL UpdatePlaceRatings(?)', [place_id]);
        }

        await connection.commit();

        res.json({
            success: true,
            message: `${review_ids.length} reviews approved successfully`
        });

    } catch (error) {
        await connection.rollback();
        console.error('Bulk approve error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve reviews'
        });
    } finally {
        connection.release();
    }
});

// POST /api/admin/reviews/bulk-reject - Bulk reject reviews
router.post('/bulk-reject', async (req, res) => {
    try {
        const { review_ids, admin_notes } = req.body;
        const admin_id = req.user.id;

        if (!review_ids || !Array.isArray(review_ids) || review_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Review IDs array is required'
            });
        }

        const placeholders = review_ids.map(() => '?').join(',');
        
        await pool.execute(
            `UPDATE reviews 
             SET status = 'rejected', 
                 moderated_by = ?, 
                 moderation_date = NOW(),
                 admin_notes = ?
             WHERE id IN (${placeholders})`,
            [admin_id, admin_notes || null, ...review_ids]
        );

        res.json({
            success: true,
            message: `${review_ids.length} reviews rejected successfully`
        });

    } catch (error) {
        console.error('Bulk reject error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject reviews'
        });
    }
});

// POST /api/admin/reviews/bulk-delete - Bulk delete reviews
router.post('/bulk-delete', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { review_ids } = req.body;

        if (!review_ids || !Array.isArray(review_ids) || review_ids.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Review IDs array is required'
            });
        }

        const placeholders = review_ids.map(() => '?').join(',');

        // Get place IDs and images before deletion
        const [reviews] = await connection.execute(
            `SELECT DISTINCT place_id FROM reviews WHERE id IN (${placeholders})`,
            review_ids
        );

        const [images] = await connection.execute(
            `SELECT image_url FROM review_images WHERE review_id IN (${placeholders})`,
            review_ids
        );

        // Delete reviews
        await connection.execute(
            `DELETE FROM reviews WHERE id IN (${placeholders})`,
            review_ids
        );

        // Delete image files
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'reviews');
        images.forEach(img => {
            const filename = img.image_url.split('/').pop();
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Update place ratings
        for (const { place_id } of reviews) {
            await connection.query('CALL UpdatePlaceRatings(?)', [place_id]);
        }

        await connection.commit();

        res.json({
            success: true,
            message: `${review_ids.length} reviews deleted successfully`
        });

    } catch (error) {
        await connection.rollback();
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete reviews'
        });
    } finally {
        connection.release();
    }
});


export default router;