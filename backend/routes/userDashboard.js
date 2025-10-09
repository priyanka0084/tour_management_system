import express from 'express';
import { pool } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ============================================
// MULTER CONFIGURATION
// ============================================

const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ============================================
// ROUTES (All Protected with authMiddleware)
// ============================================

// Get Profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.execute(
            `SELECT id, name as full_name, email, phone, date_of_birth, address, city, 
                    country, profile_picture, role, created_at 
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, date_of_birth, address, city, country } = req.body;

        if (!full_name) {
            return res.status(400).json({ success: false, error: 'Full name is required' });
        }

        await pool.execute(
            `UPDATE users 
             SET name = ?, phone = ?, date_of_birth = ?, address = ?, city = ?, country = ?
             WHERE id = ?`,
            [full_name, phone || null, date_of_birth || null, address || null, city || null, country || 'India', userId]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Upload Profile Picture
router.post('/upload-profile-picture', authMiddleware, upload.single('profile_picture'), async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const [users] = await pool.execute('SELECT profile_picture FROM users WHERE id = ?', [userId]);
        const oldPicture = users[0]?.profile_picture;

        if (oldPicture) {
            const oldPath = path.join(__dirname, '../uploads/profiles', path.basename(oldPicture));
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        await pool.execute('UPDATE users SET profile_picture = ? WHERE id = ?', [imageUrl, userId]);

        res.json({ success: true, message: 'Profile picture uploaded successfully', imageUrl: imageUrl });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Bookings
router.get('/bookings', authMiddleware, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const [bookings] = await pool.execute(
            `SELECT b.*, p.title as packageName, pl.name as placeName
             FROM bookings b
             LEFT JOIN packages p ON b.tour_destination = p.title
             LEFT JOIN places pl ON b.tour_destination = pl.name
             WHERE b.email = ?
             ORDER BY b.booking_date DESC`,
            [userEmail]
        );

        res.json({ success: true, bookings: bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        const [bookingCount] = await pool.execute('SELECT COUNT(*) as count FROM bookings WHERE email = ?', [userEmail]);
        const [completedCount] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE email = ? AND status = 'completed'", [userEmail]);
        const [wishlistCount] = await pool.execute('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?', [userId]);
        const [reviewsCount] = await pool.execute('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            stats: {
                totalBookings: bookingCount[0].count,
                placesVisited: completedCount[0].count,
                wishlistCount: wishlistCount[0].count,
                reviewsCount: reviewsCount[0].count
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Wishlist
router.get('/wishlist', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [wishlist] = await pool.execute(
            `SELECT w.*, p.*, pl.name as place_name, pl.image_url, c.name as country_name
             FROM wishlist w
             INNER JOIN packages p ON w.package_id = p.id
             INNER JOIN places pl ON w.place_id = pl.id
             INNER JOIN countries c ON pl.country_id = c.id
             WHERE w.user_id = ?
             ORDER BY w.added_date DESC`,
            [userId]
        );

        res.json({ success: true, wishlist: wishlist });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add to Wishlist
router.post('/wishlist/:packageId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const packageId = req.params.packageId;
        const { notes } = req.body;

        const [packages] = await pool.execute('SELECT place_id FROM packages WHERE id = ?', [packageId]);
        if (packages.length === 0) {
            return res.status(404).json({ success: false, error: 'Package not found' });
        }

        const placeId = packages[0].place_id;
        const [existing] = await pool.execute('SELECT id FROM wishlist WHERE user_id = ? AND package_id = ?', [userId, packageId]);

        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Already in wishlist' });
        }

        await pool.execute('INSERT INTO wishlist (user_id, package_id, place_id, notes) VALUES (?, ?, ?, ?)', [userId, packageId, placeId, notes || null]);

        res.json({ success: true, message: 'Added to wishlist successfully' });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Remove from Wishlist
router.delete('/wishlist/:packageId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const packageId = req.params.packageId;

        const [result] = await pool.execute('DELETE FROM wishlist WHERE user_id = ? AND package_id = ?', [userId, packageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Item not found in wishlist' });
        }

        res.json({ success: true, message: 'Removed from wishlist successfully' });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Reviews
router.get('/reviews', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [reviews] = await pool.execute(
            `SELECT r.*, b.tour_destination, b.tour_date, pl.name as place_name, pl.image_url as place_image, p.title as package_name
             FROM reviews r
             INNER JOIN bookings b ON r.booking_id = b.id
             LEFT JOIN places pl ON r.place_id = pl.id
             LEFT JOIN packages p ON r.package_id = p.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({ success: true, reviews: reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Bookings for Review
router.get('/bookings-for-review', authMiddleware, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const [bookings] = await pool.execute(
            `SELECT b.*, p.id as package_id, p.title as package_name, pl.id as place_id, pl.name as place_name
             FROM bookings b
             LEFT JOIN packages p ON b.tour_destination = p.title
             LEFT JOIN places pl ON b.tour_destination = pl.name
             LEFT JOIN reviews r ON r.booking_id = b.id
             WHERE b.email = ? AND b.status = 'completed' AND r.id IS NULL
             ORDER BY b.tour_date DESC`,
            [userEmail]
        );

        res.json({ success: true, bookings: bookings });
    } catch (error) {
        console.error('Get bookings for review error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get Notifications
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, unread_only = false } = req.query;

        let query = `SELECT id, type, title, message, link, is_read, created_at FROM notifications WHERE user_id = ?`;
        if (unread_only === 'true') query += ' AND is_read = FALSE';
        query += ' ORDER BY created_at DESC LIMIT ?';

        const [notifications] = await pool.execute(query, [userId, parseInt(limit)]);
        const [countResult] = await pool.execute('SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE', [userId]);

        res.json({ success: true, notifications: notifications, unread_count: countResult[0].unread_count });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Mark Notification as Read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notificationId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Mark All Notifications as Read
router.put('/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;