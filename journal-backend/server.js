const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const db = new sqlite3.Database('./journal.db');

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize DB tables
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

// Helper function to get entries between two dates
function getEntriesForWeek(startDate, endDate) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
            [startDate, endDate],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// Routes

// Get all entries or entries for the current week if query ?week=current
app.get('/api/entries', async (req, res) => {
    const { week } = req.query;
    if (week === 'current') {
        try {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - diffToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const startDate = monday.toISOString().split('T')[0];
            const endDate = sunday.toISOString().split('T')[0];

            const entries = await getEntriesForWeek(startDate, endDate);
            return res.json(entries);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // If no week filter, return all entries
    db.all(`SELECT * FROM entries ORDER BY date DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new entry
app.post('/api/entries', (req, res) => {
    const { date, whatIDid, whatILearned } = req.body;
    db.run(
        `INSERT INTO entries (date, whatIDid, whatILearned) VALUES (?, ?, ?)`,
        [date, whatIDid, whatILearned],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Save weekly summary
app.post('/api/summary', (req, res) => {
    const { week_start, week_end, summary } = req.body;

    if (!week_start || !week_end || !summary) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT INTO weekly_summaries (week_start, week_end, summary) VALUES (?, ?, ?)`,
        [week_start, week_end, summary],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, week_start, week_end, summary });
        }
    );
});

// Get all weekly summaries
app.get('/api/summaries', (req, res) => {
    db.all(`SELECT * FROM weekly_summaries ORDER BY week_start DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Edit existing entry by ID
app.put('/api/entries/:id', (req, res) => {
    const { id } = req.params;
    const { date, whatIDid, whatILearned } = req.body;

    if (!date || !whatIDid || !whatILearned) {
        return res.status(400).json({ error: 'Missing fields in request body' });
    }

    db.run(
        `UPDATE entries SET date = ?, whatIDid = ?, whatILearned = ? WHERE id = ?`,
        [date, whatIDid, whatILearned, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            res.json({ message: 'Entry updated successfully' });
        }
    );
});

// Delete entry by ID
app.delete('/api/entries/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM entries WHERE id = ?`, id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted successfully' });
    });
});

// Helper function to get entries between two dates (same as before)
function getEntriesForWeek(startDate, endDate) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
            [startDate, endDate],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// New endpoint: generate AI summary for a given week
app.post('/api/generate-summary', async (req, res) => {
    try {
        const { week_start, week_end } = req.body;

        if (!week_start || !week_end) {
            return res.status(400).json({ error: 'Missing week_start or week_end' });
        }

        // Fetch entries for the week
        const entries = await getEntriesForWeek(week_start, week_end);

        if (entries.length === 0) {
            return res.status(400).json({ error: 'No entries found for the specified week' });
        }

        // Format entries into a single prompt string
        const entriesText = entries
            .map(
                (e) =>
                    `Date: ${e.date}\nWhat I did: ${e.whatIDid}\nWhat I learned: ${e.whatILearned}`
            )
            .join('\n\n');

        const prompt = `You are a helpful assistant. Summarize the following journal entries into a concise weekly summary:\n\n${entriesText}\n\nSummary:`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-mini', // or 'gpt-4' if you have access
            messages: [
                { role: 'user', content: prompt }
            ],
        });

        const summary = completion.choices[0].message.content.trim();

        res.json({ summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
