exports.saveSummary = (start, end, summary, callback) => {
    db.run(
        `INSERT INTO weekly_summaries (week_start, week_end, summary) VALUES (?, ?, ?)`,
        [start, end, summary],
        function (err) {
            if (err) callback(err);
            else callback(null, this.lastID);
        }
    );
};
