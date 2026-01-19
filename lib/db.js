import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'estimates.db');

let db;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (error) {
  console.error('Failed to open database:', error);
}

export function initDb() {
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

    -- Modified: Tasks now link to multiple roles via estimate_task_roles
    CREATE TABLE IF NOT EXISTS estimate_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      days REAL NOT NULL, -- Days applies to ALL assigned roles
      FOREIGN KEY(estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
    );

    -- New: Link tasks to multiple roles
    CREATE TABLE IF NOT EXISTS estimate_task_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      estimate_role_id INTEGER NOT NULL,
      FOREIGN KEY(task_id) REFERENCES estimate_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(estimate_role_id) REFERENCES estimate_roles(id)
    );

    -- New: Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    -- Default Settings
    INSERT OR IGNORE INTO settings (key, value) VALUES ('target_margin_percent', '30');
  `;
  db.exec(schema);
}

initDb();

export default db;
