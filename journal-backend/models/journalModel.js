const { db } = require('../config/db');

exports.getAllEntries = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM entries ORDER BY date DESC`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

exports.getEntriesForWeek = (startDate, endDate) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
            [startDate, endDate],
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
};

exports.addEntry = (date, whatIDid, whatILearned) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO entries (date, whatIDid, whatILearned) VALUES (?, ?, ?)`,
            [date, whatIDid, whatILearned],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};

exports.updateEntry = (id, date, whatIDid, whatILearned) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE entries SET date = ?, whatIDid = ?, whatILearned = ? WHERE id = ?`,
            [date, whatIDid, whatILearned, id],
            function (err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            }
        );
    });
};

exports.deleteEntry = (id) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM entries WHERE id = ?`, id, function (err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
    });
};

exports.saveWeeklySummary = (week_start, week_end, summary) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO weekly_summaries (week_start, week_end, summary) VALUES (?, ?, ?)`,
            [week_start, week_end, summary],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};

exports.getAllSummaries = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM weekly_summaries ORDER BY week_start DESC`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};
