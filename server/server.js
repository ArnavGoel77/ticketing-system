const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Ticketing System API is running' });
});

// TODO (Arnav): Add Ticket Management routes (/api/tickets)
// TODO (Shobit): Add Identity & Organization routes (/api/departments, /api/employees)

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
