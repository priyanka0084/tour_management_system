-- Seed data for Recommendations feature
USE tour_booking;

-- Insert personality and place tags
INSERT IGNORE INTO tags (name) VALUES
('introvert'), ('extrovert'), ('adventurous'), ('peace'), ('nature'), ('secluded'),
('wellness'), ('mountain'), ('beach'), ('city'), ('nightlife'), ('festivals'),
('food'), ('adventure'), ('trekking'), ('water-sports'), ('safari'), ('spa'),
('meditation'), ('forest'), ('culture'), ('historical'), ('romantic'), ('family'),
('luxury'), ('budget'), ('trending');

-- Insert additional places for recommendations (extending existing places)
INSERT IGNORE INTO places (name, country_id, image_url, description, rating, price_per_person, duration_days) VALUES
('Bali, Indonesia', (SELECT id FROM countries WHERE code = 'ID' LIMIT 1),
 'https://source.unsplash.com/featured/?bali,beach', 'Tropical paradise with beaches, temples, and wellness retreats.', 4.7, 25000, 7),
('Swiss Alps, Switzerland', (SELECT id FROM countries WHERE code = 'CH' LIMIT 1),
 'https://source.unsplash.com/featured/?swiss,alps', 'Majestic mountains, pristine lakes, and adventure activities.', 4.8, 35000, 5),
('Santorini, Greece', (SELECT id FROM countries WHERE code = 'GR' LIMIT 1),
 'Stunning sunsets, white-washed buildings, and romantic atmosphere.', 4.9, 28000, 4),
('Machu Picchu, Peru', (SELECT id FROM countries WHERE code = 'PE' LIMIT 1),
 'Ancient Incan citadel surrounded by breathtaking mountains.', 4.6, 30000, 3),
('Iceland Northern Lights', (SELECT id FROM countries WHERE code = 'IS' LIMIT 1),
 'Experience the Aurora Borealis and geothermal wonders.', 4.5, 40000, 6),
('Morocco Sahara Desert', (SELECT id FROM countries WHERE code = 'MA' LIMIT 1),
 'Camel treks, Berber camps, and desert adventures.', 4.4, 22000, 5),
('New York City, USA', (SELECT id FROM countries WHERE code = 'US' LIMIT 1),
 'The city that never sleeps with endless entertainment.', 4.7, 32000, 5),
('Amazon Rainforest, Brazil', (SELECT id FROM countries WHERE code = 'BR' LIMIT 1),
 'Explore the world\'s largest rainforest and wildlife.', 4.3, 27000, 7);

-- Insert place_tags relationships
INSERT IGNORE INTO place_tags (place_id, tag_id) VALUES
-- Rome (existing place)
((SELECT id FROM places WHERE name = 'Rome'), (SELECT id FROM tags WHERE name = 'culture')),
((SELECT id FROM places WHERE name = 'Rome'), (SELECT id FROM tags WHERE name = 'historical')),
((SELECT id FROM places WHERE name = 'Rome'), (SELECT id FROM tags WHERE name = 'city')),
((SELECT id FROM places WHERE name = 'Rome'), (SELECT id FROM tags WHERE name = 'food')),

-- Venice
((SELECT id FROM places WHERE name = 'Venice'), (SELECT id FROM tags WHERE name = 'romantic')),
((SELECT id FROM places WHERE name = 'Venice'), (SELECT id FROM tags WHERE name = 'culture')),
((SELECT id FROM places WHERE name = 'Venice'), (SELECT id FROM tags WHERE name = 'historical')),

-- Paris
((SELECT id FROM places WHERE name = 'Paris'), (SELECT id FROM tags WHERE name = 'romantic')),
((SELECT id FROM places WHERE name = 'Paris'), (SELECT id FROM tags WHERE name = 'culture')),
((SELECT id FROM places WHERE name = 'Paris'), (SELECT id FROM tags WHERE name = 'city')),
((SELECT id FROM places WHERE name = 'Paris'), (SELECT id FROM tags WHERE name = 'food')),

-- Kyoto
((SELECT id FROM places WHERE name = 'Kyoto'), (SELECT id FROM tags WHERE name = 'culture')),
((SELECT id FROM places WHERE name = 'Kyoto'), (SELECT id FROM tags WHERE name = 'peace')),
((SELECT id FROM places WHERE name = 'Kyoto'), (SELECT id FROM tags WHERE name = 'wellness')),
((SELECT id FROM places WHERE name = 'Kyoto'), (SELECT id FROM tags WHERE name = 'nature')),

-- Bali
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), (SELECT id FROM tags WHERE name = 'beach')),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), (SELECT id FROM tags WHERE name = 'wellness')),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), (SELECT id FROM tags WHERE name = 'peace')),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), (SELECT id FROM tags WHERE name = 'nature')),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), (SELECT id FROM tags WHERE name = 'spa')),

-- Swiss Alps
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), (SELECT id FROM tags WHERE name = 'mountain')),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), (SELECT id FROM tags WHERE name = 'nature')),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), (SELECT id FROM tags WHERE name = 'adventurous')),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), (SELECT id FROM tags WHERE name = 'secluded')),

-- Santorini
((SELECT id FROM places WHERE name = 'Santorini, Greece'), (SELECT id FROM tags WHERE name = 'romantic')),
((SELECT id FROM places WHERE name = 'Santorini, Greece'), (SELECT id FROM tags WHERE name = 'beach')),
((SELECT id FROM places WHERE name = 'Santorini, Greece'), (SELECT id FROM tags WHERE name = 'luxury')),

-- Machu Picchu
((SELECT id FROM places WHERE name = 'Machu Picchu, Peru'), (SELECT id FROM tags WHERE name = 'adventurous')),
((SELECT id FROM places WHERE name = 'Machu Picchu, Peru'), (SELECT id FROM tags WHERE name = 'trekking')),
((SELECT id FROM places WHERE name = 'Machu Picchu, Peru'), (SELECT id FROM tags WHERE name = 'mountain')),
((SELECT id FROM places WHERE name = 'Machu Picchu, Peru'), (SELECT id FROM tags WHERE name = 'historical')),

-- Iceland
((SELECT id FROM places WHERE name = 'Iceland Northern Lights'), (SELECT id FROM tags WHERE name = 'nature')),
((SELECT id FROM places WHERE name = 'Iceland Northern Lights'), (SELECT id FROM tags WHERE name = 'adventurous')),
((SELECT id FROM places WHERE name = 'Iceland Northern Lights'), (SELECT id FROM tags WHERE name = 'secluded')),

-- Morocco
((SELECT id FROM places WHERE name = 'Morocco Sahara Desert'), (SELECT id FROM tags WHERE name = 'adventurous')),
((SELECT id FROM places WHERE name = 'Morocco Sahara Desert'), (SELECT id FROM tags WHERE name = 'culture')),
((SELECT id FROM places WHERE name = 'Morocco Sahara Desert'), (SELECT id FROM tags WHERE name = 'secluded')),

-- New York City
((SELECT id FROM places WHERE name = 'New York City, USA'), (SELECT id FROM tags WHERE name = 'city')),
((SELECT id FROM places WHERE name = 'New York City, USA'), (SELECT id FROM tags WHERE name = 'extrovert')),
((SELECT id FROM places WHERE name = 'New York City, USA'), (SELECT id FROM tags WHERE name = 'nightlife')),
((SELECT id FROM places WHERE name = 'New York City, USA'), (SELECT id FROM tags WHERE name = 'food')),

-- Amazon
((SELECT id FROM places WHERE name = 'Amazon Rainforest, Brazil'), (SELECT id FROM tags WHERE name = 'nature')),
((SELECT id FROM places WHERE name = 'Amazon Rainforest, Brazil'), (SELECT id FROM tags WHERE name = 'adventurous')),
((SELECT id FROM places WHERE name = 'Amazon Rainforest, Brazil'), (SELECT id FROM tags WHERE name = 'secluded'));

-- Insert sample users
INSERT IGNORE INTO users (name, email, password_hash, personality_profile) VALUES
('John Doe', 'john@example.com', '$2b$10$dummy.hash.for.demo', '{"personality": "adventurous", "preferences": ["mountain", "adventure"]}'),
('Jane Smith', 'jane@example.com', '$2b$10$dummy.hash.for.demo', '{"personality": "peace", "preferences": ["beach", "wellness"]}'),
('Mike Johnson', 'mike@example.com', '$2b$10$dummy.hash.for.demo', '{"personality": "extrovert", "preferences": ["city", "nightlife"]}');

-- Insert sample views data (last 60 days with varying counts)
INSERT IGNORE INTO views (place_id, view_date, view_count) VALUES
-- Rome: high views
((SELECT id FROM places WHERE name = 'Rome'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 45),
((SELECT id FROM places WHERE name = 'Rome'), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 38),
((SELECT id FROM places WHERE name = 'Rome'), DATE_SUB(CURDATE(), INTERVAL 14 DAY), 52),
((SELECT id FROM places WHERE name = 'Rome'), DATE_SUB(CURDATE(), INTERVAL 30 DAY), 67),

-- Paris: very high views
((SELECT id FROM places WHERE name = 'Paris'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 78),
((SELECT id FROM places WHERE name = 'Paris'), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 89),
((SELECT id FROM places WHERE name = 'Paris'), DATE_SUB(CURDATE(), INTERVAL 14 DAY), 95),
((SELECT id FROM places WHERE name = 'Paris'), DATE_SUB(CURDATE(), INTERVAL 30 DAY), 112),

-- Bali: trending up
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 23),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 18),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), DATE_SUB(CURDATE(), INTERVAL 14 DAY), 15),
((SELECT id FROM places WHERE name = 'Bali, Indonesia'), DATE_SUB(CURDATE(), INTERVAL 30 DAY), 12),

-- Swiss Alps: steady
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 31),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 29),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), DATE_SUB(CURDATE(), INTERVAL 14 DAY), 33),
((SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland'), DATE_SUB(CURDATE(), INTERVAL 30 DAY), 28);

-- Insert sample likes
INSERT IGNORE INTO likes (user_id, place_id) VALUES
((SELECT id FROM users WHERE email = 'john@example.com'), (SELECT id FROM places WHERE name = 'Swiss Alps, Switzerland')),
((SELECT id FROM users WHERE email = 'john@example.com'), (SELECT id FROM places WHERE name = 'Machu Picchu, Peru')),
((SELECT id FROM users WHERE email = 'jane@example.com'), (SELECT id FROM places WHERE name = 'Bali, Indonesia')),
((SELECT id FROM users WHERE email = 'jane@example.com'), (SELECT id FROM places WHERE name = 'Kyoto')),
((SELECT id FROM users WHERE email = 'mike@example.com'), (SELECT id FROM places WHERE name = 'New York City, USA')),
((SELECT id FROM users WHERE email = 'mike@example.com'), (SELECT id FROM places WHERE name = 'Paris'));

-- Insert sample recommendation logs
INSERT IGNORE INTO recommendation_logs (user_id, input_profile, algorithm_version, recommended_places) VALUES
(NULL, '{"personality": "adventurous"}', 'v1.0', '["Swiss Alps, Switzerland", "Machu Picchu, Peru", "Amazon Rainforest, Brazil"]'),
(NULL, '{"personality": "peace"}', 'v1.0', '["Bali, Indonesia", "Kyoto", "Santorini, Greece"]'),
(NULL, '{"personality": "extrovert"}', 'v1.0', '["New York City, USA", "Paris", "Rome"]');
