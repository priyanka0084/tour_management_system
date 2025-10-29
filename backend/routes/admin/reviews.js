// backend/routes/reviews.js

import express from 'express';
import { pool } from '../../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reviews/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// ============================================
// GET /api/reviews/user/bookings-for-review
// Get completed bookings without reviews for logged-in user
// ============================================
router.get('/user/bookings-for-review', async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const query = `
      SELECT 
        b.id,
        b.tour_destination as package_name,
        b.tour_date,
        b.booking_date,
        b.place_id,
        b.package_id,
        p.name as place_name,
        p.image_url as place_image,
        c.name as country_name
      FROM bookings b
      LEFT JOIN places p ON b.place_id = p.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN reviews r ON b.id = r.booking_id
      WHERE b.user_id = ?
        AND b.booking_status = 'completed'
        AND b.payment_status IN ('success', 'confirmed')
        AND r.id IS NULL
      ORDER BY b.tour_date DESC
    `;

    const [bookings] = await pool.execute(query, [userId]);

    res.json({
      success: true,
      bookings: bookings
    });

  } catch (error) {
    console.error('Get bookings for review error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bookings' 
    });
  }
});

// ============================================
// GET /api/reviews/user/my-reviews
// Get all reviews by logged-in user
// ============================================
router.get('/user/my-reviews', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const query = `
      SELECT 
        r.*,
        p.name as place_name,
        p.image_url as place_image,
        c.name as country_name,
        u.full_name as user_name
      FROM reviews r
      LEFT JOIN places p ON r.place_id = p.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;

    const [reviews] = await pool.execute(query, [userId]);

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reviews' 
    });
  }
});

// ============================================
// POST /api/reviews
// Create a new review
// ============================================
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const {
      booking_id,
      place_id,
      package_id,
      rating,
      title,
      review_text
    } = req.body;

    // Validate required fields
    if (!booking_id || !place_id || !rating || !title || !review_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if review already exists for this booking
    const [existingReview] = await pool.execute(
      'SELECT id FROM reviews WHERE booking_id = ?',
      [booking_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Review already exists for this booking'
      });
    }

    // Insert review
    const [result] = await pool.execute(
      `INSERT INTO reviews 
      (booking_id, user_id, place_id, package_id, rating, title, review_text, status, verified_purchase, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1, NOW())`,
      [booking_id, userId, place_id, package_id || null, rating, title, review_text]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      reviewId: result.insertId
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit review' 
    });
  }
});

// ============================================
// GET /api/reviews
// Get all approved reviews (public)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'approved', 
      rating, 
      place_id, 
      sort_by = 'recent',
      limit = 10,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        r.*,
        p.name as place_name,
        p.image_url as place_image,
        c.name as country_name,
        u.full_name as user_name
      FROM reviews r
      LEFT JOIN places p ON r.place_id = p.id
      LEFT JOIN countries c ON p.country_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.status = ?
    `;

    const params = [status];

    if (rating) {
      query += ` AND r.rating >= ?`;
      params.push(rating);
    }

    if (place_id) {
      query += ` AND r.place_id = ?`;
      params.push(place_id);
    }

    // Sorting
    if (sort_by === 'recent') {
      query += ` ORDER BY r.created_at DESC`;
    } else if (sort_by === 'rating_high') {
      query += ` ORDER BY r.rating DESC, r.created_at DESC`;
    } else if (sort_by === 'rating_low') {
      query += ` ORDER BY r.rating ASC, r.created_at DESC`;
    } else if (sort_by === 'helpful') {
      query += ` ORDER BY r.helpful_count DESC, r.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [reviews] = await pool.execute(query, params);

    res.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reviews' 
    });
  }
});

// ============================================
// DELETE /api/reviews/:id
// Delete own review
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const reviewId = req.params.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    // Check if review belongs to user
    const [review] = await pool.execute(
      'SELECT id FROM reviews WHERE id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or unauthorized'
      });
    }

    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

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

export default router;