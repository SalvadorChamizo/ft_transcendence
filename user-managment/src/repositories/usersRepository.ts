import db from "../db/sqlite"

export function createUser(username: string, password: string, email: string) {
    console.log("🔨 CREANDO USUARIO:");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Email:", email);
    
    const stmt = db.prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
    const result = stmt.run(username, password, email);
    
    console.log("✅ Usuario insertado:");
    console.log("ID generado:", result.lastInsertRowid);
    console.log("Cambios:", result.changes);
    
    // Verificar que se creó correctamente
    const userCreated = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    console.log("🔍 Usuario recién creado:", userCreated);
}

export function findUser(username: string) {
    // Ver todos los usuarios para debug
    const allUsers = db.prepare("SELECT * FROM users").all();
    console.log("Todos los usuarios en la BD:", allUsers);
    
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    console.log("Username being searched:", username);
    console.log("Query Result:", stmt.get(username));
    return stmt.get(username);
}