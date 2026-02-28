-- Database Optimization: Add Indexes and Performance Improvements
-- Migration 003: Performance and Security Enhancements

-- Add indexes for better query performance
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_is_promoted ON events(is_promoted);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);

CREATE INDEX idx_event_translations_event_id ON event_translations(event_id);
CREATE INDEX idx_event_translations_language ON event_translations(language);
CREATE INDEX idx_event_translations_event_lang ON event_translations(event_id, language);

CREATE INDEX idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX idx_event_occurrences_start_datetime ON event_occurrences(start_datetime);

CREATE INDEX idx_event_communities_event_id ON event_communities(event_id);
CREATE INDEX idx_event_communities_community_id ON event_communities(community_id);

CREATE INDEX idx_event_categories_event_id ON event_categories(event_id);
CREATE INDEX idx_event_categories_category_id ON event_categories(category_id);

CREATE INDEX idx_event_artists_event_id ON event_artists(event_id);
CREATE INDEX idx_event_artists_artist_id ON event_artists(artist_id);

CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_is_active ON communities(is_active);

CREATE INDEX idx_categories_slug ON categories(slug);

CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_spotify_id ON artists(spotify_id);

-- Add users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'organizer') DEFAULT 'user',
    avatar_path VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Add user favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id)
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_event_id ON user_favorites(event_id);

-- Add analytics tables
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NULL,
    url VARCHAR(500) NOT NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    properties JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

-- Add performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    load_time INT NOT NULL,
    dom_content_loaded INT NOT NULL,
    first_paint INT NULL,
    first_contentful_paint INT NULL,
    largest_contentful_paint INT NULL,
    first_input_delay INT NULL,
    cumulative_layout_shift DECIMAL(5,3) NULL,
    user_agent TEXT NULL,
    viewport_size VARCHAR(20) NULL,
    connection_type VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_url ON performance_metrics(url);
CREATE INDEX idx_performance_created ON performance_metrics(created_at);

-- Add push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_is_active ON push_subscriptions(is_active);

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id VARCHAR(100) PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    requests_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_address);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX idx_rate_limits_expires ON rate_limits(expires_at);

-- Add sessions table for better session management
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload LONGTEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- Add audit log table for security
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Add email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, body_text, variables) VALUES
('welcome', 'Willkommen bei Omekan!', 
 '<h1>Willkommen {{name}}!</h1><p>Vielen Dank für deine Registrierung bei Omekan.</p>', 
 'Willkommen {{name}}! Vielen Dank für deine Registrierung bei Omekan.',
 '["name", "email"]'),
('event_reminder', 'Event Erinnerung: {{event_title}}',
 '<h1>{{event_title}}</h1><p>Dein Event startet bald: {{event_date}} um {{event_time}}</p>',
 '{{event_title}} - Dein Event startet bald: {{event_date}} um {{event_time}}',
 '["event_title", "event_date", "event_time", "location"]'),
('password_reset', 'Passwort zurücksetzen',
 '<h1>Passwort zurücksetzen</h1><p>Klicke <a href="{{reset_url}}">hier</a> um dein Passwort zurückzusetzen.</p>',
 'Passwort zurücksetzen: {{reset_url}}',
 '["reset_url", "name"]');

-- Add notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add event views tracking
CREATE TABLE IF NOT EXISTS event_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referrer VARCHAR(500) NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_event_views_event_id ON event_views(event_id);
CREATE INDEX idx_event_views_user_id ON event_views(user_id);
CREATE INDEX idx_event_views_viewed_at ON event_views(viewed_at);

-- Add cache table for application caching
CREATE TABLE IF NOT EXISTS cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value LONGTEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Add configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_configurations_key ON configurations(config_key);
CREATE INDEX idx_configurations_is_public ON configurations(is_public);

-- Insert default configurations
INSERT INTO configurations (config_key, config_value, config_type, description, is_public) VALUES
('site_name', 'Omekan Event Platform', 'string', 'Site name displayed in frontend', TRUE),
('site_description', 'Entdecke Events in deiner Community', 'string', 'Site description for SEO', TRUE),
('events_per_page', '12', 'integer', 'Number of events per page', TRUE),
('max_upload_size', '10485760', 'integer', 'Maximum file upload size in bytes', FALSE),
('enable_registration', 'true', 'boolean', 'Allow new user registrations', TRUE),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
('analytics_enabled', 'true', 'boolean', 'Enable analytics tracking', FALSE),
('push_notifications_enabled', 'true', 'boolean', 'Enable push notifications', TRUE);

-- Create admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@omekan.com', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyT4XyUnHcm6tyGktK8caa', 'admin');

-- Add some sample data for testing
INSERT INTO communities (name, slug, flag_emoji, is_active) VALUES
('International', 'international', '🌍', TRUE),
('Local', 'local', '🏠', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO categories (name, slug) VALUES
('Workshop', 'workshop'),
('Networking', 'networking'),
('Conference', 'conference')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Cleanup old data (optional)
-- DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
-- DELETE FROM performance_metrics WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
-- DELETE FROM rate_limits WHERE expires_at < NOW();
-- DELETE FROM sessions WHERE last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Optimize tables
OPTIMIZE TABLE events;
OPTIMIZE TABLE event_translations;
OPTIMIZE TABLE event_occurrences;
OPTIMIZE TABLE communities;
OPTIMIZE TABLE categories;
OPTIMIZE TABLE artists;
