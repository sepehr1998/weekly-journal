const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./journal.db');

const init = () => {
    db.serialize(() => {
        db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        whatIDid TEXT,
        whatILearned TEXT
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS weekly_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start TEXT NOT NULL,
        week_end TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    });
};

module.exports = { db, init };
