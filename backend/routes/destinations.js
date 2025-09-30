const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/destinations - Get all destinations (places)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                p.id,
                p.name,
                p.image_url,
                p.description,
                p.rating,
                p.price_per_person,
                p.duration_days,
                c.name as country_name,
                c.code as country_code
            FROM places p
            JOIN countries c ON p.country_id = c.id
            ORDER BY p.rating DESC, p.name ASC
        `;

        const [rows] = await pool.execute(query);

        res.json({
            success: true,
            destinations: rows
        });

    } catch (error) {
        console.error('Get destinations error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/destinations/countries - Get all countries
router.get('/countries', async (req, res) => {
    try {
        const query = `
            SELECT id, name, code, image_url, description
            FROM countries
            ORDER BY name ASC
        `;

        const [rows] = await pool.execute(query);

        res.json({
            success: true,
            countries: rows
        });

    } catch (error) {
        console.error('Get countries error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/destinations/countries/:countryId/places - Get places by country
router.get('/countries/:countryId/places', async (req, res) => {
    try {
        const { countryId } = req.params;

        const query = `
            SELECT
                p.id,
                p.name,
                p.image_url,
                p.description,
                p.rating,
                p.price_per_person,
                p.duration_days,
                c.name as country_name,
                c.code as country_code
            FROM places p
            JOIN countries c ON p.country_id = c.id
            WHERE p.country_id = ?
            ORDER BY p.rating DESC, p.name ASC
        `;

        const [rows] = await pool.execute(query, [countryId]);

        res.json({
            success: true,
            places: rows
        });

    } catch (error) {
        console.error('Get places error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/destinations/places/:placeId - Get specific place details
router.get('/places/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;

        const query = `
            SELECT
                p.id,
                p.name,
                p.image_url,
                p.description,
                p.rating,
                p.price_per_person,
                p.duration_days,
                c.name as country_name,
                c.code as country_code
            FROM places p
            JOIN countries c ON p.country_id = c.id
            WHERE p.id = ?
        `;

        const [rows] = await pool.execute(query, [placeId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Place not found' });
        }

        res.json({
            success: true,
            place: rows[0]
        });

    } catch (error) {
        console.error('Get place error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/destinations/seed - Seed initial data (for development)
router.post('/seed', async (req, res) => {
    try {
        // Insert sample countries
        const countries = [
            { name: 'India', code: 'IN', image_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400', description: 'Land of diverse cultures and ancient heritage' },
            { name: 'France', code: 'FR', image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400', description: 'Country of art, fashion, and cuisine' },
            { name: 'Japan', code: 'JP', image_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', description: 'Island nation with rich traditions and technology' },
            { name: 'United States', code: 'US', image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', description: 'Land of opportunity and diverse landscapes' },
            { name: 'Italy', code: 'IT', image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400', description: 'Home to Renaissance art and Mediterranean cuisine' }
        ];

        for (const country of countries) {
            await pool.execute(
                'INSERT IGNORE INTO countries (name, code, image_url, description) VALUES (?, ?, ?, ?)',
                [country.name, country.code, country.image_url, country.description]
            );
        }

        // Get country IDs
        const [countryRows] = await pool.execute('SELECT id, name FROM countries');
        const countryMap = {};
        countryRows.forEach(row => {
            countryMap[row.name] = row.id;
        });

        // Insert sample places
        const places = [
            // India
            { name: 'Taj Mahal, Agra', country: 'India', image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400', description: 'Iconic white marble mausoleum', rating: 4.8, price_per_person: 15000, duration_days: 2 },
            { name: 'Jaipur City Palace', country: 'India', image_url: 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=400', description: 'Royal palace complex in Pink City', rating: 4.6, price_per_person: 12000, duration_days: 1 },
            { name: 'Goa Beaches', country: 'India', image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', description: 'Beautiful beaches and Portuguese architecture', rating: 4.7, price_per_person: 18000, duration_days: 3 },

            // France
            { name: 'Eiffel Tower, Paris', country: 'France', image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400', description: 'Iconic iron lattice tower', rating: 4.9, price_per_person: 25000, duration_days: 2 },
            { name: 'Louvre Museum', country: 'France', image_url: 'https://images.unsplash.com/photo-1566139956833-0c8b5aa8b5b8?w=400', description: 'World\'s largest art museum', rating: 4.8, price_per_person: 22000, duration_days: 1 },
            { name: 'Palace of Versailles', country: 'France', image_url: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400', description: 'Opulent royal residence', rating: 4.7, price_per_person: 20000, duration_days: 1 },

            // Japan
            { name: 'Mount Fuji', country: 'Japan', image_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', description: 'Sacred mountain and active volcano', rating: 4.9, price_per_person: 30000, duration_days: 3 },
            { name: 'Tokyo Skytree', country: 'Japan', image_url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400', description: 'Broadcasting and observation tower', rating: 4.6, price_per_person: 15000, duration_days: 1 },
            { name: 'Kyoto Temples', country: 'Japan', image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', description: 'Ancient temples and shrines', rating: 4.8, price_per_person: 25000, duration_days: 2 },

            // United States
            { name: 'Grand Canyon', country: 'United States', image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', description: 'Massive canyon carved by Colorado River', rating: 4.9, price_per_person: 35000, duration_days: 4 },
            { name: 'Statue of Liberty', country: 'United States', image_url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805b6b?w=400', description: 'Iconic symbol of freedom', rating: 4.7, price_per_person: 20000, duration_days: 1 },
            { name: 'Yellowstone National Park', country: 'United States', image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', description: 'First national park with geysers', rating: 4.8, price_per_person: 28000, duration_days: 3 },

            // Italy
            { name: 'Colosseum, Rome', country: 'Italy', image_url: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400', description: 'Ancient amphitheater in Rome', rating: 4.8, price_per_person: 22000, duration_days: 2 },
            { name: 'Venice Canals', country: 'Italy', image_url: 'https://images.unsplash.com/photo-1514890547357-aad4b983dff4?w=400', description: 'City of canals and gondolas', rating: 4.7, price_per_person: 25000, duration_days: 2 },
            { name: 'Florence Duomo', country: 'Italy', image_url: 'https://images.unsplash.com/photo-1543429171-c4e3e676f4f4?w=400', description: 'Magnificent cathedral in Florence', rating: 4.6, price_per_person: 18000, duration_days: 1 }
        ];

        for (const place of places) {
            const countryId = countryMap[place.country];
            if (countryId) {
                await pool.execute(
                    'INSERT IGNORE INTO places (name, country_id, image_url, description, rating, price_per_person, duration_days) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [place.name, countryId, place.image_url, place.description, place.rating, place.price_per_person, place.duration_days]
                );
            }
        }

        res.json({
            success: true,
            message: 'Sample data seeded successfully'
        });

    } catch (error) {
        console.error('Seed data error:', error);
        res.status(500).json({ success: false, error: 'Failed to seed data' });
    }
});

module.exports = router;
