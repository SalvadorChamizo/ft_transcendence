import { FastifyInstance } from "fastify";
import { inviteFriendController,
         acceptFriendInvitationController,
         rejectFriendInvitationController,
        } from "../controllers/friendInvitationController";

export async function friendInvitationRoutes(fastify: FastifyInstance) {

    fastify.post('/conversations/:otherUserId/invite-friend', inviteFriendController);

    // POST /game-invitations/:id/accept - Accept game invitation
    fastify.post('/conversations/:otherUserId/accept-friend', acceptFriendInvitationController);
    
    // POST /game-invitations/:id/reject - Reject game invitation
    //fastify.post('/conversations/:otherUserId/reject-friend', rejectFriendInvitationController);
    // GET /conversations/notifications - Get all notifications from the user
    //fastify.get('/conversations/:userId/check-invitation', checkInviteFriendController);

    //fastify.get('/conversations/:notId/notification', getSpecificNotificationController);

    // GET /conversations - Get all notifications from the user
    //fastify.get('/conversations/notifications/update', updateNotificationsController);

    //fastify.get('/conversations/:notId/read', updateOneNotificationController);

    //fastify.delete('/conversations/:notId/notifyDelete', deleteOneNotificationController);
}
