import db from "../db/sqlite"

export function createUser(username: string, password: string, email: string) {
    const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
    const result = stmt.run(username, password, email);
    
    const userCreated = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    console.log("🔍 Usuario recién creado:", userCreated);
}

export function findUserByUsername(username: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    return stmt.get(username);
}

export function findUserById(id: number) {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    return stmt.get(id);
}

export function findUserByEmail(email: string) {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email);
}