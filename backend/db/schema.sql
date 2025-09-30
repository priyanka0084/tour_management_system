-- Schema for Recommendations feature in ExploreEase
-- Database: tour_booking

-- Users table for storing user profiles and personality data
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    personality_profile JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Tags table for personality traits and place characteristics
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Junction table for places and tags
CREATE TABLE IF NOT EXISTS place_tags (
    place_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (place_id, tag_id),
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Views table for tracking place popularity
CREATE TABLE IF NOT EXISTS views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    place_id INT NOT NULL,
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    INDEX idx_place_date (place_id, view_date)
);

-- Likes table for user preferences
CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    place_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_place (user_id, place_id)
);

-- Recommendation logs for analytics
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    input_profile JSON NULL,
    algorithm_version VARCHAR(20) DEFAULT 'v1.0',
    recommended_places JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at)
);

-- Add indexes for performance
CREATE INDEX idx_place_tags_tag ON place_tags(tag_id);
CREATE INDEX idx_views_place ON views(place_id);
CREATE INDEX idx_likes_place ON likes(place_id);
