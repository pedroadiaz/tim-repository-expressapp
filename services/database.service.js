const mysql = require('mysql2/promise');
const secretsService = require('./secrets.service.js');

let connectionPool = null;
let isInitializing = false;
let initPromise = null;

/**
 * Get or create the database connection pool
 * This ensures secrets are loaded before creating the connection
 * @returns {Promise<mysql.Pool>}
 */
async function getConnectionPool() {
    if (connectionPool) {
        return connectionPool;
    }
    
    if (isInitializing) {
        return initPromise;
    }
    
    isInitializing = true;
    
    initPromise = (async () => {
        try {
            // Ensure secrets are loaded
            await secretsService.loadSecrets();
            
            // Create the connection pool with promise support
            connectionPool = mysql.createPool({
                host: process.env.DATABASE_ENDPOINT,
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                connectionLimit: 5
            });
            
            console.log('Database connection pool created successfully');
            return connectionPool;
        } catch (error) {
            console.error('Error creating database connection pool:', error);
            isInitializing = false;
            throw error;
        }
    })();
    
    return initPromise;
}

/**
 * Execute a query with automatic connection pool initialization
 * Support both callback and promise patterns
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {Function} callback - Optional callback function
 * @returns {Promise} - Promise if no callback provided
 */
async function query(query, params, callback) {
    try {
        const pool = await getConnectionPool();
        
        if (callback) {
            // Callback pattern - use execute for compatibility
            try {
                const [rows, fields] = await pool.execute(query, params);
                callback(null, rows, fields);
            } catch (error) {
                callback(error, null);
            }
        } else {
            // Promise pattern
            return pool.execute(query, params);
        }
    } catch (error) {
        console.error('Database query error:', error);
        if (callback) {
            callback(error, null);
        } else {
            throw error;
        }
    }
}

module.exports = {
    getConnectionPool,
    query
};