import { getCurrentUserId, loadAllUsers, updateConnectionStatus } from "./chatUtils"
import { websocketClient, ChatMessage } from "../../services/websocketClient";
import { addMessageToUI } from "./chatMessages";
import { loadConversationsDebounced } from "./chatConversations";
import { getConnectedUsersSet, getActiveConversationId } from "./chatState";
import { handleUserSearch } from "./chatUserSearch";

// Store handler reference to avoid duplicates
let chatMessageHandler: ((message: ChatMessage) => void) | null = null;

function handleIncomingMessage(message: ChatMessage) {
    
    try {
        if (message.type === 'message' && message.data && message.data.event_type === 'game_invitation_accepted') {
            // If acceptance contains a room_id, redirect to private remote pong
            const room = message.data.room_id || message.data.roomId || null;
            if (room) {
                try {
                    // Store pending id (optional) and navigate
                    localStorage.setItem('pendingRemoteRoomId', String(room));
                } catch (e) {
                }
                window.location.hash = `#/private-remote-pong?room=${room}`;
                return;
            }
        }
    } catch (e) {
    }

     if (message.type === 'user_connected') {
        if (message.userId) {
            getConnectedUsersSet().add(message.userId);
            updateActiveContactStatus();
            updateUserSearchModalStatus();
        }
    } else if (message.type === 'user_disconnected') {
        if (message.userId) {
            getConnectedUsersSet().delete(message.userId);
            updateActiveContactStatus();
            updateUserSearchModalStatus();
        }
        } else if (message.type === 'connected_users_list') {
            getConnectedUsersSet().clear();
        if (Array.isArray(message.data)) {
            message.data.forEach((userId: number) => getConnectedUsersSet().add(userId));
        }
        updateActiveContactStatus();
        updateUserSearchModalStatus();
    } else if (message.type === 'user_deleted') {
            // A user was deleted - refresh conversations automatically
        loadConversationsDebounced();

        // If we're currently viewing the deleted user's conversation, clear it
        const activeConversationId = getActiveConversationId();
        if (activeConversationId === message.userId) {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '<div class="welcome-message">This user has been deleted.</div>';
            }
            const contactName = document.getElementById('contact-name');
            if (contactName) contactName.textContent = 'Deleted User';
        }
    }
    
    if (message.type === 'message') {
        const activeConversationId = getActiveConversationId();
        
        if (activeConversationId && (message.userId === activeConversationId || message.recipientId === activeConversationId)) {
            let sendByUser;
            if (message.userId === activeConversationId)
                sendByUser = false;
            else
                sendByUser = true;
            addMessageToUI({
                ...message,
                isSent: sendByUser
            });
        } else {
        }
        loadConversationsDebounced();
    } else if (message.type === 'typing') {
        // Show typing indicator
        const activeConversationId = getActiveConversationId();
        if (activeConversationId && message.userId === activeConversationId) {
            showTypingIndicator(true);
        }
    } else if (message.type === 'stop_typing') {
        // Hide typing indicator
        const activeConversationId = getActiveConversationId();
        if (activeConversationId && message.userId === activeConversationId) {
            showTypingIndicator(false);
        }
    }
}

/**
 * Show or hide typing indicator in the chat UI
 */
function showTypingIndicator(show: boolean) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;

    // Remove existing typing indicator if present
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    if (show) {
        // Create and add typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-bubble">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        
        // Auto-scroll to bottom
        try {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (err: any) {

        }
    }
}

export async function initializeWebSocket() {
    try {
        const userId = getCurrentUserId();
        
        // Don't reconnect if already connected (main.ts already handles this)
        if (!websocketClient.isConnected()) {
            await websocketClient.connect(userId);
        } else {
        }
        
        // Remove old handler if exists to avoid duplicates
        if (chatMessageHandler) {
            websocketClient.removeMessageHandler(chatMessageHandler);
        }
        
        // Create and store new handler
        chatMessageHandler = (message: ChatMessage) => {
            handleIncomingMessage(message);
        };
        
        // Set up message handler for incoming messages
        websocketClient.onMessage(chatMessageHandler);
        
        // Update connection status in UI
        updateConnectionStatus(true);
            
    } catch (error) {
        updateConnectionStatus(false);
    }
}

/**
 * Cleanup WebSocket handlers when leaving chat page
 */
export function cleanupWebSocket() {
    if (chatMessageHandler) {
        websocketClient.removeMessageHandler(chatMessageHandler);
        chatMessageHandler = null;
    }
}

async function updateUserSearchModalStatus() {
    const modal = document.getElementById('new-chat-modal');
    if (modal && modal.style.display !== 'none') {
        const searchInput = document.getElementById('user-search') as HTMLInputElement;
        const query = searchInput ? searchInput.value.trim() : '';
        if (query) {
            await handleUserSearch(query);
        } else {
            await loadAllUsers();
        }
    }
}

// Function to update the active contact's status
function updateActiveContactStatus() {
    const activeConversationId = getActiveConversationId();
    
    if (activeConversationId != null) {
        const contactStatus = document.getElementById('contact-status');
        const isOnline = getConnectedUsersSet().has(activeConversationId);
        
        if (contactStatus) {
            if (isOnline) {
                contactStatus.textContent = 'Online';
                contactStatus.style.color = '#25D366';
            } else {
                contactStatus.textContent = 'Offline';
                contactStatus.style.color = '#ff4444';
            }
        } else {
        }
    } else {
    }
}