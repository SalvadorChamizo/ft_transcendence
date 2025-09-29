import db from "../db/sqlite"

export function getVictoriesByUserId(userId: number) {
    const stmt = db.prepare("SELECT victories FROM match_results WHERE id = ?");
    const result = stmt.get(userId);
    return result ? result.victories : 0;
}

export function addVictoryForUserId(userId: number) {
    const stmt = db.prepare("UPDATE victories SET victories = victories + 1 WHERE id = ?");
    stmt.run(userId);
}
