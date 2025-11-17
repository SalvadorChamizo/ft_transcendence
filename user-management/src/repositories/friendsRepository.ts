import db from "../db/sqlite"

export function findAllUsers() {
	const stmt = db.prepare("SELECT * FROM users");
	return stmt.all();
}

export function getFriends(userId: number){
	const stmt = db.prepare(`
		SELECT u.*
		FROM friends f
		JOIN users u ON u.id = f.friend_id
		WHERE f.user_id = ?
	`);
	return stmt.all(userId)
}

export function addFriend(userId: number, friendId: number) {
	const stmt = db.prepare(`
		INSERT INTO friends (user_id, friend_id)
		VALUES (?, ?), (?, ?)
	`);
	return stmt.run(userId, friendId, friendId, userId);
}

export function removeFriend(userId: number, friendId: number) {
	const stmt = db.prepare(`
		DELETE FROM friends
		WHERE (user_id = ? AND friend_id = ?)
			OR (user_id = ? AND friend_id = ?)
	`);
	return stmt.run(userId, friendId, friendId, userId);
}

export function checkFriend(userId: number, friendId: number) {
	const stmt = db.prepare(`
		SELECT * FROM friends WHERE user_id = ? AND friend_id = ?
	`);
	return stmt.get(userId, friendId);
}
