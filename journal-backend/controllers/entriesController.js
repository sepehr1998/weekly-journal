const journalModel = require('../models/journalModel');
const { getWeekRange } = require('../utils/dateUtils');

exports.getEntries = async (req, res) => {
    try {
        if (req.query.week === 'current') {
            const { startDate, endDate } = getWeekRange(new Date());
            const entries = await journalModel.getEntriesForWeek(startDate, endDate);
            return res.json(entries);
        }
        const entries = await journalModel.getAllEntries();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addEntry = async (req, res) => {
    try {
        const { date, whatIDid, whatILearned } = req.body;
        const id = await journalModel.addEntry(date, whatIDid, whatILearned);
        res.status(201).json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, whatIDid, whatILearned } = req.body;
        const result = await journalModel.updateEntry(id, date, whatIDid, whatILearned);
        if (!result) return res.status(404).json({ error: 'Entry not found' });
        res.json({ message: 'Entry updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await journalModel.deleteEntry(id);
        if (!deleted) return res.status(404).json({ error: 'Entry not found' });
        res.json({ message: 'Entry deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
