import db from "../db/sqlite"

export function createConversation(participant1_id: number, participant2_id: number) {
    const stmt = db.prepare("INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)");
    stmt.run(participant1_id, participant2_id);
}

export function findConversation(participant1_id: number, participant2_id: number) {
    const stmt = db.prepare("SELECT * FROM conversations WHERE (participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)");
    return stmt.get(participant1_id, participant2_id, participant2_id, participant1_id);
}

export function getConversationsForUser(user_id: number) {
    const stmt = db.prepare("SELECT * FROM conversations WHERE participant1_id = ? OR participant2_id = ?");
    return stmt.all(user_id, user_id);
}

export function updateConversationTimestamp(conversation_id: number) {
    const stmt = db.prepare("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    stmt.run(conversation_id);
}
