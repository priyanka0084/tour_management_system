import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Render, secret files are at /etc/secrets/filename
// Locally, ca.pem sits next to db.js
const caPath = process.env.NODE_ENV === 'production'
  ? '/etc/secrets/ca.pem'
  : path.join(__dirname, 'ca.pem');

const sslConfig = process.env.DB_SSL === 'true' && fs.existsSync(caPath)
  ? { ca: fs.readFileSync(caPath) }
  : false;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Priy@2006',
    database: process.env.DB_NAME || 'tourismdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslConfig
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1); // crash so Render shows the error clearly
    }
};

testConnection();

export { pool };