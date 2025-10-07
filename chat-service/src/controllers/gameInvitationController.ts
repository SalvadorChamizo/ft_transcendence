import { FastifyReply, FastifyRequest } from "fastify";
import * as gameInvitationService from "../services/gameInvitationService";
import { extractUserId } from "../utils/auth";

export async function sendGameInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { toUserId, gameType } = req.body as { 
        toUserId: number; 
        gameType?: string 
    };

    try {
        const userId = extractUserId(req.headers);
        
        const result = await gameInvitationService.sendGameInvitation(userId, toUserId, gameType);
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}

export async function getPendingInvitationsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = extractUserId(req.headers);
        
        const invitations = gameInvitationService.getPendingInvitations(userId);
        return reply.send({ invitations });
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(500).send({ error: err.message });
    }
}

export async function getSentInvitationsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = extractUserId(req.headers);
        
        const invitations = gameInvitationService.getSentInvitations(userId);
        return reply.send({ invitations });
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(500).send({ error: err.message });
    }
}

export async function acceptGameInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    try {
        const userId = extractUserId(req.headers);
        
        const result = await gameInvitationService.acceptGameInvitation(parseInt(id), userId);
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}

export async function rejectGameInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };

    try {
        const userId = extractUserId(req.headers);
        
        const result = await gameInvitationService.rejectGameInvitation(parseInt(id), userId);
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}
