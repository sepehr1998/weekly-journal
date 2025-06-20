import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/entries';

type Entry = {
    id: number;
    date: string;
    whatIDid: string;
    whatILearned: string;
};

function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function App() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [form, setForm] = useState({ date: getTodayDateString(), whatIDid: '', whatILearned: '' });
    const [editId, setEditId] = useState<number | null>(null);

    const fetchEntries = async () => {
        try {
            const res = await axios.get(API_URL);
            setEntries(res.data);
        } catch (err) {
            console.error('Failed to fetch entries:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editId !== null) {
                // Update existing entry
                await axios.put(`${API_URL}/${editId}`, form);
            } else {
                // Create new entry
                await axios.post(API_URL, form);
            }
            setForm({ date: '', whatIDid: '', whatILearned: '' });
            setEditId(null);
            fetchEntries();
        } catch (err) {
            console.error('Failed to submit entry:', err);
        }
    };

    const handleEdit = (entry: Entry) => {
        setForm({ date: entry.date, whatIDid: entry.whatIDid, whatILearned: entry.whatILearned });
        setEditId(entry.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchEntries();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const handleCancelEdit = () => {
        setForm({ date: '', whatIDid: '', whatILearned: '' });
        setEditId(null);
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white p-8 text-gray-800 font-sans">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-indigo-700 mb-6 text-center drop-shadow-lg">
                    ✍️ My Journal
                </h1>

                <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-6 space-y-4 mb-10 transition-all">
                    <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <textarea
                        name="whatIDid"
                        placeholder="What I did..."
                        value={form.whatIDid}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <textarea
                        name="whatILearned"
                        placeholder="What I learned..."
                        value={form.whatILearned}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />

                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition transform hover:scale-105 duration-200"
                        >
                            {editId !== null ? 'Update Entry' : '+ Add Entry'}
                        </button>
                        {editId !== null && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-grow bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition transform hover:scale-105 duration-200"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <h2 className="text-2xl font-semibold text-indigo-600 mb-4">📚 Entries</h2>
                <div className="space-y-6">
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="bg-white shadow-lg rounded-xl p-5 border-l-4 border-indigo-500 transition-transform transform hover:scale-[1.01]"
                        >
                            <p className="text-sm text-gray-500 mb-2">{entry.date}</p>
                            <p><strong className="text-indigo-600">What I did:</strong> {entry.whatIDid}</p>
                            <p className="mt-2"><strong className="text-indigo-600">What I learned:</strong> {entry.whatILearned}</p>

                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={() => handleEdit(entry)}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-1 px-3 rounded-lg transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;
