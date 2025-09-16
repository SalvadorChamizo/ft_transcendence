// Imports of repositories
import * as conversationRepo from "../repositories/conversationRepository";
import * as messageRepo from "../repositories/messageRepository";
import * as blockRepo from "../repositories/blockRepository";
import * as websocketService from "./websocketService";

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

    // 5. Send real-time notification via WebSocket if recipient is connected
    try {
        const messageData = {
            conversation_id: conversation.id,
            sender_id: senderId,
            content: content,
            message_type: messageType || 'text',
            timestamp: new Date().toISOString()
        };
        
        websocketService.notifyNewMessage(senderId, recipientId, messageData);
        console.log(`WebSocket notification sent to user ${recipientId} from user ${senderId}`);
    } catch (wsError) {
        // Don't fail the HTTP request if WebSocket notification fails
        console.warn(`Failed to send WebSocket notification to user ${recipientId}:`, wsError);
    }

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

export function getMessages(otherUserId: number, userId: number, limit: number = 50) {
    // 1. Find the conversation between the two users
    const conversation = conversationRepo.findConversation(userId, otherUserId);
    if (!conversation) {
        return []; // No conversation exists yet
    }
    
    // 2. Get messages from the conversation
    const messages = messageRepo.getRecentMessages(conversation.id, limit);
    
    // 3. Mark messages as read for this user
    messageRepo.markMessagesAsRead(conversation.id, userId);
    
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