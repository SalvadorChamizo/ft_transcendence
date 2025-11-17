import Database from "better-sqlite3"

const db: any = new Database("/app/data/users.db");

db.prepare(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE,
	password TEXT,
	email TEXT UNIQUE,
	last_login INTEGER
	)
`).run();

db.prepare(`
	CREATE TABLE IF NOT EXISTS stats (
	id INTEGER UNIQUE,
	victories INTEGER DEFAULT 0,
	defeats INTEGER DEFAULT 0,
	FOREIGN KEY (id) REFERENCES users(id)
	)
`).run();

db.prepare(`
	CREATE TABLE IF NOT EXISTS friends (
	user_id INTEGER,
	friend_id INTEGER,
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (friend_id) REFERENCES users(id),
	UNIQUE(user_id, friend_id)
	)
`).run();

export default db;