import db from "../db/sqlite"

export function findAllUsers() {
	const stmt = db.prepare("SELECT * FROM users");
	return stmt.all();
}
