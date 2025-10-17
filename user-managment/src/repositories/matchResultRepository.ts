import db from "../db/sqlite"

export function getResultsByUserId(userId: number) {
	const stmt = db.prepare("SELECT victories, defeats FROM stats WHERE id = ?");
	const result = stmt.get(userId);
	return result ? { victories: result.victories, defeats: result.defeats } : { victories: 0, defeats: 0 };
}

export function addVictoryForUserId(userId: number) {
	const stmt = db.prepare("UPDATE stats SET victories = victories + 1 WHERE id = ?");
	stmt.run(userId);
}

export function addDefeatForUserId(userId: number) {
	const stmt = db.prepare("UPDATE stats SET defeats = defeats + 1 WHERE id = ?");
	stmt.run(userId);
}
