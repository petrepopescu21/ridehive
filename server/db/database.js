const { Pool } = require('pg');
require('dotenv').config();

// Configuration for Heroku (DATABASE_URL) vs local development
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Heroku Postgres
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
} : {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 15432, // Docker port for development
  database: process.env.DB_NAME || 'ridehive_dev',
  user: process.env.DB_USER || 'ridehive',
  password: process.env.DB_PASSWORD || 'ridehive123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool
};