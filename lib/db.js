import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'estimates.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url,
  authToken,
});

export async function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      internal_rate REAL NOT NULL,
      charge_out_rate REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      duration_unit TEXT NOT NULL DEFAULT 'weeks',
      currency TEXT NOT NULL DEFAULT 'GBP',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS estimate_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      internal_role_id INTEGER NOT NULL,
      FOREIGN KEY(estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      FOREIGN KEY(role_id) REFERENCES roles(id),
      FOREIGN KEY(internal_role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS estimate_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      days REAL NOT NULL,
      FOREIGN KEY(estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS estimate_task_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      estimate_role_id INTEGER NOT NULL,
      FOREIGN KEY(task_id) REFERENCES estimate_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(estimate_role_id) REFERENCES estimate_roles(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    INSERT OR IGNORE INTO settings (key, value) VALUES ('target_margin_percent', '30');
  `;

  // LibSQL executeMultiple is not standard, we must split manually or use executeMultiple if supported.
  // The client supports executeMultiple but checks might differ.
  // Safest is to split by ';' and execute sequentially for setup.
  // Actually, executeMultiple is supported in @libsql/client.

  try {
    // In serverless, running this on every cold start is expensive. 
    // We should rely on manual migrations or the verification script.
    // await db.executeMultiple(schema);
  } catch (e) {
    console.error("DB Init Error:", e);
  }
}

// Debug logging to help troubleshoot Vercel deployment
const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.TURSO_DATABASE_URL;
if (isProd) {
  console.log("Database Config Check:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("TURSO_DATABASE_URL Defined?", !!dbUrl);
  if (dbUrl) {
    console.log("TURSO_DATABASE_URL Scheme:", dbUrl.split(':')[0]); // Should be 'libsql'
  } else {
    console.error("CRITICAL: TURSO_DATABASE_URL is missing in production! Falling back to valid-url-check or local file.");
    // Note: If falling back to file in Vercel, it will likely fail with SQLITE_CANTOPEN
  }
}

// Disable auto-init in production to prevent "module evaluation" crashes
// and rely on the manual script 'npm run verify' to set up tables.
if (!isProd) {
  initDb();
}

export default db;
