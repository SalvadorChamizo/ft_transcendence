import { FastifyInstance } from "fastify";
import * as gameInvitationController from "../controllers/gameInvitationController";

export async function gameInvitationRoutes(fastify: FastifyInstance) {
    // POST /game-invitations/send - Send game invitation
    fastify.post('/game-invitations/send', gameInvitationController.sendGameInvitationController);
    
    // GET /game-invitations/received - Get pending invitations received
    fastify.get('/game-invitations/received', gameInvitationController.getPendingInvitationsController);
    
    // GET /game-invitations/sent - Get sent invitations
    fastify.get('/game-invitations/sent', gameInvitationController.getSentInvitationsController);
    
    // POST /game-invitations/:id/accept - Accept game invitation
    fastify.post('/game-invitations/:id/accept', gameInvitationController.acceptGameInvitationController);
    
    // POST /game-invitations/:id/reject - Reject game invitation
    fastify.post('/game-invitations/:id/reject', gameInvitationController.rejectGameInvitationController);
}
