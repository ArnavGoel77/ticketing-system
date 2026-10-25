const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializePool, closePool } = require('./db');
const ticketRoutes = require('./routes/tickets');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middleware
app.use(cors());
app.use(express.json());

// API Health Check & Database Status
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'IT Service Desk Ticketing System API is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// Shobit's Module: Identity, Authentication & Organization
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);

// Arnav's Module: Ticket Management
app.use('/api/tickets', ticketRoutes);


// ============================================================================
// SERVER INITIALIZATION & LIFECYCLE
// ============================================================================
const startServer = async () => {
    try {
        // Attempt Oracle DB connection pool startup
        await initializePool();
    } catch (err) {
        console.warn('⚠️ [Server Warning] Oracle DB Pool not connected yet. Check credentials in server/.env.');
    }

    const server = app.listen(PORT, () => {
        console.log(`🚀 [Server] Running on http://localhost:${PORT}`);
        console.log(`📡 [API Endpoints] /api/tickets, /api/departments, /api/employees, /api/health`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
        console.log('\n🛑 [Server] Gracefully shutting down...');
        await closePool();
        server.close(() => {
            console.log('✅ [Server] HTTP server closed.');
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

startServer();
