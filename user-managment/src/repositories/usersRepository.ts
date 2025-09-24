import db from "../db/sqlite"

export function createUser(username: string, password: string) {
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run(username, password);
}

export function findUser(username: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    return stmt.get(username);
}