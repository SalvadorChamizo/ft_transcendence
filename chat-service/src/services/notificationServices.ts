import { FastifyRequest, FastifyReply } from "fastify";
import { createNotification,
         findNotificationsByUser,
         markNotificationsAsRead } from "../repositories/notificationRepository";
         
export async function sendNotification(userId: number, title: string | null, content: string, message_type: string) {
    if (!userId || !content)
        throw new Error("Missing required fields");

    const notification = await createNotification(userId, title, content, message_type);
    return { success: true, id: notification.id, message: "Notification created" };
}

export async function getUserNotifications(userId: number) {
    if (!userId)
        throw new Error("Missing userId");

    const notifications = await findNotificationsByUser(userId);
    return { success: true, notifications };
}

export async function markUserNotificationsAsRead(userId: number) {
    if (!userId)
        throw new Error("Missing userId");

    const result = await markNotificationsAsRead(userId);
    return { succes: true, updated: result.updated, message: "Notifications marked as read" };
}