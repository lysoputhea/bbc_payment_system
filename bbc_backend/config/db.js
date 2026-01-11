const mysql = require("mysql2/promise");

// The configuration now reads from environment variables
const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);
// Test the connection on startup
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Database connected");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    // process.exit(1); // Exit the process if the connection fails
  })
  .finally(() => {
    // Optional: You can log that the connection test is complete
    process.exit();
  });

// Export the pool
module.exports = pool;
