-- ========================================
-- RECOMMENDATIONS FEATURE - DATABASE SCHEMA
-- ExploreEase Travel Booking Platform
-- ========================================

USE tour_bookings;

-- ========================================
-- 1. UPDATE USERS TABLE (Add personality fields)
-- ========================================

-- Add personality_profile column to existing users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personality_profile JSON NULL COMMENT 'Stores user personality preferences';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personality_tags VARCHAR(255) NULL COMMENT 'Comma-separated personality tags';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_recommendation_update TIMESTAMP NULL COMMENT 'Last time recommendations were generated';


-- ========================================
-- 2. TAGS TABLE (Personality & Place Tags)
-- ========================================

CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    tag_type ENUM('personality', 'activity', 'vibe', 'location') DEFAULT 'personality',
    icon VARCHAR(100) NULL COMMENT 'Emoji or icon class',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tag_type (tag_type),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tags for personality types and place characteristics';


-- ========================================
-- 3. PLACE_TAGS TABLE (Junction Table)
-- ========================================

CREATE TABLE IF NOT EXISTS place_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id INT NOT NULL,
    tag_id INT NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Tag relevance weight (0.00 to 1.00)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_place_tag (place_id, tag_id),
    INDEX idx_place (place_id),
    INDEX idx_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Links places with multiple tags';


-- ========================================
-- 4. OFFERS TABLE (Discounts & Promotions)
-- ========================================

CREATE TABLE IF NOT EXISTS offers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    discount_percent INT GENERATED ALWAYS AS (
        ROUND(((old_price - new_price) / old_price) * 100)
    ) STORED COMMENT 'Auto-calculated discount percentage',
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    spots_left INT DEFAULT 10 COMMENT 'Limited availability count',
    is_active BOOLEAN DEFAULT TRUE,
    terms_conditions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    INDEX idx_place (place_id),
    INDEX idx_active_valid (is_active, valid_until),
    INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Special offers and discount packages';


-- ========================================
-- 5. PLACE_STATS TABLE (Views, Likes, Trending)
-- ========================================

CREATE TABLE IF NOT EXISTS place_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id INT NOT NULL UNIQUE,
    total_views INT DEFAULT 0,
    views_last_7_days INT DEFAULT 0,
    views_last_30_days INT DEFAULT 0,
    total_likes INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    trending_score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Calculated trending score',
    last_viewed_at TIMESTAMP NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    INDEX idx_trending (trending_score DESC),
    INDEX idx_views_7days (views_last_7_days DESC),
    INDEX idx_total_likes (total_likes DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Aggregated statistics for each place';


-- ========================================
-- 6. VIEWS TABLE (Detailed View Tracking)
-- ========================================

CREATE TABLE IF NOT EXISTS views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id INT NOT NULL,
    user_id INT NULL COMMENT 'NULL for anonymous users',
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    session_id VARCHAR(100) NULL COMMENT 'Track unique sessions',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_place_date (place_id, view_date),
    INDEX idx_user_views (user_id, view_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Daily view tracking per place';


-- ========================================
-- 7. LIKES TABLE (User Preferences)
-- ========================================

CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_place (user_id, place_id),
    INDEX idx_user (user_id),
    INDEX idx_place (place_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User likes for places';


-- ========================================
-- 8. USER_PREFERENCES TABLE (Detailed Preferences)
-- ========================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    selected_tags JSON NULL COMMENT 'Array of selected personality tag IDs',
    budget_range VARCHAR(50) NULL COMMENT 'e.g., low, medium, high',
    preferred_duration VARCHAR(50) NULL COMMENT 'e.g., weekend, week, month',
    travel_style VARCHAR(100) NULL COMMENT 'e.g., solo, couple, family, group',
    interests JSON NULL COMMENT 'Additional interests array',
    quiz_completed BOOLEAN DEFAULT FALSE,
    quiz_results JSON NULL COMMENT 'Full quiz answers and results',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Detailed user travel preferences';


-- ========================================
-- 9. RECOMMENDATION_LOGS TABLE (Analytics)
-- ========================================

CREATE TABLE IF NOT EXISTS recommendation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    input_profile JSON NULL COMMENT 'Snapshot of user preferences used',
    selected_tags JSON NULL COMMENT 'Tags used for this recommendation',
    algorithm_version VARCHAR(20) DEFAULT 'v1.0',
    recommended_places JSON NULL COMMENT 'Array of recommended place IDs with scores',
    total_results INT DEFAULT 0,
    execution_time_ms INT NULL COMMENT 'Algorithm execution time',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Logs all recommendation requests for analytics';


-- ========================================
-- 10. INSERT SEED DATA FOR TAGS
-- ========================================

INSERT INTO tags (name, display_name, tag_type, icon, description) VALUES
-- Personality Tags
('introvert', 'Introvert', 'personality', '🌙', 'Perfect for quiet, peaceful experiences'),
('extrovert', 'Extrovert', 'personality', '🎉', 'Great for social, lively environments'),
('adventurous', 'Adventure Seeker', 'personality', '🏔️', 'For thrill-seekers and explorers'),
('peace', 'Peace Seeker', 'personality', '🧘', 'Calm, serene, relaxing destinations'),
('family', 'Family Friendly', 'personality', '👨‍👩‍👧‍👦', 'Perfect for family vacations'),
('friends', 'Friends Trip', 'personality', '🤝', 'Ideal for group travel with friends'),
('romantic', 'Romantic', 'personality', '💑', 'Perfect for couples and romantic getaways'),
('solo', 'Solo Traveler', 'personality', '🎒', 'Great for independent exploration'),

-- Activity Tags
('beach', 'Beach', 'activity', '🏖️', 'Beach destinations and water activities'),
('mountain', 'Mountain', 'activity', '⛰️', 'Mountain destinations and hiking'),
('city', 'City Life', 'activity', '🏙️', 'Urban exploration and city tours'),
('nature', 'Nature', 'activity', '🌳', 'Natural landscapes and wildlife'),
('culture', 'Cultural', 'activity', '🏛️', 'Historical sites and cultural experiences'),
('food', 'Food & Dining', 'activity', '🍽️', 'Culinary experiences and local cuisine'),
('adventure', 'Adventure Sports', 'activity', '🪂', 'Extreme sports and adventure activities'),
('wellness', 'Wellness & Spa', 'activity', '💆', 'Relaxation and wellness retreats'),
('shopping', 'Shopping', 'activity', '🛍️', 'Shopping destinations and markets'),
('nightlife', 'Nightlife', 'activity', '🌃', 'Bars, clubs, and night entertainment'),
('photography', 'Photography', 'activity', '📸', 'Scenic spots for photography'),

-- Vibe Tags
('luxury', 'Luxury', 'vibe', '💎', 'High-end, premium experiences'),
('budget', 'Budget Friendly', 'vibe', '💰', 'Affordable travel options'),
('offbeat', 'Off the Beaten Path', 'vibe', '🗺️', 'Unique, lesser-known destinations'),
('popular', 'Trending', 'vibe', '🔥', 'Popular and trending destinations'),
('secluded', 'Secluded', 'vibe', '🏝️', 'Remote and peaceful locations'),
('historical', 'Historical', 'vibe', '🏰', 'Rich history and heritage'),
('modern', 'Modern', 'vibe', '🌆', 'Contemporary and modern experiences'),

-- Location Tags
('tropical', 'Tropical', 'location', '🌴', 'Tropical climate destinations'),
('desert', 'Desert', 'location', '🏜️', 'Desert landscapes and experiences'),
('coastal', 'Coastal', 'location', '🌊', 'Coastal and seaside locations'),
('island', 'Island', 'location', '🏝️', 'Island destinations'),
('countryside', 'Countryside', 'location', '🌾', 'Rural and countryside settings')

ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    icon = VALUES(icon),
    description = VALUES(description);


-- ========================================
-- 11. INITIALIZE PLACE_STATS FOR EXISTING PLACES
-- ========================================

INSERT INTO place_stats (place_id, total_views, views_last_7_days, views_last_30_days, total_likes, trending_score)
SELECT 
    id as place_id,
    0 as total_views,
    0 as views_last_7_days,
    0 as views_last_30_days,
    0 as total_likes,
    0.00 as trending_score
FROM places
WHERE id NOT IN (SELECT place_id FROM place_stats);


-- ========================================
-- 12. CREATE STORED PROCEDURE FOR TRENDING SCORE CALCULATION
-- ========================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS UpdateTrendingScores()
BEGIN
    UPDATE place_stats ps
    SET 
        trending_score = (
            (ps.views_last_7_days * 0.40) +
            (ps.views_last_30_days * 0.20) +
            (ps.total_likes * 0.30) +
            (ps.total_bookings * 0.10)
        ) / 10;
END$$

DELIMITER ;


-- ========================================
-- 13. CREATE VIEWS FOR EASY QUERYING
-- ========================================

-- View: Popular places with stats
CREATE OR REPLACE VIEW v_popular_places AS
SELECT 
    p.id,
    p.name,
    p.image_url,
    p.rating,
    p.price_per_person,
    p.duration_days,
    c.name as country_name,
    ps.total_views,
    ps.total_likes,
    ps.trending_score,
    ps.views_last_7_days
FROM places p
JOIN countries c ON p.country_id = c.id
LEFT JOIN place_stats ps ON p.id = ps.place_id
ORDER BY ps.trending_score DESC;


-- View: Active offers with place details
CREATE OR REPLACE VIEW v_active_offers AS
SELECT 
    o.id,
    o.title,
    o.old_price,
    o.new_price,
    o.discount_percent,
    o.valid_until,
    o.spots_left,
    p.name as place_name,
    p.image_url,
    p.rating,
    c.name as country_name,
    DATEDIFF(o.valid_until, NOW()) as days_remaining
FROM offers o
JOIN places p ON o.place_id = p.id
JOIN countries c ON p.country_id = c.id
WHERE o.is_active = TRUE 
  AND o.valid_until > NOW()
ORDER BY o.discount_percent DESC;


-- ========================================
-- SUCCESS MESSAGE
-- ========================================

SELECT '✅ Recommendations tables created successfully!' as Status;
SELECT COUNT(*) as 'Total Tags Created' FROM tags;