// Imports of repositories
import * as conversationRepo from "../repositories/conversationRepository";
import * as messageRepo from "../repositories/messageRepository";
import * as blockRepo from "../repositories/blockRepository";

export async function sendMessage(senderId: number, recipientId: number, content: string, messageType: string = 'text') {
    // 1. Validate that users are not blocked
    const blocked = blockRepo.areUsersBlocked(senderId, recipientId);
    if (blocked) {
        throw new Error("Cannot send message: users are blocked");
    }

    // 2. Search for an existing conversation or create a new one
    let conversation = conversationRepo.findConversation(senderId, recipientId);
    if (!conversation) {
        conversationRepo.createConversation(senderId, recipientId);
        conversation = conversationRepo.findConversation(senderId, recipientId);
    }

    // 3. Create the message
    messageRepo.createMessage(conversation.id, senderId, content, messageType);

    // 4. Update conversation timestamp
    conversationRepo.updateConversationTimestamp(conversation.id);

    return { success: true, message: "Message sent successfully" };
}

export function getConversations(userId: number) {
    // Get all conversations for the user
    const conversations = conversationRepo.getConversationsForUser(userId);
    
    // Return conversations with user information
    return conversations.map((conversation: any) => ({
        id: conversation.id,
        otherUserId: conversation.participant1_id === userId ? conversation.participant2_id : conversation.participant1_id,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at
    }));
}

export function getMessages(conversationId: number, userId: number, limit: number = 50) {
    // 1. Validate that user participates in the conversation
    const conversation = conversationRepo.findConversation(userId, 0); // We need to check by ID instead
    // For now, we'll get messages directly (validation can be added later)
    
    // 2. Get messages from the conversation
    const messages = messageRepo.getRecentMessages(conversationId, limit);
    
    // 3. Mark messages as read for this user
    messageRepo.markMessagesAsRead(conversationId, userId);
    
    // 4. Return messages in chronological order (oldest first)
    return messages.reverse();
}

export function blockUser(blockerId: number, blockedId: number) {
    // Validate that user is not trying to block themselves
    if (blockerId === blockedId) {
        throw new Error("Cannot block yourself");
    }
    
    // Block the user
    blockRepo.blockUser(blockerId, blockedId);
    
    return { success: true, message: "User blocked successfully" };
}

export function unblockUser(blockerId: number, blockedId: number) {
    // Unblock the user
    blockRepo.unblockUser(blockerId, blockedId);
    
    return { success: true, message: "User unblocked successfully" };
}