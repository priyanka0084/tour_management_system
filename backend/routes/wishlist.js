import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ==================== GET ALL WISHLIST ITEMS ====================
// GET /api/wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [wishlistItems] = await pool.query(
      `SELECT 
        w.id as wishlist_id,
        w.place_id,
        w.package_id,
        w.notes,
        w.added_at,
        p.name as place_name,
        p.description as place_description,
        p.image_url,
        p.rating,
        p.price_per_person,
        p.duration_days,
        co.name as country_name,
        co.code as country_code
      FROM wishlist w
      INNER JOIN places p ON w.place_id = p.id
      INNER JOIN countries co ON p.country_id = co.id
      WHERE w.user_id = ?
      ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      wishlist: wishlistItems,
      count: wishlistItems.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist items'
    });
  }
});

// ==================== GET WISHLIST COUNT ====================
// GET /api/wishlist/count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist count'
    });
  }
});

// ==================== ADD ITEM TO WISHLIST ====================
// POST /api/wishlist/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { place_id, package_id = null, notes = null } = req.body;

    if (!place_id) {
      return res.status(400).json({
        success: false,
        error: 'Place ID is required'
      });
    }

    // Check if place exists
    const [places] = await pool.query(
      'SELECT id, name FROM places WHERE id = ?',
      [place_id]
    );

    if (places.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Place not found'
      });
    }

    const place = places[0];

    // Check if item already in wishlist
    const [existing] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND place_id = ?',
      [userId, place_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This place is already in your wishlist',
        alreadyInWishlist: true
      });
    }

    // Add to wishlist
    const [result] = await pool.query(
      `INSERT INTO wishlist (user_id, place_id, package_id, notes) 
       VALUES (?, ?, ?, ?)`,
      [userId, place_id, package_id, notes]
    );

    // Get updated wishlist count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: `${place.name} added to wishlist!`,
      wishlist_id: result.insertId,
      wishlistCount: countResult[0].count
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to wishlist'
    });
  }
});

// ==================== REMOVE ITEM FROM WISHLIST ====================
// DELETE /api/wishlist/remove/:wishlistId
router.delete('/remove/:wishlistId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { wishlistId } = req.params;

    // Verify wishlist item belongs to user
    const [items] = await pool.query(
      'SELECT w.id, p.name FROM wishlist w INNER JOIN places p ON w.place_id = p.id WHERE w.id = ? AND w.user_id = ?',
      [wishlistId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist item not found'
      });
    }

    // Delete from wishlist
    await pool.query('DELETE FROM wishlist WHERE id = ?', [wishlistId]);

    // Get updated wishlist count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `${items[0].name} removed from wishlist`,
      wishlistCount: countResult[0].count
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from wishlist'
    });
  }
});

// ==================== CLEAR ENTIRE WISHLIST ====================
// DELETE /api/wishlist/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query('DELETE FROM wishlist WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear wishlist'
    });
  }
});

// ==================== CHECK IF PLACE IN WISHLIST ====================
// GET /api/wishlist/check/:placeId
router.get('/check/:placeId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.params;

    const [items] = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND place_id = ?',
      [userId, placeId]
    );

    res.json({
      success: true,
      inWishlist: items.length > 0,
      wishlistId: items.length > 0 ? items[0].id : null
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check wishlist'
    });
  }
});

export default router;