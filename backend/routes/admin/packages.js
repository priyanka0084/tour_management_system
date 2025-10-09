import express from 'express';
import { pool } from '../../db.js';

const router = express.Router();

// ==================== PACKAGES CRUD ====================

// GET all packages
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                pkg.id,
                pkg.place_id,
                pkg.title,
                pkg.description,
                pkg.price,
                pkg.duration_days,
                pkg.services,
                pkg.places_included,
                pkg.itinerary,
                p.name as place_name,
                c.name as country_name
            FROM packages pkg
            JOIN places p ON pkg.place_id = p.id
            JOIN countries c ON p.country_id = c.id
            ORDER BY pkg.title ASC
        `;
        
        const [packages] = await pool.execute(query);
        res.json({ success: true, packages });
    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch packages' });
    }
});

// GET packages by place ID
router.get('/place/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        
        const query = `
            SELECT 
                pkg.id,
                pkg.place_id,
                pkg.title,
                pkg.description,
                pkg.price,
                pkg.duration_days,
                pkg.services,
                pkg.places_included,
                pkg.itinerary,
                p.name as place_name
            FROM packages pkg
            JOIN places p ON pkg.place_id = p.id
            WHERE pkg.place_id = ?
            ORDER BY pkg.price ASC
        `;
        
        const [packages] = await pool.execute(query, [placeId]);
        res.json({ success: true, packages });
    } catch (error) {
        console.error('Get packages by place error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch packages' });
    }
});

// CREATE new package
router.post('/', async (req, res) => {
    try {
        const { 
            place_id, 
            title, 
            description, 
            price, 
            duration_days, 
            services, 
            places_included, 
            itinerary 
        } = req.body;

        if (!place_id || !title || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Place, title, and price are required' 
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO packages 
            (place_id, title, description, price, duration_days, services, places_included, itinerary) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                place_id,
                title,
                description || '',
                price,
                duration_days || 1,
                services || '',
                places_included || '',
                itinerary || ''
            ]
        );

        res.json({ 
            success: true, 
            message: 'Package added successfully',
            packageId: result.insertId 
        });
    } catch (error) {
        console.error('Create package error:', error);
        res.status(500).json({ success: false, error: 'Failed to create package' });
    }
});

// UPDATE package
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            place_id, 
            title, 
            description, 
            price, 
            duration_days, 
            services, 
            places_included, 
            itinerary 
        } = req.body;

        if (!place_id || !title || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Place, title, and price are required' 
            });
        }

        await pool.execute(
            `UPDATE packages SET 
            place_id = ?, 
            title = ?, 
            description = ?, 
            price = ?, 
            duration_days = ?, 
            services = ?, 
            places_included = ?, 
            itinerary = ? 
            WHERE id = ?`,
            [
                place_id,
                title,
                description || '',
                price,
                duration_days || 1,
                services || '',
                places_included || '',
                itinerary || '',
                id
            ]
        );

        res.json({ success: true, message: 'Package updated successfully' });
    } catch (error) {
        console.error('Update package error:', error);
        res.status(500).json({ success: false, error: 'Failed to update package' });
    }
});

// DELETE package
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM packages WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete package' });
    }
});

export default router;
