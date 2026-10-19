const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config();

// Standardize output rows as clean JavaScript objects with named properties
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Automatically serialize Oracle DATE / CLOB to strings for reliable JSON responses
oracledb.fetchAsString = [oracledb.DATE, oracledb.CLOB];

let pool = null;

/**
 * Initializes the Oracle Cloud Autonomous Database connection pool using the extracted wallet.
 */
async function initializePool() {
    if (pool) return pool;

    const walletDir = path.resolve(__dirname, process.env.DB_WALLET_DIR || './wallet');

    const poolConfig = {
        user: process.env.DB_USER || 'ADMIN',
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING || 'ticketdb_high',
        configDir: walletDir,
        walletLocation: walletDir,
        poolMin: 1,
        poolMax: 5,
        poolIncrement: 1,
        poolTimeout: 60,
    };

    if (process.env.DB_WALLET_PASSWORD) {
        poolConfig.walletPassword = process.env.DB_WALLET_PASSWORD;
    }

    try {
        pool = await oracledb.createPool(poolConfig);
        console.log(`[Oracle DB] Connection pool created successfully (${poolConfig.connectString})`);
        return pool;
    } catch (err) {
        console.error('[Oracle DB] Failed to create connection pool:', err.message);
        throw err;
    }
}

/**
 * Executes a parameterized SQL statement with automatic connection acquisition & release.
 * @param {string} sql - SQL query or DML statement
 * @param {object|array} binds - Parameterized bind variables
 * @param {object} options - Execution options (autoCommit, etc.)
 */
async function executeQuery(sql, binds = {}, options = {}) {
    let connection;
    try {
        if (!pool) {
            await initializePool();
        }
        connection = await pool.getConnection();
        const execOptions = {
            autoCommit: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            ...options
        };
        const result = await connection.execute(sql, binds, execOptions);
        return result;
    } catch (err) {
        console.error('[Oracle DB] Query Execution Error:', err.message);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error('[Oracle DB] Error releasing connection back to pool:', closeErr.message);
            }
        }
    }
}

/**
 * Closes the connection pool on application shutdown.
 */
async function closePool() {
    if (pool) {
        try {
            await pool.close(10);
            console.log('[Oracle DB] Pool safely closed.');
            pool = null;
        } catch (err) {
            console.error('[Oracle DB] Error closing pool:', err.message);
        }
    }
}

module.exports = {
    initializePool,
    executeQuery,
    closePool,
    oracledb
};
