'use strict';

// Queries in this adapter are application-owned SQL. All values remain bound parameters.
function postgres(pool) {
  // Dedicated names avoid collisions with other applications in a company database.
  const names = /\b(releases|projects|identities|sessions|login_flows|uploads|upload_parts|projects_recent|uploads_expiry|sessions_expiry)\b/g;
  const sql = text => {
    let index = 0;
    return text.replace(names, name => 'lw_estimator_' + name).replace(/\?/g, () => '$' + (++index));
  };
  return {
    releaseOrder: 'sequence',
    exec: text => pool.query(sql(text)),
    async migrate(text) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Serialize first-run schema creation across concurrent function instances.
        await client.query('SELECT pg_advisory_xact_lock(168109, 1)');
        await client.query(sql(text));
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally { client.release(); }
    },
    prepare(text) {
      const query = values => pool.query(sql(text), values);
      return {
        get: async (...values) => (await query(values)).rows[0],
        all: async (...values) => (await query(values)).rows,
        run: async (...values) => ({ changes: (await query(values)).rowCount }),
      };
    },
    close: () => pool.end(),
  };
}

async function openDatabase(config) {
  if (config.databaseUrl) {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: config.databaseUrl, max: 4, min: 1, idleTimeoutMillis: 5000, connectionTimeoutMillis: 10000, statement_timeout: 20000, application_name: 'livewire-estimator' });
    pool.on('error', error => console.error('Database connection failed:', error.code || error.name));
    if (config.vercel) require('@vercel/functions').attachDatabasePool(pool);
    return postgres(pool);
  }
  if (config.vercel) throw Error('Vercel requires a durable PostgreSQL DATABASE_URL; local SQLite storage is disabled.');
  const { DatabaseSync } = require('node:sqlite');
  const { mkdirSync } = require('node:fs');
  const { dirname } = require('node:path');
  if (config.dbPath !== ':memory:') mkdirSync(dirname(config.dbPath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(config.dbPath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  return { releaseOrder: 'rowid', exec: text => db.exec(text), prepare: text => db.prepare(text), close: () => db.close() };
}

async function initialize(db) {
  await (db.migrate || db.exec)(`
    CREATE TABLE IF NOT EXISTS releases (${db.releaseOrder === 'sequence' ? 'sequence BIGSERIAL PRIMARY KEY,' : ''} version TEXT NOT NULL UNIQUE, document TEXT NOT NULL, published_by TEXT, published_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, scope TEXT NOT NULL, release TEXT NOT NULL REFERENCES releases(version), revision INTEGER NOT NULL, approval TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS projects_recent ON projects(updated_at DESC);
    CREATE TABLE IF NOT EXISTS identities (email TEXT PRIMARY KEY, subject TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_flows (id TEXT PRIMARY KEY, state TEXT NOT NULL, nonce TEXT NOT NULL, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, owner TEXT NOT NULL, target TEXT NOT NULL, parts INTEGER NOT NULL, bytes INTEGER NOT NULL, expires INTEGER NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS upload_parts (upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE, part INTEGER NOT NULL, content TEXT NOT NULL, PRIMARY KEY(upload_id, part));
    CREATE INDEX IF NOT EXISTS uploads_expiry ON uploads(expires);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
  `);
}

module.exports = { openDatabase, initialize, postgres };
