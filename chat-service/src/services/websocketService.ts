import { WebSocket } from '@fastify/websocket';

// WebSocket ready states (standard values)
const WebSocketState = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
} as const;

// Types for WebSocket messages
interface WebSocketMessage {
    type: 'message' | 'user_connected' | 'user_disconnected' | 'typing' | 'stop_typing' | 'identify' | 'message_delivered' | 'message_read';
    userId: number;
    conversationId?: number;
    content?: string;
    timestamp?: string;
    recipientId?: number;
    messageId?: number;
    data?: any;
}

// Type for user connection
interface UserConnection {
    userId: number;
    websocket: WebSocket;
    lastActivity: Date;
}

// Global state for WebSocket connections
const connectedUsers = new Map<number, UserConnection>();

// Map for tracking typing status: "conversationId-userId" -> timestamp
const typingUsers = new Map<string, number>();

// Connection Management Functions
export function addUserConnection(userId: number, websocket: WebSocket): void {
    const connection: UserConnection = {
        userId,
        websocket,
        lastActivity: new Date()
    };
    
    connectedUsers.set(userId, connection);
    console.log(`User ${userId} connected. Total connections: ${connectedUsers.size}`);
    
    // Notify other users that this user connected
    notifyUserConnected(userId);
}

export function removeUserConnection(userId: number): void {
    const connection = connectedUsers.get(userId);
    if (connection) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected. Total connections: ${connectedUsers.size}`);
        
        // Clean up typing status
        cleanupUserTyping(userId);
        
        // Notify other users that this user disconnected
        notifyUserDisconnected(userId);
    }
}

export function getUserConnection(userId: number): UserConnection | undefined {
    return connectedUsers.get(userId);
}

export function getConnectedUsers(): number[] {
    return Array.from(connectedUsers.keys());
}

// Message Sending Functions
export function sendToUser(userId: number, message: WebSocketMessage): boolean {
    try {
        const connection = connectedUsers.get(userId);
        if (connection && connection.websocket.readyState === WebSocket.OPEN) {
            connection.websocket.send(JSON.stringify(message));
            connection.lastActivity = new Date();
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
        // Remove dead connection
        removeUserConnection(userId);
        return false;
    }
}

export function sendToConversation(userId1: number, userId2: number, message: WebSocketMessage): void {
    // Send to both participants in the conversation
    sendToUser(userId1, message);
    sendToUser(userId2, message);
}

export function broadcastToAll(message: WebSocketMessage, excludeUserId?: number): void {
    connectedUsers.forEach((connection, userId) => {
        if (excludeUserId && userId === excludeUserId) {
            return; // Skip excluded user
        }
        sendToUser(userId, message);
    });
}

// Chat-specific Functions
export function notifyNewMessage(fromUserId: number, toUserId: number, messageData: any): void {
    const message: WebSocketMessage = {
        type: 'message',
        userId: fromUserId,
        recipientId: toUserId,
        content: messageData.content,
        timestamp: new Date().toISOString(),
        conversationId: messageData.conversation_id
    };
    
    // Send to recipient only (sender will see it in their UI)
    sendToUser(toUserId, message);
}

export function notifyUserTyping(fromUserId: number, toUserId: number, conversationId: number): void {
    const typingKey = `${conversationId}-${fromUserId}`;
    typingUsers.set(typingKey, Date.now());
    
    const message: WebSocketMessage = {
        type: 'typing',
        userId: fromUserId,
        conversationId,
        timestamp: new Date().toISOString()
    };
    
    sendToUser(toUserId, message);
}

export function notifyUserStoppedTyping(fromUserId: number, toUserId: number, conversationId: number): void {
    const typingKey = `${conversationId}-${fromUserId}`;
    typingUsers.delete(typingKey);
    
    const message: WebSocketMessage = {
        type: 'stop_typing',
        userId: fromUserId,
        conversationId,
        timestamp: new Date().toISOString()
    };
    
    sendToUser(toUserId, message);
}

export function notifyMessageDelivered(messageId: number, toUserId: number): void {
    const message: WebSocketMessage = {
        type: 'message_delivered',
        userId: toUserId,
        messageId,
        timestamp: new Date().toISOString()
    };
    
    // Notify the sender that their message was delivered
    sendToUser(toUserId, message);
}

export function notifyMessageRead(messageId: number, toUserId: number): void {
    const message: WebSocketMessage = {
        type: 'message_read',
        userId: toUserId,
        messageId,
        timestamp: new Date().toISOString()
    };
    
    // Notify the sender that their message was read
    sendToUser(toUserId, message);
}

export function notifyUserConnected(userId: number): void {
    const message: WebSocketMessage = {
        type: 'user_connected',
        userId,
        timestamp: new Date().toISOString()
    };
    
    // Notify all other connected users
    broadcastToAll(message, userId);
}

export function notifyUserDisconnected(userId: number): void {
    const message: WebSocketMessage = {
        type: 'user_disconnected',
        userId,
        timestamp: new Date().toISOString()
    };
    
    // Notify all other connected users
    broadcastToAll(message, userId);
}

// Helper Functions
function cleanupUserTyping(userId: number): void {
    // Remove all typing status for this user
    const keysToDelete: string[] = [];
    typingUsers.forEach((timestamp, key) => {
        if (key.endsWith(`-${userId}`)) {
            keysToDelete.push(key);
        }
    });
    
    keysToDelete.forEach(key => {
        typingUsers.delete(key);
    });
}

// WebSocket Event Handlers
export function handleWebSocketConnection(websocket: WebSocket): void {
    console.log('New WebSocket connection established');
    
    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
        type: 'user_connected',
        userId: 0, // System message
        content: 'Please identify yourself by sending {"type": "identify", "userId": YOUR_USER_ID}',
        timestamp: new Date().toISOString()
    };
    
    try {
        websocket.send(JSON.stringify(welcomeMessage));
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

export function handleWebSocketMessage(websocket: WebSocket, messageData: string): void {
    try {
        const message: WebSocketMessage = JSON.parse(messageData);
        
        switch (message.type) {
            case 'identify':
                // User identifying themselves
                if (message.userId) {
                    addUserConnection(message.userId, websocket);
                }
                break;
                
            case 'typing':
                // User started typing
                if (message.userId && message.recipientId && message.conversationId) {
                    notifyUserTyping(message.userId, message.recipientId, message.conversationId);
                }
                break;
                
            case 'stop_typing':
                // User stopped typing
                if (message.userId && message.recipientId && message.conversationId) {
                    notifyUserStoppedTyping(message.userId, message.recipientId, message.conversationId);
                }
                break;
                
            case 'message_delivered':
                // User received message - mark as delivered
                if (message.messageId && message.userId) {
                    import('../repositories/messageRepository.js').then(repo => {
                        repo.markMessageAsDelivered(message.messageId!);
                        // Notify sender that message was delivered
                        if (message.recipientId) {
                            notifyMessageDelivered(message.messageId!, message.recipientId);
                        }
                    });
                }
                break;
                
            case 'message_read':
                // User read message - mark as read
                if (message.conversationId && message.userId) {
                    import('../repositories/messageRepository.js').then(repo => {
                        repo.markMessagesAsRead(message.conversationId!, message.userId);
                        // Notify sender that message was read
                        if (message.recipientId && message.messageId) {
                            notifyMessageRead(message.messageId, message.recipientId);
                        }
                    });
                }
                break;
                
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}

export function handleWebSocketDisconnection(websocket: WebSocket): void {
    // Find and remove the disconnected user
    let disconnectedUserId: number | null = null;
    
    connectedUsers.forEach((connection, userId) => {
        if (connection.websocket === websocket) {
            disconnectedUserId = userId;
        }
    });
    
    if (disconnectedUserId) {
        removeUserConnection(disconnectedUserId);
    }
}

// Game Invitation Functions
export function notifyGameInvitation(toUserId: number, invitationData: any): void {
    const message: WebSocketMessage = {
        type: 'message' as any, // Will be extended
        userId: invitationData.from_user_id,
        data: {
            ...invitationData,
            event_type: 'game_invitation_received'
        }
    };
    
    const sent = sendToUser(toUserId, message);
    if (!sent) {
        console.log(`User ${toUserId} not connected - invitation will be available when they connect`);
    }
}

export function notifyGameInvitationAccepted(fromUserId: number, acceptanceData: any): void {
    const message: WebSocketMessage = {
        type: 'message' as any,
        userId: acceptanceData.to_user_id,
        data: {
            ...acceptanceData,
            event_type: 'game_invitation_accepted'
        }
    };
    
    const sent = sendToUser(fromUserId, message);
    if (!sent) {
        console.log(`User ${fromUserId} not connected - acceptance notification lost`);
    }
}

export function notifyGameInvitationRejected(fromUserId: number, rejectionData: any): void {
    const message: WebSocketMessage = {
        type: 'message' as any,
        userId: rejectionData.to_user_id,
        data: {
            ...rejectionData,
            event_type: 'game_invitation_rejected'
        }
    };
    
    const sent = sendToUser(fromUserId, message);
    if (!sent) {
        console.log(`User ${fromUserId} not connected - rejection notification lost`);
    }
}

// Cleanup function for periodic maintenance
export function cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    connectedUsers.forEach((connection, userId) => {
        if (now - connection.lastActivity.getTime() > staleThreshold) {
            if (connection.websocket.readyState !== WebSocket.OPEN) {
                removeUserConnection(userId);
            }
        }
    });
}

// Auto-cleanup every 5 minutes
setInterval(cleanupStaleConnections, 5 * 60 * 1000);