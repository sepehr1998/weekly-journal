const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const entriesRoutes = require('./routes/entriesRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

db.init(); // Create tables if not exist

app.use('/api/entries', entriesRoutes);
app.use('/api/summaries', summaryRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
