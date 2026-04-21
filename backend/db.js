const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "process_scheduler"
});

db.connect((err) => {
  if (err) {
    console.error(" MySQL Connection Failed:", err.message);
    return;
  }
  console.log("✅ MySQL Connected!");
});

module.exports = db;