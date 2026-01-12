// generate-admin-simple.js
const bcrypt = require("bcrypt");
// const express = require("express");
const mysql = require("mysql2/promise");

async function generateAdmin(username = "root", password = "root123@") {
  console.log(`Creating admin: ${username}`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "mysql", // MySQL service name
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  await connection.execute(
    `
    INSERT INTO Users (username, password, role) 
    VALUES (?, ?, 'Admin')
    ON DUPLICATE KEY UPDATE 
    password = VALUES(password)
  `,
    [username, hashedPassword]
  );

  console.log("✅ Done!");
  await connection.end();
}

// Get username and password from command line or use defaults
const args = process.argv.slice(2);
generateAdmin(args[0], args[1]);
