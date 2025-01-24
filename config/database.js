const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
    path.resolve(__dirname, '../database.sqlite'),
    (err) => {
        if (err) {
            console.error('Database connection error:', err);
        } else {
            console.log('Connected to SQLite database');
        }
    }
);

// Create tables
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      analysis_status TEXT DEFAULT 'pending'
    )
  `);
});

module.exports = db; 