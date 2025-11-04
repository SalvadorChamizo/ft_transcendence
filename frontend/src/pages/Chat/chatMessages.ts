import { getCurrentUserId } from "./chatUtils";
import { getAccessToken } from "../../state/authState";
import { getActiveConversationId } from "./chatState";
import { UI_MESSAGES } from "./chatConstants";
import { websocketClient, ChatMessage } from "../../services/websocketClient";
import { loadConversationsDebounced } from "./chatConversations";

const apiHost = `${window.location.hostname}`;

const MAX_MESSAGE_LENGTH = 200;

// Typing indicator state
let typingTimeout: ReturnType<typeof setTimeout> | null = null;
let isTyping = false;

/**
 * Sanitiza el texto para evitar inyección de HTML
 */
function sanitizeText(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Display error message in the message result area
 * @param message - Error message to display
 * @param messageResultElement - DOM element to display error in
 */
function showErrorMessage(message: string, messageResultElement: HTMLElement | null) {
    if (messageResultElement) {
        messageResultElement.innerHTML = `<span class="error">❌ ${message}</span>`;
        messageResultElement.className = 'message-result error';
    }
}

/**
 * Display success message in the message result area
 * @param message - Success message to display
 * @param messageResultElement - DOM element to display success in
 */
function showSuccessMessage(message: string, messageResultElement: HTMLElement | null) {
    if (messageResultElement) {
        messageResultElement.innerHTML = `<span class="success">✅ ${message}</span>`;
        messageResultElement.className = 'message-result success';
    }
}

/**
 * Display info message in the message result area
 * @param message - Info message to display
 * @param messageResultElement - DOM element to display info in
 */
function showInfoMessage(message: string, messageResultElement: HTMLElement | null) {
    if (messageResultElement) {
        messageResultElement.innerHTML = message;
        messageResultElement.className = 'message-result';
    }
}

export async function sendMessage(recipientId: number, content: string) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/${recipientId}/messages`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ recipientId, content })
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        // console.error("Failed to send message:", err); // Eliminado para evitar logs en consola
        throw err;
    }
}

export async function getMessages(otherUserId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/${otherUserId}/messages`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

// Definir el handler fuera para poder eliminarlo antes de añadirlo
export const handleMessageFormSubmit = async (e: Event) => {
    e.preventDefault();

    const messageResult = document.getElementById('message-result') as HTMLDivElement;

    const activeConversationId = getActiveConversationId();
    if (!activeConversationId) {
        showErrorMessage(UI_MESSAGES.NO_CONVERSATION_SELECTED, messageResult);
        return;
    }
    const messageContentInput = document.getElementById('message-content') as HTMLInputElement;
    if (!messageContentInput) {
        showErrorMessage(UI_MESSAGES.MESSAGE_INPUT_NOT_FOUND, messageResult);
        return;
    }
    const content = sanitizeText(messageContentInput.value.trim());
    const currentUserId = getCurrentUserId();
    const recipientId = activeConversationId;
    if (!content) {
        showErrorMessage(UI_MESSAGES.ENTER_MESSAGE, messageResult);
        return;
    }
    
    // Validate message length
    if (content.length > MAX_MESSAGE_LENGTH) {
        showErrorMessage(`El mensaje es demasiado largo (máximo ${MAX_MESSAGE_LENGTH} caracteres)`, messageResult);
        return;
    }
    
    try {
        showInfoMessage(UI_MESSAGES.SENDING_MESSAGE, messageResult);
        // Send message via HTTP API (for persistence and WebSocket notification)
        const httpResult = await sendMessage(recipientId, content);
        
        // Add message to UI immediately (sent message)
        const messageToDisplay: ChatMessage = {
            type: 'message',
            userId: getCurrentUserId(),
            recipientId: recipientId,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        addMessageToUI({
            ...messageToDisplay,
            isSent: true
        });
        
        if (messageResult) {
            messageResult.innerHTML = `<span class="success">${UI_MESSAGES.MESSAGE_SENT_SUCCESS}</span>`;
            messageResult.className = 'message-result success';
        }
        // Auto-refresh conversations list after sending message
        loadConversationsDebounced();
        // Clear form
        messageContentInput.value = '';
    } catch (error) {
        // console.error('Error sending message:', error); // Eliminado para evitar logs en consola
        let errorMsg = '❌ Error sending message';
        if (error instanceof Error && error.message.includes('400')) {
            errorMsg = 'No puedes enviar mensajes a este usuario porque está bloqueado.';
        }
        if (messageResult) {
            messageResult.innerHTML = `<span class=\"error\">${errorMsg}</span>`;
            messageResult.className = 'message-result error';
        }
    }
};

export function addMessageToUI(message: ChatMessage & { isSent: boolean }) {
    const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;
    if (!messagesContainer) return;

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Create message bubble
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${message.isSent ? 'message-sent' : 'message-received'}`;
        
    const time = new Date(message.timestamp || Date.now()).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
        
    // Detect if this new message is a pong invitation (WS payload may include data)
    const isInvite = (message.data && message.data.event_type === 'game_invitation_message' && message.data.room_id) || message.type === 'game_invitation' || (message as any).messageType === 'pong-invite';
    if (isInvite) {
        const room = (message.data && message.data.room_id) || ((message.content && (message.content.match(/<b>([^<]+)<\/b>/) || [])[1])) || '';
        messageDiv.innerHTML = `
            <div class="message-content">
                🎮 Invitación a Pong<br>
                <b>Sala:</b> <span class="room-id">${room}</span><br>
                <button class="join-remote-pong-btn" data-room="${room}">Entrar a la partida</button>
            </div>
            <div class="message-time">${time}</div>
        `;
        // Attach click handler
        const btn = messageDiv.querySelector('.join-remote-pong-btn') as HTMLElement | null;
        if (btn) {
            btn.addEventListener('click', (e) => {
                const roomId = (e.currentTarget as HTMLElement).getAttribute('data-room');
                if (roomId) window.location.hash = `#/private-remote-pong?room=${roomId}`;
            });
        }
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${time}</div>
        `;
    }
        
    messagesContainer.appendChild(messageDiv);
        
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function displayMessages(messages: any[]) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer)
        return;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '';
        return;
    }
        
    const currentUserId = getCurrentUserId();
        
    messagesContainer.innerHTML = messages.map(msg => {
        // Show sent/received based on current user ID
        const isSent = msg.sender_id === currentUserId || msg.userId === currentUserId || msg.recipientId === currentUserId || msg.isSent;
        // Detect if message is a pong invitation
        const isPongInvite = (msg.data && msg.data.event_type === 'game_invitation_message' && msg.data.room_id)
            || msg.message_type === 'pong-invite'
            || (msg.data && msg.data.room_id);
        // Detect friend invitation
        const isFriendInvite = (msg.data && msg.data.event_type === 'friend_invitation_message')
            || msg.message_type === 'friend-invite';
        let messageHtml = '';
        if (isPongInvite) {
            const room = (msg.data && msg.data.room_id) || (msg.content && (msg.content.match(/<b>([^<]+)<\/b>/) || [])[1]) || '';
            // Render pong invitation message
            messageHtml = `
                <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'} pong-invite">
                    <div class="message-content">
                        ${msg.content}
                        <br>
                        <button class="join-remote-pong-btn" data-room="${room}">Entrar a la partida</button>
                    </div>
                    <div class="message-time">${new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        } else if (isFriendInvite) {
            // Render pong invitation message
            messageHtml = `
                <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'} pong-invite">
                    <div class="message-content">
                        ${msg.content}
                        <br>
                        <button class='join-remote-pong-btn accept-friend-btn'>Add friend</button>
                        <button class='join-remote-pong-btn reject-friend-btn'>Reject</button>
                    </div>
                    <div class="message-time">${new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
    } else {
            messageHtml = `
                <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'}">
                    <div class="message-content">${msg.content}</div>
                    <div class="message-time">${new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        }
        return messageHtml;
    }).join('');
    // Add event listeners for join pong buttons
    setTimeout(() => {
        document.querySelectorAll('.join-remote-pong-btn').forEach(btn => {
            // Remove existing to avoid duplicate listeners
            const newBtn = btn.cloneNode(true) as HTMLElement;
            btn.parentElement?.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                const roomId = (e.currentTarget as HTMLElement).getAttribute('data-room');
                if (roomId) {
                    // Navigate to private remote pong with room query param
                    window.location.hash = `#/private-remote-pong?room=${roomId}`;
                }
            });
        });
    }, 0);
    const acceptFriendBtn = document.getElementById('accept-friend-btn') as HTMLButtonElement;

    if (acceptFriendBtn) {
        acceptFriendBtn.addEventListener('click', async () => {
            alert("Lo pilla");
        })
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to show/hide message input based on conversation selection
export function updateMessageInputVisibility() {
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    
    const activeConversationId = getActiveConversationId();
    if (activeConversationId) {
        if (messageForm) messageForm.style.display = 'flex';
    } else {
        if (messageForm) messageForm.style.display = 'none';
    }
}

/**
 * Handle typing indicator - send typing event when user starts typing
 */
function handleTyping() {
    const activeConversationId = getActiveConversationId();
    if (!activeConversationId || !websocketClient.isConnected()) {
        return;
    }

    // Send "typing" event if not already typing
    if (!isTyping) {
        isTyping = true;
        websocketClient.sendMessage({
            type: 'typing',
            userId: getCurrentUserId(),
            recipientId: activeConversationId,
            conversationId: activeConversationId
        });
    }

    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Set timeout to send "stop_typing" after 1 second of no typing
    typingTimeout = setTimeout(() => {
        isTyping = false;
        websocketClient.sendMessage({
            type: 'stop_typing',
            userId: getCurrentUserId(),
            recipientId: activeConversationId,
            conversationId: activeConversationId
        });
    }, 1000);
}

/**
 * Setup typing indicator on message input
 */
export function setupTypingIndicator() {
    const messageContentInput = document.getElementById('message-content') as HTMLInputElement;
    
    if (messageContentInput) {
        // Remove existing listener to avoid duplicates
        messageContentInput.removeEventListener('input', handleTyping);
        // Add typing event listener
        messageContentInput.addEventListener('input', handleTyping);
    }
}