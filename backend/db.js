import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Priy@2006',
    database: process.env.DB_NAME || 'tourismdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

// Initialize database and create tables if not exists
const initializeDatabase = async () => {
    try {
        // Create countries table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS countries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                code VARCHAR(10) NOT NULL UNIQUE,
                image_url VARCHAR(500),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create places table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS places (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                country_id INT NOT NULL,
                image_url VARCHAR(500),
                description TEXT,
                rating DECIMAL(3,2) DEFAULT 0.00,
                price_per_person DECIMAL(10,2),
                duration_days INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
            )
        `);

        // Create packages table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                place_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_days INT NOT NULL,
                services TEXT,
                places_included TEXT,
                itinerary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
            )
        `);

        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create bookings table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                tour_destination VARCHAR(100) NOT NULL,
                tour_date DATE NOT NULL,
                special_requests TEXT,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_tour_date (tour_date)
            )
        `);

        // Add payment columns to bookings
        // MySQL does not support ADD COLUMN IF NOT EXISTS, so we check columns existence before altering
        const [columns] = await pool.query("SHOW COLUMNS FROM bookings");
        const columnNames = columns.map(col => col.Field);

        if (!columnNames.includes('payment_status')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'");
        }
        if (!columnNames.includes('payment_method')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50)");
        }
        if (!columnNames.includes('transaction_id')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(100)");
        }
        if (!columnNames.includes('amount')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN amount DECIMAL(10,2)");
        }

        // Update bookings table to include adults, children, infants, departure columns
        // Check columns existence before altering
        if (!columnNames.includes('adults')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN adults INT DEFAULT 0");
        }
        if (!columnNames.includes('children')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN children INT DEFAULT 0");
        }
        if (!columnNames.includes('infants')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN infants INT DEFAULT 0");
        }
        if (!columnNames.includes('departure')) {
            await pool.execute("ALTER TABLE bookings ADD COLUMN departure VARCHAR(100)");
        }

        // Drop number_of_people column if exists
        if (columnNames.includes('number_of_people')) {
            await pool.execute("ALTER TABLE bookings DROP COLUMN number_of_people");
        }

        // Create team table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS team (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                role VARCHAR(120) NOT NULL,
                bio VARCHAR(500) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Insert team data
        await pool.execute(`
            INSERT IGNORE INTO team (name, role, bio) VALUES
            ('Ava Patel', 'CEO & Co‑Founder', 'Travel enthusiast leading strategy and partnerships.'),
            ('Liam Chen', 'CTO & Co‑Founder', 'Engineer focused on scalable, reliable travel tech.'),
            ('Sofia Martinez', 'Head of Operations', 'Ensures seamless traveler experiences worldwide.'),
            ('Noah Williams', 'Customer Success Lead', 'Championing traveler happiness 24/7.')
        `);

        // Create achievements table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Insert achievements data
        await pool.execute(`
            INSERT IGNORE INTO achievements (title) VALUES
            ('10,000+ travelers served'),
            ('Best Travel Startup 2024'),
            ('Partnered with 200+ local guides'),
            ('4.9/5 average customer rating')
        `);

        // Create billing_details table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS billing_details (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                company_name VARCHAR(150),
                country VARCHAR(100) DEFAULT 'India',
                street_address VARCHAR(255) NOT NULL,
                apartment VARCHAR(255),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) DEFAULT 'Tamil Nadu',
                pin_code VARCHAR(20) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL,
                order_notes TEXT,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);

        // Create passengers table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS passengers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                dob DATE NOT NULL,
                gender ENUM('Male','Female','Other') NOT NULL,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

// Call initialization
testConnection();
initializeDatabase();
export {pool};
