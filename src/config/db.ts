import mysql from 'mysql2/promise';

// Database configuration for XAMPP / MySQL / MariaDB
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nailglamhub_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully to nailglamhub_db');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please ensure MySQL is started in your XAMPP Control Panel and database.sql is imported into phpMyAdmin.');
    return false;
  }
}

export default pool;