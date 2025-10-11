import express from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ==================== GET ALL CART ITEMS ====================
// GET /api/cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.query(
      `SELECT 
        c.id as cart_id,
        c.place_id,
        c.package_id,
        c.quantity,
        c.added_at,
        p.name as place_name,
        p.description as place_description,
        p.image_url,
        p.rating,
        p.price_per_person,
        p.duration_days,
        co.name as country_name,
        co.code as country_code
      FROM cart c
      INNER JOIN places p ON c.place_id = p.id
      INNER JOIN countries co ON p.country_id = co.id
      WHERE c.user_id = ?
      ORDER BY c.added_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      cart: cartItems,
      count: cartItems.length
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart items'
    });
  }
});

// ==================== GET CART COUNT ====================
// GET /api/cart/count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart count'
    });
  }
});

// ==================== ADD ITEM TO CART ====================
// POST /api/cart/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { place_id, package_id = null, quantity = 1 } = req.body;

    if (!place_id) {
      return res.status(400).json({
        success: false,
        error: 'Place ID is required'
      });
    }

    // Check if place exists
    const [places] = await pool.query(
      'SELECT id, name, price_per_person FROM places WHERE id = ?',
      [place_id]
    );

    if (places.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Place not found'
      });
    }

    const place = places[0];

    // Check if item already in cart
    const [existing] = await pool.query(
      'SELECT id FROM cart WHERE user_id = ? AND place_id = ?',
      [userId, place_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This place is already in your cart',
        alreadyInCart: true
      });
    }

    // Add to cart
    const [result] = await pool.query(
      `INSERT INTO cart (user_id, place_id, package_id, quantity, price_snapshot) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, place_id, package_id, quantity, place.price_per_person]
    );

    // Get updated cart count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: `${place.name} added to cart!`,
      cart_id: result.insertId,
      cartCount: countResult[0].count
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

// ==================== UPDATE CART ITEM QUANTITY ====================
// PUT /api/cart/update/:cartId
router.put('/update/:cartId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Verify cart item belongs to user
    const [items] = await pool.query(
      'SELECT id FROM cart WHERE id = ? AND user_id = ?',
      [cartId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    // Update quantity
    await pool.query(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, cartId]
    );

    res.json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart'
    });
  }
});

// ==================== REMOVE ITEM FROM CART ====================
// DELETE /api/cart/remove/:cartId
router.delete('/remove/:cartId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.params;

    // Verify cart item belongs to user
    const [items] = await pool.query(
      'SELECT c.id, p.name FROM cart c INNER JOIN places p ON c.place_id = p.id WHERE c.id = ? AND c.user_id = ?',
      [cartId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    // Delete from cart
    await pool.query('DELETE FROM cart WHERE id = ?', [cartId]);

    // Get updated cart count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `${items[0].name} removed from cart`,
      cartCount: countResult[0].count
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

// ==================== CLEAR ENTIRE CART ====================
// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// ==================== CHECK IF PLACE IN CART ====================
// GET /api/cart/check/:placeId
router.get('/check/:placeId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.params;

    const [items] = await pool.query(
      'SELECT id FROM cart WHERE user_id = ? AND place_id = ?',
      [userId, placeId]
    );

    res.json({
      success: true,
      inCart: items.length > 0,
      cartId: items.length > 0 ? items[0].id : null
    });
  } catch (error) {
    console.error('Error checking cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check cart'
    });
  }
});

export default router;