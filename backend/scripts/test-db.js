require("dotenv").config();

const pool = require("../config/db");

async function testDatabase() {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    console.log("Neon connected successfully!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabase();