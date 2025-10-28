import db from "../db/sqlite"

export function createUser(username: string, password: string, email: string) {
	const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
	const result = stmt.run(username, password, email);
	
	const userCreated = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
	console.log("🔍 Usuario recién creado:", userCreated);
}

export function findUserByUsername(username: string) {
	const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
	return stmt.get(username);
}

export function usernameChanger(id: number, newUsername: string) {
	const stmt = db.prepare("UPDATE users SET username = ? WHERE id = ?");
	const user = stmt.run(newUsername, id);
	if (user.changes === 0) {
		throw new Error("No user found with the given ID");
	}
}

export function emailChanger(id: number, newEmail: string) {
	const stmt = db.prepare("UPDATE users SET email = ? WHERE id = ?");
	const user = stmt.run(newEmail, id);
	if (user.changes === 0) {
		throw new Error("No user found with the given ID");
	}
}

export function passwordChanger(id: number, newPassword: string) {
	const stmt = db.prepare("UPDATE users SET password = ? WHERE id = ?");
	const user = stmt.run(newPassword, id);
	if (user.changes === 0) {
		throw new Error("No user found with the given ID");
	}
}

export function findUserById(id: number) {
	const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
	return stmt.get(id);
}

export function findUserByEmail(email: string) {
	const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
	return stmt.get(email);
}

export function findIDByUsername(username: string) {
	const stmt = db.prepare("SELECT id FROM users WHERE username = ?");
	const result = stmt.get(username);
	return result ? result.id : null;
}

export function findAllUsers() {
	const stmt = db.prepare("SELECT id, username, email FROM users ORDER BY username");
	return stmt.all();
}