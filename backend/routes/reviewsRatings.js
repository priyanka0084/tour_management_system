// reviewsRatings.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'tour_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Multer configuration for review images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reviews/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get reviews with filters
router.get('/api/reviews', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      rating, 
      destination, 
      sortBy = 'recent',
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let conditions = ['r.status = "approved"'];
    let params = [];
    let orderBy = 'r.created_at DESC';

    if (rating && rating !== 'all') {
      if (rating.includes('+')) {
        conditions.push('r.rating >= ?');
        params.push(parseInt(rating));
      } else {
        conditions.push('r.rating = ?');
        params.push(parseInt(rating));
      }
    }

    if (destination && destination !== 'all') {
      conditions.push('r.place_id = ?');
      params.push(destination);
    }

    if (search) {
      conditions.push('(r.title LIKE ? OR r.review_text LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    switch (sortBy) {
      case 'helpful':
        orderBy = 'r.helpful_count DESC, r.created_at DESC';
        break;
      case 'rating_high':
        orderBy = 'r.rating DESC, r.created_at DESC';
        break;
      case 'rating_low':
        orderBy = 'r.rating ASC, r.created_at DESC';
        break;
      default:
        orderBy = 'r.created_at DESC';
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`,
      params
    );

    // Get reviews
    const [reviews] = await pool.execute(
      `SELECT 
        r.id, r.rating, r.title, r.review_text, r.helpful_count,
        r.images, r.status, r.created_at,
        u.name as user_name, u.profile_image as user_image,
        pl.name as place_name, p.title as package_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN places pl ON r.place_id = pl.id
       LEFT JOIN packages p ON r.package_id = p.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Parse images JSON
    reviews.forEach(review => {
      if (review.images) {
        review.images = JSON.parse(review.images);
      }
    });

    // Get destinations for filter
    const [destinations] = await pool.execute(
      `SELECT DISTINCT pl.id, pl.name 
       FROM places pl
       JOIN reviews r ON pl.id = r.place_id
       WHERE r.status = 'approved'
       ORDER BY pl.name`
    );

    // Get packages for filter
    const [packages] = await pool.execute(
      `SELECT DISTINCT p.id, p.title 
       FROM packages p
       JOIN reviews r ON p.id = r.package_id
       WHERE r.status = 'approved'
       ORDER BY p.title`
    );

    res.json({
      reviews,
      destinations,
      packages,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's bookings eligible for review
router.get('/api/user/bookings-for-review', async (req, res) => {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [bookings] = await pool.execute(
      `SELECT 
        b.id, b.booking_reference, b.tour_date,
        p.id as package_id, p.title as packageName,
        pl.id as place_id, pl.name as destination
       FROM bookings b
       JOIN packages p ON b.package_id = p.id
       JOIN places pl ON p.place_id = pl.id
       LEFT JOIN reviews r ON b.id = r.booking_id
       WHERE b.user_id = ? 
         AND b.status = 'completed'
         AND b.tour_date < CURDATE()
         AND r.id IS NULL
       ORDER BY b.tour_date DESC`,
      [userId]
    );

    res.json(bookings);

  } catch (error) {
    console.error('Error fetching bookings for review:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Submit a review
router.post('/api/reviews', upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
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
    if (!rating || !title || !review_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify booking belongs to user
    const [bookings] = await pool.execute(
      'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND status = "completed"',
      [booking_id, userId]
    );

    if (bookings.length === 0) {
      return res.status(403).json({ error: 'Invalid booking' });
    }

    // Check if review already exists
    const [existingReview] = await pool.execute(
      'SELECT id FROM reviews WHERE booking_id = ?',
      [booking_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    // Process uploaded images
    const imageUrls = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    // Insert review
    const [result] = await pool.execute(
      `INSERT INTO reviews (
        booking_id, user_id, place_id, package_id,
        rating, title, review_text, images, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_id, userId, place_id, package_id,
        rating, title, review_text, 
        JSON.stringify(imageUrls), 
        'pending' // Reviews start as pending for moderation
      ]
    );

    // Update place rating
    await updatePlaceRating(place_id);

    // Send notification
    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        'review_submitted',
        'Review Submitted',
        'Your review has been submitted and is pending approval',
        JSON.stringify({ reviewId: result.insertId })
      ]
    );

    res.json({ success: true, reviewId: result.insertId });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Mark review as helpful
router.post('/api/reviews/:id/helpful', async (req, res) => {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];
    const { id } = req.params;

    // Check if user already marked as helpful
    if (userId) {
      const [existing] = await pool.execute(
        'SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ?',
        [id, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Already marked as helpful' });
      }

      // Insert helpful record
      await pool.execute(
        'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
    }

    // Update helpful count
    await pool.execute(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking helpful:', error);
    res.status(500).json({ error: 'Failed to mark as helpful' });
  }
});

// Get review statistics for a place
router.get('/api/reviews/stats/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    // Get rating distribution
    const [distribution] = await pool.execute(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE place_id = ? AND status = 'approved'
       GROUP BY rating
       ORDER BY rating DESC`,
      [placeId]
    );

    // Get total stats
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM reviews
       WHERE place_id = ? AND status = 'approved'`,
      [placeId]
    );

    res.json({
      distribution,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update review (for users to edit their own reviews)
router.put('/api/reviews/:id', upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];
    const { id } = req.params;
    const { rating, title, review_text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify review belongs to user
    const [reviews] = await pool.execute(
      'SELECT user_id, place_id FROM reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0 || reviews[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized to edit this review' });
    }

    // Update review
    await pool.execute(
      `UPDATE reviews 
       SET rating = ?, title = ?, review_text = ?, 
           status = 'pending', updated_at = NOW()
       WHERE id = ?`,
      [rating, title, review_text, id]
    );

    // Update place rating
    await updatePlaceRating(reviews[0].place_id);

    res.json({ success: true });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review (for users)
router.delete('/api/reviews/:id', async (req, res) => {
  try {
    const userId = req.session?.userId || req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify review belongs to user
    const [reviews] = await pool.execute(
      'SELECT user_id, place_id FROM reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0 || reviews[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    // Delete review
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);

    // Update place rating
    await updatePlaceRating(reviews[0].place_id);

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Helper function to update place rating
async function updatePlaceRating(placeId) {
  const [avgRating] = await pool.execute(
    `SELECT AVG(rating) as avg_rating
     FROM reviews
     WHERE place_id = ? AND status = 'approved'`,
    [placeId]
  );

  if (avgRating[0].avg_rating !== null) {
    await pool.execute(
      'UPDATE places SET rating = ? WHERE id = ?',
      [avgRating[0].avg_rating, placeId]
    );
  }
}

// Admin: Moderate reviews
router.put('/api/admin/reviews/:id/moderate', async (req, res) => {
  try {
    const adminId = req.session?.userId || req.headers['x-user-id'];
    const { id } = req.params;
    const { status } = req.body;

    // Verify admin role
    const [admins] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0 || admins[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get review details
    const [reviews] = await pool.execute(
      'SELECT user_id, place_id FROM reviews WHERE id = ?',
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review status
    await pool.execute(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [status, id]
    );

    // Update place rating if approved
    if (status === 'approved') {
      await updatePlaceRating(reviews[0].place_id);
    }

    // Send notification to user
    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reviews[0].user_id,
        'review_moderated',
        `Review ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your review has been ${status}`,
        JSON.stringify({ reviewId: id, status })
      ]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

module.exports = router;