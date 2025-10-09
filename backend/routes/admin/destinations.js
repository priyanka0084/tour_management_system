import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

// ==================== COUNTRIES CRUD ====================

router.get('/countries', async (req, res) => {
  try {
    const [countries] = await pool.execute('SELECT * FROM countries ORDER BY name ASC');
    res.json({ success: true, countries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch countries' });
  }
});

// CREATE new country
router.post('/countries', async (req, res) => {
  try {
    const { name, code, image_url, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, error: 'Name and code are required' });

    const [result] = await pool.execute(
      'INSERT INTO countries (name, code, image_url, description) VALUES (?, ?, ?, ?)',
      [name, code, image_url || '', description || '']
    );
    res.json({ success: true, message: 'Country added successfully', countryId: result.insertId });
  } catch (error) {
    console.error('Create country error:', error);
    res.status(500).json({ success: false, error: 'Failed to create country' });
  }
});

// UPDATE country
router.put('/countries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, image_url, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, error: 'Name and code are required' });

    await pool.execute(
      'UPDATE countries SET name = ?, code = ?, image_url = ?, description = ? WHERE id = ?',
      [name, code, image_url || '', description || '', id]
    );
    res.json({ success: true, message: 'Country updated successfully' });
  } catch (error) {
    console.error('Update country error:', error);
    res.status(500).json({ success: false, error: 'Failed to update country' });
  }
});

// DELETE country
router.delete('/countries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM countries WHERE id = ?', [id]);
    res.json({ success: true, message: 'Country deleted successfully' });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete country' });
  }
});

// ==================== PLACES CRUD ====================

router.get('/places', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.name, p.country_id, p.image_url, p.description, p.rating, p.price_per_person, p.duration_days, c.name as country_name
      FROM places p
      JOIN countries c ON p.country_id = c.id
      ORDER BY p.name ASC
    `;
    const [places] = await pool.execute(query);
    res.json({ success: true, places });
  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch places' });
  }
});

router.post('/places', async (req, res) => {
  try {
    const { name, country_id, image_url, description, rating, price_per_person, duration_days } = req.body;
    if (!name || !country_id) return res.status(400).json({ success: false, error: 'Name and country are required' });

    const [result] = await pool.execute(
      'INSERT INTO places (name, country_id, image_url, description, rating, price_per_person, duration_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, country_id, image_url || '', description || '', rating || 0, price_per_person || 0, duration_days || 1]
    );
    res.json({ success: true, message: 'Place added successfully', placeId: result.insertId });
  } catch (error) {
    console.error('Create place error:', error);
    res.status(500).json({ success: false, error: 'Failed to create place' });
  }
});

router.put('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country_id, image_url, description, rating, price_per_person, duration_days } = req.body;
    if (!name || !country_id) return res.status(400).json({ success: false, error: 'Name and country are required' });

    await pool.execute(
      'UPDATE places SET name = ?, country_id = ?, image_url = ?, description = ?, rating = ?, price_per_person = ?, duration_days = ? WHERE id = ?',
      [name, country_id, image_url || '', description || '', rating || 0, price_per_person || 0, duration_days || 1, id]
    );
    res.json({ success: true, message: 'Place updated successfully' });
  } catch (error) {
    console.error('Update place error:', error);
    res.status(500).json({ success: false, error: 'Failed to update place' });
  }
});

router.delete('/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM places WHERE id = ?', [id]);
    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (error) {
    console.error('Delete place error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete place' });
  }
});

export default router;
