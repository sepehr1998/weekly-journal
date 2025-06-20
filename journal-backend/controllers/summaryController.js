const journalModel = require('../models/journalModel');
const openAIService = require('../services/openAIService');

exports.saveSummary = async (req, res) => {
    try {
        const { week_start, week_end, summary } = req.body;
        if (!week_start || !week_end || !summary) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const id = await journalModel.saveWeeklySummary(week_start, week_end, summary);
        res.status(201).json({ id, week_start, week_end, summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSummaries = async (req, res) => {
    try {
        const summaries = await journalModel.getAllSummaries();
        res.json(summaries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.generateAISummary = async (req, res) => {
    try {
        const { week_start, week_end } = req.body;
        if (!week_start || !week_end) {
            return res.status(400).json({ error: 'Missing week_start or week_end' });
        }
        const entries = await journalModel.getEntriesForWeek(week_start, week_end);
        if (entries.length === 0) {
            return res.status(400).json({ error: 'No entries found for the specified week' });
        }

        const entriesText = entries
            .map(
                (e) =>
                    `Date: ${e.date}\nWhat I did: ${e.whatIDid}\nWhat I learned: ${e.whatILearned}`
            )
            .join('\n\n');

        const prompt = `You are a helpful assistant. Summarize the following journal entries into a concise weekly summary:\n\n${entriesText}\n\nSummary:`;

        const summary = await openAIService.generateSummary(prompt);

        res.json({ summary });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};

exports.generateAndSaveSummary = async (req, res) => {
    try {
        const { week_start, week_end } = req.body;
        if (!week_start || !week_end) {
            return res.status(400).json({ error: 'Missing week_start or week_end' });
        }

        const entries = await journalModel.getEntriesForWeek(week_start, week_end);
        if (entries.length === 0) {
            return res.status(400).json({ error: 'No entries found for the specified week' });
        }

        const entriesText = entries
            .map(
                (e) =>
                    `Date: ${e.date}\nWhat I did: ${e.whatIDid}\nWhat I learned: ${e.whatILearned}`
            )
            .join('\n\n');

        const prompt = `You are a helpful assistant. Summarize the following journal entries into a concise weekly summary:\n\n${entriesText}\n\nSummary:`;

        const summary = await openAIService.generateSummary(prompt);

        const id = await journalModel.saveWeeklySummary(week_start, week_end, summary);

        res.status(201).json({ id, week_start, week_end, summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};
