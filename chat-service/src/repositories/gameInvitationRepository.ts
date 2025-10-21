import db from "../db/sqlite"

export function createInvitation(from_user_id: number, to_user_id: number, game_type: string = 'pong', expiresInMinutes: number = 2, room_id?: string) {
    const expires_at = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    let stmt;
    let result;
    if (room_id) {
        stmt = db.prepare("INSERT INTO game_invitations (from_user_id, to_user_id, game_type, expires_at, room_id) VALUES (?, ?, ?, ?, ?)");
        result = stmt.run(from_user_id, to_user_id, game_type, expires_at, room_id);
    } else {
        stmt = db.prepare("INSERT INTO game_invitations (from_user_id, to_user_id, game_type, expires_at) VALUES (?, ?, ?, ?)");
        result = stmt.run(from_user_id, to_user_id, game_type, expires_at);
    }
    return result.lastInsertRowid;
}

export function getInvitationById(id: number) {
    const stmt = db.prepare("SELECT * FROM game_invitations WHERE id = ?");
    return stmt.get(id);
}

export function getPendingInvitationsForUser(user_id: number) {
    const stmt = db.prepare(`
        SELECT * FROM game_invitations 
        WHERE to_user_id = ? 
        AND status = 'pending' 
        AND expires_at > datetime('now')
        ORDER BY created_at DESC
    `);
    return stmt.all(user_id);
}

export function getSentInvitations(user_id: number) {
    const stmt = db.prepare(`
        SELECT * FROM game_invitations 
        WHERE from_user_id = ? 
        AND status = 'pending' 
        AND expires_at > datetime('now')
        ORDER BY created_at DESC
    `);
    return stmt.all(user_id);
}

export function getActiveInvitationBetweenUsers(from_user_id: number, to_user_id: number) {
    const stmt = db.prepare(`
        SELECT * FROM game_invitations 
        WHERE from_user_id = ? 
        AND to_user_id = ? 
        AND status = 'pending' 
        AND expires_at > datetime('now')
        LIMIT 1
    `);
    return stmt.get(from_user_id, to_user_id);
}

export function updateInvitationStatus(id: number, status: string) {
    const stmt = db.prepare("UPDATE game_invitations SET status = ? WHERE id = ?");
    stmt.run(status, id);
}

export function expireOldInvitations() {
    const stmt = db.prepare(`
        UPDATE game_invitations 
        SET status = 'expired' 
        WHERE status = 'pending' 
        AND expires_at <= datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
}
