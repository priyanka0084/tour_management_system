import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Helper function to safely parse JSON fields
const parseJSONField = (field) => {
    if (!field) return null;
    
    // If it's already an object/array, return it
    if (typeof field === 'object') return field;
    
    // Try to parse as JSON
    try {
        const parsed = JSON.parse(field);
        return parsed;
    } catch (error) {
        // If parsing fails, treat it as a single string and convert to array
        console.warn('Field is not valid JSON, converting to array:', field);
        return [field];
    }
};

// GET /api/packages/:placeId - Get packages for a specific place
router.get('/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;

        const query = `
            SELECT
        pkg.id,
        pkg.title,
        pkg.description,
        pkg.price,
        pkg.price_adult,
        pkg.price_child,
        pkg.price_infant,
        pkg.duration_days,
        pkg.services,
        pkg.places_included,
        pkg.itinerary,
        p.name as place_name,
        p.image_url as place_image,
        p.rating as place_rating,
        c.name as country_name
    FROM packages pkg
    JOIN places p ON pkg.place_id = p.id
    JOIN countries c ON p.country_id = c.id
    WHERE pkg.place_id = ?
    ORDER BY pkg.price ASC
        `;

        const [rows] = await pool.execute(query, [placeId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No packages found for this place' });
        }

        // Parse JSON fields for each package with error handling
        const packages = rows.map(pkg => {
            return {
                ...pkg,
                services: parseJSONField(pkg.services),
                places_included: parseJSONField(pkg.places_included),
                itinerary: parseJSONField(pkg.itinerary)
            };
        });

        res.json({
            success: true,
            packages: packages
        });

    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/packages/detail/:packageId - Get specific package details
router.get('/detail/:packageId', async (req, res) => {
    try {
        const { packageId } = req.params;

        const query = `
            SELECT
        pkg.id,
        pkg.title,
        pkg.description,
        pkg.price,
        pkg.price_adult,
        pkg.price_child,
        pkg.price_infant,
        pkg.duration_days,
        pkg.services,
        pkg.places_included,
        pkg.itinerary,
        p.name as place_name,
        p.image_url as place_image,
        p.rating as place_rating,
        p.description as place_description,
        c.name as country_name,
        c.code as country_code
    FROM packages pkg
    JOIN places p ON pkg.place_id = p.id
    JOIN countries c ON p.country_id = c.id
    WHERE pkg.id = ?
        `;

        const [rows] = await pool.execute(query, [packageId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Package not found' });
        }

        const packageData = {
            ...rows[0],
            services: parseJSONField(rows[0].services),
            places_included: parseJSONField(rows[0].places_included),
            itinerary: parseJSONField(rows[0].itinerary)
        };

        res.json({
            success: true,
            package: packageData
        });

    } catch (error) {
        console.error('Get package detail error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/packages/seed - Seed initial package data (for development)
router.post('/seed', async (req, res) => {
    try {
        // Get place IDs
        const [placeRows] = await pool.execute('SELECT id, name FROM places');
        const placeMap = {};
        placeRows.forEach(row => {
            placeMap[row.name] = row.id;
        });

        // Sample packages - using place IDs from user's database
        const packages = [
            {
                place_id: 1,
                title: 'Rome Highlights',
                description: 'Explore the Colosseum, Vatican, and more.',
                price: 50000,
                duration_days: 5,
                services: JSON.stringify(['Guided tours', 'Breakfast included']),
                places_included: JSON.stringify(['Colosseum', 'Vatican Museums']),
                itinerary: JSON.stringify(['Day 1: Colosseum', 'Day 2: Vatican', 'Day 3: City tour'])
            },
            {
                place_id: 2,
                title: 'Venice Romantic Getaway',
                description: 'Enjoy gondola rides and historic sites.',
                price: 45000,
                duration_days: 4,
                services: JSON.stringify(['Boat rides', 'Breakfast included']),
                places_included: JSON.stringify(['Grand Canal', 'St. Mark\'s Square']),
                itinerary: JSON.stringify(['Day 1: Canal tour', 'Day 2: Museums', 'Day 3: Leisure'])
            },
            {
                place_id: 3,
                title: 'Florence Art Tour',
                description: 'Discover Renaissance art and architecture.',
                price: 48000,
                duration_days: 4,
                services: JSON.stringify(['Museum entries', 'Breakfast included']),
                places_included: JSON.stringify(['Uffizi Gallery', 'Duomo']),
                itinerary: JSON.stringify(['Day 1: Uffizi', 'Day 2: Duomo', 'Day 3: City walk'])
            },
            {
                place_id: 4,
                title: 'Milan Fashion Experience',
                description: 'Explore fashion district and historic sites.',
                price: 52000,
                duration_days: 3,
                services: JSON.stringify(['Shopping guide', 'Breakfast included']),
                places_included: JSON.stringify(['Duomo', 'La Scala']),
                itinerary: JSON.stringify(['Day 1: Duomo', 'Day 2: La Scala', 'Day 3: Shopping'])
            },
            {
                place_id: 5,
                title: 'Paris City Tour',
                description: 'Visit Eiffel Tower, Louvre, and charming neighborhoods.',
                price: 60000,
                duration_days: 6,
                services: JSON.stringify(['Museum passes', 'Breakfast included']),
                places_included: JSON.stringify(['Eiffel Tower', 'Louvre', 'Montmartre']),
                itinerary: JSON.stringify(['Day 1: Eiffel Tower', 'Day 2: Louvre', 'Day 3: Montmartre'])
            },
            {
                place_id: 6,
                title: 'Nice Beach Holiday',
                description: 'Relax on beaches and explore old town.',
                price: 55000,
                duration_days: 5,
                services: JSON.stringify(['Beach access', 'Breakfast included']),
                places_included: JSON.stringify(['Promenade', 'Old Town']),
                itinerary: JSON.stringify(['Day 1: Beach', 'Day 2: Old Town', 'Day 3: Castle'])
            },
            {
                place_id: 7,
                title: 'Lyon Gastronomic Tour',
                description: 'Experience French cuisine and historic sites.',
                price: 53000,
                duration_days: 4,
                services: JSON.stringify(['Cooking class', 'Breakfast included']),
                places_included: JSON.stringify(['Vieux Lyon', 'Basilica']),
                itinerary: JSON.stringify(['Day 1: Vieux Lyon', 'Day 2: Basilica', 'Day 3: Cooking'])
            },
            {
                place_id: 8,
                title: 'Kyoto Cultural Experience',
                description: 'Discover temples, gardens, and traditional tea ceremonies.',
                price: 55000,
                duration_days: 5,
                services: JSON.stringify(['Tea ceremony', 'Guided tours']),
                places_included: JSON.stringify(['Kinkaku-ji', 'Fushimi Inari']),
                itinerary: JSON.stringify(['Day 1: Kinkaku-ji', 'Day 2: Fushimi Inari', 'Day 3: Tea ceremony'])
            },
            {
                place_id: 9,
                title: 'Tokyo Modern Adventure',
                description: 'Explore modern city and traditional temples.',
                price: 65000,
                duration_days: 7,
                services: JSON.stringify(['City tours', 'Breakfast included']),
                places_included: JSON.stringify(['Shibuya', 'Senso-ji']),
                itinerary: JSON.stringify(['Day 1: Shibuya', 'Day 2: Senso-ji', 'Day 3: Skytree'])
            },
            {
                place_id: 10,
                title: 'Osaka Food Tour',
                description: 'Enjoy street food and historic castles.',
                price: 48000,
                duration_days: 4,
                services: JSON.stringify(['Food tours', 'Breakfast included']),
                places_included: JSON.stringify(['Osaka Castle', 'Dotonbori']),
                itinerary: JSON.stringify(['Day 1: Castle', 'Day 2: Dotonbori', 'Day 3: Aquarium'])
            },
            {
                place_id: 11,
                title: 'Taj Mahal Tour',
                description: 'Explore the iconic Taj Mahal and historic Agra.',
                price: 30000,
                duration_days: 2,
                services: JSON.stringify(['Guided tours', 'Breakfast included']),
                places_included: JSON.stringify(['Taj Mahal', 'Agra Fort']),
                itinerary: JSON.stringify(['Day 1: Taj Mahal', 'Day 2: Agra Fort'])
            },
            {
                place_id: 12,
                title: 'Jaipur City Palace Tour',
                description: 'Discover the royal palace and Pink City architecture.',
                price: 24000,
                duration_days: 1,
                services: JSON.stringify(['Guided tours', 'Breakfast included']),
                places_included: JSON.stringify(['Jaipur City Palace', 'Amber Fort']),
                itinerary: JSON.stringify(['Day 1: City Palace and Amber Fort'])
            },
            {
                place_id: 13,
                title: 'Goa Beaches Tour',
                description: 'Relax on beautiful beaches and explore Portuguese heritage.',
                price: 36000,
                duration_days: 3,
                services: JSON.stringify(['Beach access', 'Breakfast included']),
                places_included: JSON.stringify(['Goa Beaches', 'Old Goa Churches']),
                itinerary: JSON.stringify(['Day 1: Beach relaxation', 'Day 2: Old Goa', 'Day 3: Leisure'])
            },
            {
                place_id: 14,
                title: 'Eiffel Tower Tour',
                description: 'Visit the iconic Eiffel Tower and Paris landmarks.',
                price: 50000,
                duration_days: 2,
                services: JSON.stringify(['Guided tours', 'Breakfast included']),
                places_included: JSON.stringify(['Eiffel Tower', 'Seine River']),
                itinerary: JSON.stringify(['Day 1: Eiffel Tower', 'Day 2: Seine cruise'])
            },
            {
                place_id: 15,
                title: 'Louvre Museum Tour',
                description: 'Explore the world\'s largest art museum.',
                price: 44000,
                duration_days: 1,
                services: JSON.stringify(['Museum entry', 'Breakfast included']),
                places_included: JSON.stringify(['Louvre Museum', 'Tuileries Garden']),
                itinerary: JSON.stringify(['Day 1: Louvre Museum'])
            }
        ];

        for (const pkg of packages) {
            await pool.execute(
                'INSERT IGNORE INTO packages (place_id, title, description, price, duration_days, services, places_included, itinerary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [pkg.place_id, pkg.title, pkg.description, pkg.price, pkg.duration_days, pkg.services, pkg.places_included, pkg.itinerary]
            );
        }

        res.json({
            success: true,
            message: 'Package data seeded successfully'
        });

    } catch (error) {
        console.error('Seed packages error:', error);
        res.status(500).json({ success: false, error: 'Failed to seed packages' });
    }
});
// GET /api/packages/pricing/:packageId - Get package pricing details only
router.get('/pricing/:packageId', async (req, res) => {
    try {
        const { packageId } = req.params;

        const query = `
            SELECT
                id,
                title,
                price,
                price_adult,
                price_child,
                price_infant,
                duration_days
            FROM packages
            WHERE id = ?
        `;

        const [rows] = await pool.execute(query, [packageId]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Package not found' 
            });
        }

        res.json({
            success: true,
            pricing: rows[0]
        });

    } catch (error) {
        console.error('Get package pricing error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});
export default router;