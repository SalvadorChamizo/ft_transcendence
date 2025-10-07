import { FastifyReply, FastifyRequest } from "fastify";
import * as chatService from "../services/chatService";
import { extractUserId } from "../utils/auth";

export async function sendMessageController(req: FastifyRequest, reply: FastifyReply) {
    const { recipientId, content, messageType } = req.body as { 
        recipientId: number; 
        content: string; 
        messageType?: string 
    };

    try {
        const userId = extractUserId(req.headers);
        
        const result = await chatService.sendMessage(userId, recipientId, content, messageType);
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}

export async function getConversationsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = extractUserId(req.headers);
        
        const result = chatService.getConversations(userId);
        return reply.send({ conversations: result });
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(500).send({ error: err.message });
    }
}

export async function getMessagesController(req: FastifyRequest, reply: FastifyReply) {
    const { userId: otherUserId } = req.params as { userId: string };
    const { limit } = req.query as { limit?: string };

    try {
        const userId = extractUserId(req.headers);
        
        const result = chatService.getMessages(
            parseInt(otherUserId), 
            userId, 
            limit ? parseInt(limit) : undefined
        );
        return reply.send({ messages: result });
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(500).send({ error: err.message });
    }
}

export async function blockUserController(req: FastifyRequest, reply: FastifyReply) {
    const { userId: blockedUserId } = req.params as { userId: string };

    try {
        const userId = extractUserId(req.headers);
        
        const result = chatService.blockUser(userId, parseInt(blockedUserId));
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}

export async function unblockUserController(req: FastifyRequest, reply: FastifyReply) {
    const { id: blockedUserId } = req.params as { id: string };

    try {
        const userId = extractUserId(req.headers);
        
        const result = chatService.unblockUser(userId, parseInt(blockedUserId));
        return reply.send(result);
    } catch (err: any) {
        if (err.message === 'User not authenticated') {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
        return reply.code(400).send({ error: err.message });
    }
}