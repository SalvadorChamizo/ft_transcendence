import Database from "better-sqlite3"

const db: any = new Database("users.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
    )
    `).run();

export default db;