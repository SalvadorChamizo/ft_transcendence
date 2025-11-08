import db from "../db/sqlite"

export function createUser(username: string, password: string, email: string) {
	const stmt = db.prepare("INSERT INTO users (username, password, email, last_login) VALUES (?, ?, ?, ?)");
	stmt.run(username, password, email, Math.floor(Date.now() / 1000));
}

export function timeRegister(id: number) {
	const stmt = db.prepare("UPDATE users SET last_login = ? WHERE id = ?");
	return stmt.run(Math.floor(Date.now() / 1000), id);
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

export function removeUser(id: number) {
	const deleteUsers = db.prepare("DELETE FROM users WHERE id = ?");
	const deleteStats = db.prepare("DELETE FROM stats WHERE id = ?");
	const deleteFriends = db.prepare("DELETE FROM friends WHERE (user_id = ?) OR (friend_id = ?)");
	
	const result = deleteStats.run(id).changes +
					deleteFriends.run(id, id).changes +
					deleteUsers.run(id).changes;

	return( result );
}

export async function removeInactiveUsers(inactiveDays : number) {
	
	const timeLimit = Math.floor(Date.now() / 1000) - inactiveDays;

	const getUsers = db.prepare("SELECT id FROM users WHERE last_login < ?");
	const inactiveUsers = getUsers.all(timeLimit);

	let totalRemoved = 0;

	for (const user of inactiveUsers) {
		totalRemoved += removeUser(user.id);

		const res = await fetch("http://auth-service:8081/deleteAuthUser", {
			method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
        credentials: "include", // include cookies
		})
	}

	console.log("Total inactive users removed: ", totalRemoved);
}

export function findAllUsers() {
	const stmt = db.prepare("SELECT id, username, email FROM users ORDER BY username");
	return stmt.all();
}