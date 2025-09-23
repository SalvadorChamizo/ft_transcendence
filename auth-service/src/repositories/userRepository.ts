import db from "../db/sqlite"

export function createUser(username: string, password: string, email: string) {
    const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
    stmt.run(username, password, email);
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
    const rows = db.prepare("SELECT id, username, totp_secret FROM users").all();
    console.log(rows);
}