// userDashboard.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Middleware to check authentication
const authenticateUser = async (req, res, next) => {
  // This should be replaced with your actual authentication logic (JWT, session, etc.)
  const userId = req.session?.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = { id: userId };
  next();
};

// Get user profile
router.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, phone, role, personality_profile, 
              profile_image, created_at, last_login, is_verified,
              date_of_birth, gender, address, city, state, country, postal_code
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    if (user.personality_profile) {
      user.personality_profile = JSON.parse(user.personality_profile);
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const {
      name, phone, date_of_birth, gender,
      address, city, state, country, postal_code,
      personality_profile
    } = req.body;

    await pool.execute(
      `UPDATE users SET 
        name = ?, phone = ?, date_of_birth = ?, gender = ?,
        address = ?, city = ?, state = ?, country = ?, postal_code = ?,
        personality_profile = ?
       WHERE id = ?`,
      [
        name, phone, date_of_birth, gender,
        address, city, state, country, postal_code,
        JSON.stringify(personality_profile),
        req.user.id
      ]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile image
router.post('/api/user/profile-image', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    
    await pool.execute(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [imageUrl, req.user.id]
    );

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get user bookings
router.get('/api/user/bookings', authenticateUser, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT 
        b.id, b.booking_reference, b.tour_destination, b.tour_date,
        b.departure, b.adults, b.children, b.infants, b.amount,
        b.discount_amount, b.payment_status, b.status, b.booking_date,
        p.title as packageName, p.duration_days,
        pl.name as destination, pl.image_url,
        c.name as country
       FROM bookings b
       LEFT JOIN packages p ON b.package_id = p.id
       LEFT JOIN places pl ON p.place_id = pl.id
       LEFT JOIN countries c ON pl.country_id = c.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get user wishlist
router.get('/api/user/wishlist', authenticateUser, async (req, res) => {
  try {
    const [wishlist] = await pool.execute(
      `SELECT 
        w.id, w.notes, w.created_at,
        pl.id as place_id, pl.name, pl.image_url, 
        pl.price_per_person, pl.rating,
        c.name as country,
        p.id as package_id, p.title as package_name, p.price as package_price
       FROM wishlist w
       LEFT JOIN places pl ON w.place_id = pl.id
       LEFT JOIN packages p ON w.package_id = p.id
       LEFT JOIN countries c ON pl.country_id = c.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add to wishlist
router.post('/api/user/wishlist', authenticateUser, async (req, res) => {
  try {
    const { place_id, package_id, notes, notify_price_drop } = req.body;

    await pool.execute(
      `INSERT INTO wishlist (user_id, place_id, package_id, notes, notify_price_drop)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       notes = VALUES(notes), notify_price_drop = VALUES(notify_price_drop)`,
      [req.user.id, place_id, package_id, notes, notify_price_drop]
    );

    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove from wishlist
router.delete('/api/user/wishlist/:id', authenticateUser, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM wishlist WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Get user reviews
router.get('/api/user/reviews', authenticateUser, async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT 
        r.id, r.rating, r.title, r.review_text, r.helpful_count,
        r.images, r.status, r.created_at,
        pl.name as place_name, pl.image_url as place_image,
        p.title as package_name
       FROM reviews r
       LEFT JOIN places pl ON r.place_id = pl.id
       LEFT JOIN packages p ON r.package_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    // Parse JSON fields
    reviews.forEach(review => {
      if (review.images) {
        review.images = JSON.parse(review.images);
      }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user statistics
router.get('/api/user/stats', authenticateUser, async (req, res) => {
  try {
    // Total bookings
    const [bookingStats] = await pool.execute(
      'SELECT COUNT(*) as totalBookings FROM bookings WHERE user_id = ?',
      [req.user.id]
    );

    // Places visited (completed bookings)
    const [placesStats] = await pool.execute(
      `SELECT COUNT(DISTINCT pl.id) as placesVisited 
       FROM bookings b
       JOIN packages p ON b.package_id = p.id
       JOIN places pl ON p.place_id = pl.id
       WHERE b.user_id = ? AND b.status = 'completed'`,
      [req.user.id]
    );

    // Wishlist count
    const [wishlistStats] = await pool.execute(
      'SELECT COUNT(*) as wishlistCount FROM wishlist WHERE user_id = ?',
      [req.user.id]
    );

    // Reviews count
    const [reviewStats] = await pool.execute(
      'SELECT COUNT(*) as reviewsCount FROM reviews WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      totalBookings: bookingStats[0].totalBookings,
      placesVisited: placesStats[0].placesVisited,
      wishlistCount: wishlistStats[0].wishlistCount,
      reviewsCount: reviewStats[0].reviewsCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get notifications
router.get('/api/user/notifications', authenticateUser, async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, data, is_read, created_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    // Parse JSON data field
    notifications.forEach(notif => {
      if (notif.data) {
        notif.data = JSON.parse(notif.data);
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/api/user/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Change password
router.post('/api/user/change-password', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get booking details
router.get('/api/user/bookings/:id', authenticateUser, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT 
        b.*,
        p.title as packageName, p.description as packageDescription,
        p.duration_days, p.itinerary, p.services,
        pl.name as destination, pl.description as destinationDescription,
        c.name as country
       FROM bookings b
       LEFT JOIN packages p ON b.package_id = p.id
       LEFT JOIN places pl ON p.place_id = pl.id
       LEFT JOIN countries c ON pl.country_id = c.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Get passengers
    const [passengers] = await pool.execute(
      'SELECT * FROM passengers WHERE booking_id = ?',
      [booking.id]
    );

    booking.passengers = passengers;

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

module.exports = router;