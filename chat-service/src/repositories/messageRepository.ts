import db from "../db/sqlite"

export function createMessage(conversation_id: number, sender_id: number, content: string, message_type: string = 'text') {
    const stmt = db.prepare("INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)");
    stmt.run(conversation_id, sender_id, content, message_type);
}

export function getMessagesByConversation(conversation_id: number) {
    const stmt = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC");
    return stmt.all(conversation_id);
}

export function getRecentMessages(conversation_id: number, limit: number = 50) {
    const stmt = db.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?");
    return stmt.all(conversation_id, limit);
}

export function markMessagesAsRead(conversation_id: number, user_id: number) {
    const stmt = db.prepare(`
        UPDATE messages 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE conversation_id = ? 
        AND sender_id != ? 
        AND read_at IS NULL
    `);
    stmt.run(conversation_id, user_id);
}

export function markMessageAsDelivered(message_id: number) {
    const stmt = db.prepare(`
        UPDATE messages 
        SET delivered_at = CURRENT_TIMESTAMP 
        WHERE id = ? 
        AND delivered_at IS NULL
    `);
    stmt.run(message_id);
}

export function getUnreadCount(user_id: number) {
    const stmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM messages m 
        JOIN conversations c ON m.conversation_id = c.id 
        WHERE (c.participant1_id = ? OR c.participant2_id = ?) 
        AND m.sender_id != ? 
        AND m.read_at IS NULL
    `);
    return stmt.get(user_id, user_id, user_id);
}
