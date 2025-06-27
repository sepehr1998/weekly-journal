import { useEffect, useState } from 'react';
import axios from 'axios';

interface Entry {
    id: number;
    date: string;
    whatIDid: string;
    whatILearned: string;
}

interface WeekGroup {
    start: string;
    end: string;
    entries: Entry[];
}

interface Summary {
    id: number;
    week_start: string;
    week_end: string;
    summary: string;
}

const API_URL = 'http://localhost:3000/api';

function App() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [weeks, setWeeks] = useState<WeekGroup[]>([]);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], whatIDid: '', whatILearned: '' });

    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ date: '', whatIDid: '', whatILearned: '' });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<{ start: string; end: string } | null>(null);
    const [summaryText, setSummaryText] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [collapsedWeeks, setCollapsedWeeks] = useState<Record<string, boolean>>({});

    const fetchEntries = async () => {
        try {
            const res = await axios.get(`${API_URL}/entries`);
            setEntries(res.data);
        } catch (err) {
            console.error('Failed to fetch entries:', err);
        }
    };

    const groupEntriesByWeek = (entries: Entry[]) => {
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const groups: WeekGroup[] = [];

        function getMonday(d: Date) {
            const date = new Date(d);
            const day = date.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            date.setDate(date.getDate() + diff);
            return date;
        }

        let currentWeekStart = '';
        let currentWeekEnd = '';
        let currentEntries: Entry[] = [];

        for (const entry of sorted) {
            const entryDate = new Date(entry.date);
            const monday = getMonday(entryDate);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const mondayStr = monday.toISOString().split('T')[0];
            const sundayStr = sunday.toISOString().split('T')[0];

            if (currentWeekStart !== mondayStr) {
                if (currentEntries.length > 0) {
                    groups.push({
                        start: currentWeekStart,
                        end: currentWeekEnd,
                        entries: currentEntries,
                    });
                }
                currentWeekStart = mondayStr;
                currentWeekEnd = sundayStr;
                currentEntries = [];
            }
            currentEntries.push(entry);
        }

        if (currentEntries.length > 0) {
            groups.push({
                start: currentWeekStart,
                end: currentWeekEnd,
                entries: currentEntries,
            });
        }

        setWeeks(groups);
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        groupEntriesByWeek(entries);
    }, [entries]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/entries`, form);
            setForm({ date: '', whatIDid: '', whatILearned: '' });
            fetchEntries();
        } catch (err) {
            console.error('Failed to add entry:', err);
        }
    };

    const handleDeleteEntry = async (id: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            await axios.delete(`${API_URL}/entries/${id}`);
            fetchEntries();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const startEditing = (entry: Entry) => {
        setEditingEntryId(entry.id);
        setEditForm({ date: entry.date, whatIDid: entry.whatIDid, whatILearned: entry.whatILearned });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateEntry = async (id: number) => {
        try {
            await axios.put(`${API_URL}/entries/${id}`, editForm);
            setEditingEntryId(null);
            fetchEntries();
        } catch (err) {
            console.error('Failed to update entry:', err);
        }
    };

    const generateSummary = async (week: { start: string; end: string }) => {
        try {
            const res = await axios.post(`${API_URL}/summaries/generate-summary`, {
                week_start: week.start,
                week_end: week.end,
            });
            alert(res.data.summary);
        } catch (err) {
            console.error('Error generating summary:', err);
            alert('Failed to generate summary. See console.');
        }
    };

    const openSummaryModal = async (week: { start: string; end: string }) => {
        setSelectedWeek(week);
        setModalOpen(true);
        setLoadingSummary(true);
        try {
            const res = await axios.get(`${API_URL}/summaries`);
            const match = res.data.find(
                (s: Summary) => s.week_start === week.start && s.week_end === week.end
            );
            setSummaryText(match ? match.summary : '');
        } catch (err) {
            console.error('Error fetching summary:', err);
            setSummaryText('');
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <h1 className="text-4xl font-bold mb-6 text-center">My Journal</h1>

            <form onSubmit={handleSubmit} className="mb-10 space-y-4">
                <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                    name="whatIDid"
                    placeholder="What I did"
                    value={form.whatIDid}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
                <textarea
                    name="whatILearned"
                    placeholder="What I learned"
                    value={form.whatILearned}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition"
                >
                    Add Entry
                </button>
            </form>

            {weeks.map((week) => {
                const isCollapsed = collapsedWeeks[week.start] ?? false;

                return (
                    <div
                        key={`${week.start}-${week.end}`}
                        className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow"
                    >
                        <div
                            className="flex justify-between items-center cursor-pointer p-6 border-b border-gray-200 dark:border-gray-700"
                            onClick={() =>
                                setCollapsedWeeks((prev) => ({
                                    ...prev,
                                    [week.start]: !isCollapsed,
                                }))
                            }
                        >
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                {isCollapsed ? '▶' : '▼'} {week.start} → {week.end}
                            </h2>
                            <div className="space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        generateSummary(week);
                                    }}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
                                >
                                    🪄 Generate Summary
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openSummaryModal(week);
                                    }}
                                    className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition text-sm"
                                >
                                    📖 Weekly Summary
                                </button>
                            </div>
                        </div>

                        <div
                            className={`px-6 transition-all duration-300 space-y-4 ${
                                isCollapsed ? 'hidden opacity-0' : 'block opacity-100 py-6'
                            }`}
                        >
                            {week.entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="border border-gray-300 dark:border-gray-700 rounded p-4 bg-gray-50 dark:bg-gray-900"
                                >
                                    {editingEntryId === entry.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="date"
                                                name="date"
                                                value={editForm.date}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none"
                                            />
                                            <textarea
                                                name="whatIDid"
                                                value={editForm.whatIDid}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                                                rows={3}
                                            />
                                            <textarea
                                                name="whatILearned"
                                                value={editForm.whatILearned}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
                                                rows={3}
                                            />
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => handleUpdateEntry(entry.id)}
                                                    className="text-sm bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                                                >
                                                    💾 Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingEntryId(null)}
                                                    className="text-sm text-gray-600 hover:underline"
                                                >
                                                    ❌ Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <strong className="block mb-1">{entry.date}</strong>
                                            <p>
                                                <strong className="block">What I did:</strong>
                                                {entry.whatIDid}
                                            </p>
                                            <p>
                                                <strong className="block">What I learned:</strong>
                                                {entry.whatILearned}
                                            </p>
                                            <div className="mt-4 space-x-2">
                                                <button
                                                    onClick={() => startEditing(entry)}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="text-sm text-red-600 hover:underline"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}



            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">
                                Weekly Summary ({selectedWeek?.start} → {selectedWeek?.end})
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-gray-600 hover:text-red-500 text-3xl font-bold leading-none"
                                aria-label="Close summary modal"
                            >
                                &times;
                            </button>
                        </div>
                        {loadingSummary ? (
                            <p className="text-sm text-gray-500">Loading summary...</p>
                        ) : summaryText ? (
                            <p className="whitespace-pre-line text-gray-800 dark:text-gray-100">{summaryText}</p>
                        ) : (
                            <div className="text-center py-12 text-gray-400 italic">
                                <p>No summary available for this week yet.</p>
                                <p className="text-sm">Try generating it first.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
