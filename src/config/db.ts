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
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool with better error handling
const pool = mysql.createPool(dbConfig);

// Handle pool errors
pool.on('connection', (error: any) => {
  if (error && error.code === 'PROTOCOL_CONNECTION_LOST') {
    // Connection was closed, will attempt to reconnect automatically
  }
});

// Test database connection with retry logic
export async function testConnection(maxRetries = 3, retryDelay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      return true;
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        return false;
      }
    }
  }
  return false;
}

// Health check function
export async function healthCheck(): Promise<{ connected: boolean; message: string }> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true, message: 'Database connection healthy' };
  } catch (error) {
    return { 
      connected: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export default pool;