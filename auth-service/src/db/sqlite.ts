import Database from "better-sqlite3"

const db: any = new Database("/app/data/auth.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    totp_secret TEXT,
    pending_2fa_secret TEXT,
    is_2fa_enabled BOOLEAN DEFAULT 0
    )
    `).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        grace_until DATETIME DEFAULT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
`).run();

export default db;