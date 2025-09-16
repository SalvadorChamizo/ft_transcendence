import { FastifyReply, FastifyRequest } from "fastify";
import * as chatService from "../services/chatService";

export async function sendMessageController(req: FastifyRequest, reply: FastifyReply) {
    const { recipientId, content, messageType } = req.body as { 
        recipientId: number; 
        content: string; 
        messageType?: string 
    };

    try {
        // ALL: Extract userId from JWT token (for now using mock)
        const userId = 1; // This will be extracted from JWT token later
        
        const result = await chatService.sendMessage(userId, recipientId, content, messageType);
        return reply.send(result);
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function getConversationsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        // ALL: Extract userId from JWT token (for now using mock)
        const userId = 1; // This will be extracted from JWT token later
        
        const result = chatService.getConversations(userId);
        return reply.send({ conversations: result });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}

export async function getMessagesController(req: FastifyRequest, reply: FastifyReply) {
    const { userId: otherUserId } = req.params as { userId: string };
    const { limit } = req.query as { limit?: string };

    try {
        // ALL: Extract userId from JWT token (for now using mock)
        const userId = 1; // This will be extracted from JWT token later
        
        const result = chatService.getMessages(
            parseInt(otherUserId), 
            userId, 
            limit ? parseInt(limit) : undefined
        );
        return reply.send({ messages: result });
    } catch (err: any) {
        return reply.code(500).send({ error: err.message });
    }
}

export async function blockUserController(req: FastifyRequest, reply: FastifyReply) {
    const { blockedUserId } = req.body as { blockedUserId: number };

    try {
        // ALL: Extract userId from JWT token (for now using mock)
        const userId = 1; // This will be extracted from JWT token later
        
        const result = chatService.blockUser(userId, blockedUserId);
        return reply.send(result);
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function unblockUserController(req: FastifyRequest, reply: FastifyReply) {
    const { id: blockedUserId } = req.params as { id: string };

    try {
        // ALL: Extract userId from JWT token (for now using mock)
        const userId = 1; // This will be extracted from JWT token later
        
        const result = chatService.unblockUser(userId, parseInt(blockedUserId));
        return reply.send(result);
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}