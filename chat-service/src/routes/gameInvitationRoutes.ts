import { FastifyInstance } from "fastify";
import * as gameInvitationController from "../controllers/gameInvitationController";

export async function gameInvitationRoutes(fastify: FastifyInstance) {
    // POST /game-invitations - Send game invitation
    fastify.post('/game-invitations', gameInvitationController.sendGameInvitationController);
    
    // GET /game-invitations/received - Get pending invitations received
    fastify.get('/game-invitations/received', gameInvitationController.getPendingInvitationsController);
    
    // GET /game-invitations/sent - Get sent invitations
    fastify.get('/game-invitations/sent', gameInvitationController.getSentInvitationsController);
    
    // PUT /game-invitations/:id/accept - Accept game invitation
    fastify.put('/game-invitations/:id/accept', gameInvitationController.acceptGameInvitationController);
    
    // PUT /game-invitations/:id/reject - Reject game invitation
    fastify.put('/game-invitations/:id/reject', gameInvitationController.rejectGameInvitationController);
}
