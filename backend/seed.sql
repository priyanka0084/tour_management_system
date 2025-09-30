USE tour_bookings;

-- Seed data for countries
INSERT INTO countries (name, code, image_url, description) VALUES
('Italy', 'IT', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400', 'Beautiful country with rich history and culture.'),
('France', 'FR', 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400', 'Famous for its cuisine, art, and landmarks.'),
('Japan', 'JP', 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', 'Land of the rising sun with unique traditions.');

-- Seed data for places
INSERT INTO places (name, country_id, image_url, description, rating, price_per_person, duration_days) VALUES
('Rome', 1, 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400', 'The Eternal City with ancient ruins and vibrant life.', 4.8, 15000, 5),
('Venice', 1, 'https://images.unsplash.com/photo-1514890547357-aad4b983dff4?w=400', 'City of canals and romantic gondola rides.', 4.7, 18000, 4),
('Florence', 1, 'https://images.unsplash.com/photo-1543429171-c4e3e676f4f4?w=400', 'Renaissance city famous for art and architecture.', 4.7, 16000, 4),
('Milan', 1, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', 'Fashion capital with stunning Duomo and shopping.', 4.6, 17000, 3),
('Paris', 2, 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=400', 'The city of lights and love.', 4.9, 20000, 6),
('Nice', 2, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', 'Beautiful coastal city with beaches and old town.', 4.5, 19000, 5),
('Lyon', 2, 'https://images.unsplash.com/photo-1566139956833-0c8b5aa8b5b8?w=400', 'Gastronomic capital with historic sites.', 4.4, 18000, 4),
('Kyoto', 3, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400', 'Historic city with beautiful temples and gardens.', 4.6, 17000, 5),
('Tokyo', 3, 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400', 'Modern metropolis with traditional temples.', 4.8, 22000, 7),
('Osaka', 3, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', 'Food capital with castles and vibrant nightlife.', 4.5, 19000, 4);

-- Seed data for packages
INSERT INTO packages (place_id, title, description, price, duration_days, services, places_included, itinerary) VALUES
(1, 'Rome Highlights', 'Explore the Colosseum, Vatican, and more.', 50000, 5, 'Guided tours, Breakfast included', 'Colosseum, Vatican Museums', 'Day 1: Colosseum; Day 2: Vatican; Day 3: City tour'),
(2, 'Venice Romantic Getaway', 'Enjoy gondola rides and historic sites.', 45000, 4, 'Boat rides, Breakfast included', 'Grand Canal, St. Mark\'s Square', 'Day 1: Canal tour; Day 2: Museums; Day 3: Leisure'),
(3, 'Florence Art Tour', 'Discover Renaissance art and architecture.', 48000, 4, 'Museum entries, Breakfast included', 'Uffizi Gallery, Duomo', 'Day 1: Uffizi; Day 2: Duomo; Day 3: City walk'),
(4, 'Milan Fashion Experience', 'Explore fashion district and historic sites.', 52000, 3, 'Shopping guide, Breakfast included', 'Duomo, La Scala', 'Day 1: Duomo; Day 2: La Scala; Day 3: Shopping'),
(5, 'Paris City Tour', 'Visit Eiffel Tower, Louvre, and charming neighborhoods.', 60000, 6, 'Museum passes, Breakfast included', 'Eiffel Tower, Louvre, Montmartre', 'Day 1: Eiffel Tower; Day 2: Louvre; Day 3: Montmartre'),
(6, 'Nice Beach Holiday', 'Relax on beaches and explore old town.', 55000, 5, 'Beach access, Breakfast included', 'Promenade, Old Town', 'Day 1: Beach; Day 2: Old Town; Day 3: Castle'),
(7, 'Lyon Gastronomic Tour', 'Experience French cuisine and historic sites.', 53000, 4, 'Cooking class, Breakfast included', 'Vieux Lyon, Basilica', 'Day 1: Vieux Lyon; Day 2: Basilica; Day 3: Cooking'),
(8, 'Kyoto Cultural Experience', 'Discover temples, gardens, and traditional tea ceremonies.', 55000, 5, 'Tea ceremony, Guided tours', 'Kinkaku-ji, Fushimi Inari', 'Day 1: Kinkaku-ji; Day 2: Fushimi Inari; Day 3: Tea ceremony'),
(9, 'Tokyo Modern Adventure', 'Explore modern city and traditional temples.', 65000, 7, 'City tours, Breakfast included', 'Shibuya, Senso-ji', 'Day 1: Shibuya; Day 2: Senso-ji; Day 3: Skytree'),
(10, 'Osaka Food Tour', 'Enjoy street food and historic castles.', 48000, 4, 'Food tours, Breakfast included', 'Osaka Castle, Dotonbori', 'Day 1: Castle; Day 2: Dotonbori; Day 3: Aquarium'),
((SELECT id FROM places WHERE name = 'Taj Mahal, Agra'), 'Taj Mahal Tour', 'Explore the iconic Taj Mahal and historic Agra.', 30000, 2, 'Guided tours, Breakfast included', 'Taj Mahal, Agra Fort', 'Day 1: Taj Mahal; Day 2: Agra Fort'),
((SELECT id FROM places WHERE name = 'Jaipur City Palace'), 'Jaipur City Palace Tour', 'Discover the royal palace and Pink City architecture.', 24000, 1, 'Guided tours, Breakfast included', 'Jaipur City Palace, Amber Fort', 'Day 1: City Palace and Amber Fort'),
((SELECT id FROM places WHERE name = 'Goa Beaches'), 'Goa Beaches Tour', 'Relax on beautiful beaches and explore Portuguese heritage.', 36000, 3, 'Beach access, Breakfast included', 'Goa Beaches, Old Goa Churches', 'Day 1: Beach relaxation; Day 2: Old Goa; Day 3: Leisure'),
((SELECT id FROM places WHERE name = 'Eiffel Tower, Paris'), 'Eiffel Tower Tour', 'Visit the iconic Eiffel Tower and Paris landmarks.', 50000, 2, 'Guided tours, Breakfast included', 'Eiffel Tower, Seine River', 'Day 1: Eiffel Tower; Day 2: Seine cruise'),
((SELECT id FROM places WHERE name = 'Louvre Museum'), 'Louvre Museum Tour', 'Explore the world\'s largest art museum.', 44000, 1, 'Museum entry, Breakfast included', 'Louvre Museum, Tuileries Garden', 'Day 1: Louvre Museum');

-- You can add more seed data as needed
