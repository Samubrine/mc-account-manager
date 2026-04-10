import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

// Specify the path to the database file
// In production, app.getPath('userData') ensures it writes to a user-writable directory (e.g., AppData on Windows)
const dbPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../data.db')
    : path.join(app.getPath('userData'), 'manager-data.db');

const isDev = process.env.NODE_ENV === 'development';
export const db = new Database(dbPath, { verbose: isDev ? console.log : undefined });
db.pragma('journal_mode = WAL');

// Initialize schema
export const initDb = () => {
    db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      username TEXT,
      account_type TEXT CHECK(account_type IN ('XGP', 'MFA', 'SFA', 'NFA')) DEFAULT 'NFA',
      status TEXT CHECK(status IN ('Active', 'Banned', 'Disabled')) DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      ban_reason TEXT NOT NULL,
      banned_at DATETIME NOT NULL,
      unban_at DATETIME,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
    CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
    CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
    CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
    CREATE INDEX IF NOT EXISTS idx_bans_account_id ON bans(account_id);
    CREATE INDEX IF NOT EXISTS idx_bans_is_active ON bans(is_active);
    CREATE INDEX IF NOT EXISTS idx_bans_unban_at ON bans(unban_at);
  `);

    const accountColumns = db.prepare(`PRAGMA table_info(accounts)`).all() as { name: string }[];
    const hasAccountType = accountColumns.some((col) => col.name === 'account_type');
    if (!hasAccountType) {
        db.prepare(`ALTER TABLE accounts ADD COLUMN account_type TEXT DEFAULT 'NFA'`).run();
    }
};
