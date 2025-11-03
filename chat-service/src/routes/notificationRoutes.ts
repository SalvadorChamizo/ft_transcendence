import { FastifyInstance } from "fastify";
import { sendNotificationController,
         getNotificationsController,
         updateNotificationsController,
         getSpecificNotificationController,
         updateOneNotificationController,
         deleteOneNotificationController,
        } from "../controllers/notificationsController";

export async function notificationsRoutes(fastify: FastifyInstance) {
    // POST /conversations/:userId/messages - Send notification
    fastify.post('/conversations/:userId/notify', sendNotificationController);
    
    // GET /conversations/notifications - Get all notifications from the user
    fastify.get('/conversations/notifications', getNotificationsController);

    fastify.get('/conversations/:notId/notification', getSpecificNotificationController);

    // GET /conversations - Get all notifications from the user
    fastify.get('/conversations/notifications/update', updateNotificationsController);

    fastify.get('/conversations/:notId/read', updateOneNotificationController);

    fastify.delete('/conversations/:notId/notifyDelete', deleteOneNotificationController);
}
