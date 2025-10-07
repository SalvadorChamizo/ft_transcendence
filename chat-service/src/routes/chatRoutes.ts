import { FastifyInstance } from "fastify";
import * as chatController from "../controllers/chatController";

export async function chatRoutes(fastify: FastifyInstance) {
    // POST /conversations/:userId/messages - Send message
    fastify.post('/conversations/:userId/messages', chatController.sendMessageController);
    
    // GET /conversations - Get all conversations from the user
    fastify.get('/conversations', chatController.getConversationsController);
    
    // GET /conversations/:userId/messages - Retrieve messages from a conversation
    fastify.get('/conversations/:userId/messages', chatController.getMessagesController);
    
    // POST /conversations/:userId/block - Block user
    fastify.post('/conversations/:userId/block', chatController.blockUserController);
    
    // DELETE /conversations/:userId/block - Unlock user
    fastify.delete('/conversations/:userId/block', chatController.unblockUserController);
}
