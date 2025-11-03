import { FastifyRequest, FastifyReply } from "fastify";
import { createNotification,
         findNotificationsByUser,
         markNotificationsAsRead,
         findOneNotificationByUser,
         markOneNotificationAsRead,
         deleteNotification,
         } from "../repositories/notificationRepository";
         
export async function sendNotification(userId: number, title: string | null, content: string, message_type: string) {
    if (!userId || !content)
        throw new Error("Missing required fields");

    const notification = await createNotification(userId, title, content, message_type);
    console.log("Notification created:", userId, message_type, content);
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
    return { success: true, updated: result.updated, message: "Notifications marked as read" };
}

export async function getSpecificUserNotification(userId: number, notificationId: number) {
    if (!userId)
        throw new Error("Missing userId");

    const notification = await findOneNotificationByUser(userId, notificationId);
    return { success: true, notification };
}

export async function markOneUserNotificationAsRead(notificationId: number) {
    if (!notificationId)
        throw new Error("Missing notificationId");

    const result = await markOneNotificationAsRead(notificationId);
    return { success: true, updated: result.updated, message: "Notification marked as read" };
}

export async function deleteOneNotification(notificationId: number) {
    if (!notificationId)
        throw new Error("Missing notificationId");

    const result = await deleteNotification(notificationId);
    return { success: true, message: "Notification deleted" };
}