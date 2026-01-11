// const mysql = require("mysql2/promise");

// // The configuration now reads from environment variables
// const dbConfig = {
//   host: process.env.DB_HOST || "mysql",
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// const pool = mysql.createPool(dbConfig);
// // Test the connection on startup
// pool
//   .getConnection()
//   .then((connection) => {
//     console.log("✅ Database connected");
//     connection.release();
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err.message);
//     // process.exit(1); // Exit the process if the connection fails
//   });

// // Export the pool
// module.exports = pool;

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql", // MySQL service name
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10_000, // 10 seconds
});

// 🔍 Optional startup check (SAFE)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    // ❌ Do NOT exit process in Dokploy
  }
})();

module.exports = pool;
