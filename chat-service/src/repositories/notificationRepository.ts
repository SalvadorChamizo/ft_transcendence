import db from "../db/sqlite"

export async function createNotification(userId: number, title: string | null, content: string, message_type: string) {
    const stmt = db.prepare(`
        INSERT INTO notifications (user_id, title, content, message_type)
        VALUES (?, ?, ?, ?)
        `);

        const info = stmt.run(userId, title, content, message_type);
        return ({ id: info.lastInsertRowid })
}

export async function findNotificationsByUser(userId: number) {
    const stmt = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `);
    return stmt.all(userId);
}

export async function markNotificationsAsRead(userId: number) {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        UPDATE notifications
        SET read_at = ?
        WHERE user_id = ? AND read_at IS NULL
    `);

    const info = stmt.run(now, userId);
    return { updated: info.changes };
}

export async function findOneNotificationByUser(userId: number, notificationId: number) {
    const stmt = db.prepare(`
        SELECT * FROM notifications
        WHERE id = ?
    `);
    return stmt.all(notificationId);
}

export async function markOneNotificationAsRead(notificationId: number) {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        UPDATE notifications
        SET read_at = ?
        WHERE id = ? AND read_at IS NULL
    `);

    const info = stmt.run(now, notificationId);
    return { updated: info.changes };
}

export async function deleteNotification(notificationId: number) {
    const stmt = db.prepare(`
        DELETE FROM notifications
        WHERE id = ?
    `);

    stmt.run(notificationId);
}

export async function deleteAllUserNotifications(userId: number) {
    const stmt = db.prepare(`
        DELETE FROM notifications
        WHERE user_id = ?
    `);

    stmt.run(userId);
}