import db from "../db/sqlite"

export function getResultsByUserId(userId: number) {
	const stmt = db.prepare("SELECT victories, defeats FROM stats WHERE id = ?");
	const result = stmt.get(userId);
	return result ? { victories: result.victories, defeats: result.defeats } : { victories: 0, defeats: 0 };
}

export function addVictoryForUserId(userId: number) {
	const update = db.prepare("UPDATE stats SET victories = victories + 1 WHERE id = ?");
	const result = update.run(userId);
	// If no row was updated, insert a new stats row for this user
	if (result.changes === 0) {
		const insert = db.prepare("INSERT INTO stats (id, victories, defeats) VALUES (?, 1, 0)");
		insert.run(userId);
	}
}

export function addDefeatForUserId(userId: number) {
	const update = db.prepare("UPDATE stats SET defeats = defeats + 1 WHERE id = ?");
	const result = update.run(userId);
	// If no row was updated, insert a new stats row for this user
	if (result.changes === 0) {
		const insert = db.prepare("INSERT INTO stats (id, victories, defeats) VALUES (?, 0, 1)");
		insert.run(userId);
	}
}
