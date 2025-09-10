import db from "../db/sqlite"

export function blockUser(blocker_id: number, blocked_id: number) {
    const stmt = db.prepare("INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)");
    stmt.run(blocker_id, blocked_id);
}

export function unblockUser(blocker_id: number, blocked_id: number) {
    const stmt = db.prepare("DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?");
    stmt.run(blocker_id, blocked_id);
}

export function isBlocked(blocker_id: number, blocked_id: number) {
    const stmt = db.prepare("SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?");
    return stmt.get(blocker_id, blocked_id);
}

export function areUsersBlocked(user1_id: number, user2_id: number) {
    const stmt = db.prepare("SELECT * FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)");
    return stmt.get(user1_id, user2_id, user2_id, user1_id);
}

export function getBlockedUsers(user_id: number) {
    const stmt = db.prepare("SELECT blocked_id FROM blocked_users WHERE blocker_id = ?");
    return stmt.all(user_id);
}
