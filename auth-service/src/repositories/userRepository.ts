import db from "../db/sqlite"

export function createUser() {
    const stmt = db.prepare("INSERT INTO users DEFAULT VALUES");
    const result = stmt.run();

    return result.lastInsertRowid
}

export function findUser(username: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    return stmt.get(username);
}

export function findUserById(userId: number) {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(userId);
}

export function updateUser2FA(secret: string, userId: number) {
    const stmt = db.prepare("UPDATE users SET totp_secret = ?, is_2fa_enabled = 1 WHERE id = ?")
    stmt.run(secret, userId);
}

export function debugUsers() {
    const rows = db.prepare("SELECT id, totp_secret, pending_2fa_secret FROM users").all();
    console.log(rows);
}

export function updateUserPending2FA(secret: string, userId: number) {
    const stmt = db.prepare("UPDATE users SET pending_2fa_secret = ? WHERE id = ?");
    stmt.run(secret, userId);
}

export function activateUser2FA(userId: number, secret: string) {
    const stmt = db.prepare("UPDATE users SET totp_secret = ?, pending_2fa_secret = NULL, is_2fa_enabled = 1 WHERE id = ?");
    stmt.run(secret, userId);
}

export function getUserPending2FA(userId: number): string | null {
    const stmt = db.prepare("SELECT pending_2fa_secret FROM users WHERE id = ?");
    const row = stmt.get(userId);

    if (!row || !row.pending_2fa_secret) {
        return null;
    }

    return row.pending_2fa_secret;
}

export function deleteUser(userId: number) {
    const stmt = db.prepate("DELETE * FROM users WHERE id = ?");
    stmt.run(userId);
}