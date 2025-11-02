import { FastifyRequest, FastifyReply } from "fastify";
import { sendNotification,
         getUserNotifications, 
         markUserNotificationsAsRead} 
         from "../services/notificationServices";
import db from "../db/sqlite"

export async function sendNotificationController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.params as { userId: string };
    const { content, message_type = "text", title = null } = req.body as {
        content: string;
        message_type?: string;
        title?: string | null;
    };

    try {
        const result = await sendNotification(Number(userId), title, content, message_type);

        return reply.code(201).send(result);
    } catch (err: any) {
        console.error(err);
        return reply.code(200).send({ success: false, error: "Failed to create notification" });
    }
}

export async function getNotificationsController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];

    if (!userId)
        return reply.code(200).send({ success: false, error: "Missing userId" });

    try {
        const notifications = await getUserNotifications(userId);

        return reply.send(notifications);
    } catch (err: any) {
        return reply.code(200).send({ success: false, error: "Failed to fetch notifications" });
    }
}

export async function updateNotificationsController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.body as { userId: number };

    if (!userId)
        return reply.code(200).send({ success: false, error: "Missing userID" });

    try {
        const result = await markUserNotificationsAsRead(userId);

        return reply.send(result);
    } catch (err: any) {
        console.error(err);
        return reply.code(200).send({ success: false, error: "Failed to update notifications" });
    }
}