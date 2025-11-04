import db from "../db/sqlite";

export function createInvitation(userId: number, otherUserId: number, type: string, expiresInMinutes: number = 2, room_id?: string) {
    const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    let stmt;
    let result;
    if (room_id) {
        stmt = db.prepare("INSERT INTO invitations (user_id, other_user_id, type, expires_at, room_id) VALUES (?, ?, ?, ?, ?)");
        result = stmt.run(userId, otherUserId, type, expires_at, room_id);
    } else {
        stmt = db.prepare("INSERT INTO invitations (user_id, other_user_id, type, expires_at) VALUES (?, ?, ?, ?)");
        result = stmt.run(userId, otherUserId, type, expires_at);
    }
    return result.lastInsertRowid;
}

export function getInvitationByUsers(userId: number, otherUserId: number) {
    const stmt = db.prepare("SELECT * FROM invitations WHERE user_id = ? AND other_user_id = ? AND type = ?");
    const result = stmt.get(userId, otherUserId, "friend");
    return result;
}

export function updateInvitationStatus(id: number, status: string) {
    const stmt = db.prepare("UPDATE invitations SET status = ? WHERE id = ?");
    stmt.run(status, id);
}