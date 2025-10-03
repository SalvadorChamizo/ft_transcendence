import { FastifyInstance } from "fastify";
import * as chatController from "../controllers/chatController";

export async function chatRoutes(fastify: FastifyInstance) {
    // POST /conversations/:userId/messages - Send message
    fastify.post('/conversations/:userId/messages', chatController.sendMessageController);
    
    // GET /conversations - Get all conversations from the user
    fastify.get('/conversations', chatController.getConversationsController);
    
    // GET /conversations/:userId/messages - Retrieve messages from a conversation
    fastify.get('/conversations/:userId/messages', chatController.getMessagesController);
    
    // POST /users/:userId/block - Block user
    fastify.post('/users/:userId/block', chatController.blockUserController);
    
    // DELETE /users/:userId/block - Unlock user
    fastify.delete('/users/:userId/block', chatController.unblockUserController);
}
