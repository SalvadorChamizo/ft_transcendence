// WebSocket client for real-time chat functionality
import { getAccessToken } from '../state/authState';

const apiHost = window.location.hostname;

export interface ChatMessage {
    type: 'message' | 'user_connected' | 'user_disconnected' | 'typing' | 'stop_typing' | 'game_invitation';
    userId: number;
    conversationId?: number;
    content?: string;
    timestamp?: string;
    recipientId?: number;
    data?: any;
}

export type MessageHandler = (message: ChatMessage) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private userId: number | null = null;
    private messageHandlers: MessageHandler[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // 1 second

    constructor() {
        console.log('WebSocketClient initialized');
    }

    // Connect to WebSocket server
    connect(userId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                console.log('WebSocket already connected');
                resolve();
                return;
            }

            // Clear any existing message handlers to prevent duplicates
            this.messageHandlers = [];

            this.userId = userId;
            
            // Get token from auth state
            const token = getAccessToken();
            if (!token) {
                console.error('❌ No authentication token available for WebSocket');
                reject(new Error('No authentication token'));
                return;
            }

            const wsUrl = `ws://${apiHost}:8080/ws?userId=${userId}&token=${encodeURIComponent(token)}`;
            
            console.log(`Connecting to WebSocket with authenticated token`);
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected successfully');
                this.reconnectAttempts = 0;
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: ChatMessage = JSON.parse(event.data);
                    console.log('📨 Received WebSocket message:', message);
                    
                    // Notify all message handlers
                    this.messageHandlers.forEach(handler => handler(message));
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket connection closed:', event.code, event.reason);
                this.ws = null;
                
                // Attempt to reconnect if it wasn't a manual close
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                reject(error);
            };
        });
    }

    // Send message through WebSocket
    sendMessage(message: ChatMessage): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected. Cannot send message:', message);
            return false;
        }

        try {
            const messageWithUserId = { ...message, userId: this.userId };
            // Wrap message in expected format: {type, payload}
            const wrappedMessage = {
                type: message.type,
                payload: messageWithUserId
            };
            this.ws.send(JSON.stringify(wrappedMessage));
            console.log('📤 Sent WebSocket message:', wrappedMessage);
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }

    // Add message handler
    onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    // Remove message handler
    removeMessageHandler(handler: MessageHandler): void {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    // Disconnect WebSocket
    disconnect(): void {
        if (this.ws) {
            console.log('🔌 Disconnecting WebSocket...');
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
        this.messageHandlers = [];
    }

    // Get connection status
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // Get current user ID
    getCurrentUserId(): number | null {
        return this.userId;
    }

    // Private method to attempt reconnection
    private attemptReconnect(): void {
        if (this.userId === null) return;

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
        
        setTimeout(() => {
            if (this.userId !== null) {
                this.connect(this.userId).catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, delay);
    }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();