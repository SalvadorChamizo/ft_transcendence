/**
 * ==================== CHAT SYSTEM ====================
 * 
 * Real-time chat interface with the following features:
 * - JWT-based authentication integration
 * - WebSocket real-time messaging
 * - Dynamic user management with online/offline status
 * - Game invitation system
 * - User blocking/unblocking
 * - Conversation management with auto-loading
 * - Comprehensive error handling and user feedback
 * 
 * Architecture:
 * - Uses microservices backend (auth, user-management, chat services)
 * - Implements caching for performance optimization
 * - Real-time updates via WebSocket events
 * - Modern modal-based UI with responsive design
 * 
 * ====================================================
 */

import { getConversations, sendMessage, getMessages, blockUser, unblockUser, sendGameInvitation, getGameInvitations, acceptGameInvitation, rejectGameInvitation, getUserProfile, searchUsersByUsername, getAllUsers } from "../services/api";
import { websocketClient, ChatMessage } from "../services/websocketClient";
import { getUserIdFromToken } from "../state/authState";

// ==================== CONSTANTS ====================
const CHAT_CONFIG = {
    DEBOUNCE_DELAY: 500,
    SEARCH_DEBOUNCE_DELAY: 300,
    MIN_SEARCH_CHARS: 2,
    GAME_REDIRECT_DELAY: 2000,
    USERNAME_LOADING_DELAY: 100
} as const;

const UI_MESSAGES = {
    LOADING: 'Loading...',
    SENDING_MESSAGE: 'Sending message...',
    MESSAGE_SENT_SUCCESS: '✅ Message sent successfully!',
    MESSAGE_SENT_HTTP_ONLY: '✅ Message sent via HTTP (WebSocket offline)',
    NO_CONVERSATION_SELECTED: 'No conversation selected',
    MESSAGE_INPUT_NOT_FOUND: 'Message input not found',
    ENTER_MESSAGE: 'Please enter a message',
    LOADING_CONVERSATIONS: 'Loading conversations...',
    NO_CONVERSATIONS_FOUND: 'No conversations found. Send a message to start chatting!',
    LOADING_MESSAGES: 'Cargando mensajes...',
    ERROR_LOADING_MESSAGES: 'Error cargando mensajes',
    NO_MESSAGES: 'No hay mensajes en esta conversación.',
    SEARCHING_USERS: 'Searching users...',
    LOADING_USERS: 'Loading users...',
    NO_USERS_FOUND: 'No users found',
    NO_OTHER_USERS: 'No other users found',
    TYPE_TO_SEARCH: 'Type at least 2 characters to search...',
    CONNECTED: 'Connected',
    CONNECTING: 'Connecting...',
    DISCONNECTED: 'Disconnected'
} as const;

// ==================== STATE MANAGEMENT ====================
// Active conversation state
let activeConversationId: number | null = null;
let activeConversationName: string = '';
let blockedUsers: Set<number> = new Set(); // Track blocked users

// Caching and performance
const usernameCache: Map<number, string> = new Map();

// Real-time connection tracking
const connectedUsersSet: Set<number> = new Set();

// ==================== UTILITY FUNCTIONS ====================

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

export function Chat(): string {
    return `
        <div class="whatsapp-container">
            <!-- Left sidebar: Conversations list -->
            <div class="conversations-sidebar">
                <div class="sidebar-header">
                    <h2>Chats</h2>
                    <div id="connection-status" class="connection-status">
                        <span class="status-indicator">●</span>
                        <span class="status-text">Connecting...</span>
                    </div>
                </div>
                
                <!-- New Chat Button - Always visible -->
                <div class="new-chat-section">
                    <button id="sidebar-new-chat" class="sidebar-new-chat-btn">
                        <span>+</span> New Chat
                    </button>
                </div>
                
                <!-- Game Invitations Section -->
                <div id="game-invitations-section" style="display: none;">
                    <div class="invitations-header">
                        <h3>🎮 Game Invitations</h3>
                    </div>
                    <div id="game-invitations-list" class="invitations-list">
                        <!-- Invitations will appear here -->
                    </div>
                </div>
                
                <div class="conversations-list" id="conversations-list">
                    <!-- Conversations will be loaded here dynamically -->
                    <div class="no-conversations">
                        <p>Click ↻ to load conversations</p>
                    </div>
                </div>
            </div>

            <!-- Main chat area -->
            <div class="chat-area">
                <!-- Chat header -->
                <div class="chat-header">
                    <div class="contact-info">
                        <div class="contact-avatar">👤</div>
                        <div class="contact-details">
                            <h3 id="contact-name">Select a conversation</h3>
                            <span id="contact-status">Online</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button id="view-profile-btn" class="view-profile-btn" style="display: none;" title="View profile">
                            👤
                        </button>
                        <button id="invite-game-btn" class="invite-game-btn" style="display: none;" title="Invite to play Pong">
                            🎮
                        </button>
                        <button id="block-user-btn" class="block-btn" style="display: none;" title="Block user">
                            🚫
                        </button>
                    </div>
                </div>

                <!-- Messages area -->
                <div class="messages-container" id="messages-container">
                    <div class="welcome-message">
                        <div class="welcome-icon">💬</div>
                        <h3>Welcome to Chat</h3>
                        <p>Select a conversation or start a new one to begin chatting.</p>
                    </div>
                </div>

                <!-- Message input area -->
                <div class="message-input-area">
                    <form id="message-form" class="message-form">
                        <div class="input-with-button">
                            <input 
                                type="text" 
                                id="message-content" 
                                placeholder="Escribe un mensaje..." 
                                class="message-input"
                                required 
                            />
                            <button type="submit" class="send-button">
                                <span>↗</span>
                            </button>
                        </div>
                        <div id="message-result" class="message-result"></div>
                    </form>
                    
                    <!-- New chat modal -->
                    <div id="new-chat-modal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Start New Chat</h3>
                                <button id="close-new-chat-modal" class="close-button">×</button>
                            </div>
                            <div class="modal-body">
                                <input 
                                    type="text" 
                                    id="user-search" 
                                    placeholder="Search users by username..." 
                                    class="user-search-input"
                                />
                                <div id="user-search-results" class="user-search-results"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Modal -->
        <div id="profile-modal" class="profile-modal" style="display: none;">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h2>User Profile</h2>
                    <button id="close-profile-modal" class="close-modal-btn">✕</button>
                </div>
                <div class="profile-modal-body">
                    <div class="profile-avatar-large" id="profile-avatar">?</div>
                    <h3 id="profile-username" class="profile-username">Username</h3>
                    <div class="profile-info">
                        <div class="profile-info-item">
                            <span class="profile-label">User ID:</span>
                            <span id="profile-id" class="profile-value">-</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">Victories:</span>
                            <span id="profile-victories" class="profile-value">-</span>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button id="invite-from-profile-btn" class="profile-action-btn invite-btn">
                            🎮 Invite to Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize all chat handlers and functionality
 * Sets up DOM event listeners, WebSocket connections, and real-time features
 */
export function chatHandlers() {
    // Get essential DOM elements with proper error handling
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    const connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
    const messageResult = document.getElementById('message-result') as HTMLDivElement;
    const conversationsList = document.getElementById('conversations-list') as HTMLDivElement;
    const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;

    // Check essential elements
    if (!conversationsList || !messagesContainer) {
        console.error('Essential chat elements not found in DOM');
        return;
    }

    // Get optional elements (these might not exist initially)
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const inviteGameButton = document.getElementById('invite-game-btn') as HTMLButtonElement;
    const viewProfileButton = document.getElementById('view-profile-btn') as HTMLButtonElement;

    // Debounce timer for conversation loading
        let loadConversationsTimeout: ReturnType<typeof setTimeout> | null = null;

    // Load game invitations on page load
    loadGameInvitations();

    // Initialize WebSocket connection
    initializeWebSocket();

    // Handle message form submission
    messageForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
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

        try {
            showInfoMessage(UI_MESSAGES.SENDING_MESSAGE, messageResult);
            
            // Send message via HTTP API (for persistence)
            const httpResult = await sendMessage(recipientId, content);
            
            // Send message via WebSocket (for real-time delivery)
            const wsMessage: ChatMessage = {
                type: 'message',
                userId: getCurrentUserId(),
                recipientId: recipientId,
                content: content,
                timestamp: new Date().toISOString()
            };
            
            const wsSent = websocketClient.sendMessage(wsMessage);
            
            if (wsSent) {
                if (messageResult) {
                    messageResult.innerHTML = `<span class="success">${UI_MESSAGES.MESSAGE_SENT_SUCCESS}</span>`;
                }
                
                // Add message to UI immediately (sent message)
                addMessageToUI({
                    ...wsMessage,
                    isSent: true
                });
            } else {
                if (messageResult) {
                    messageResult.innerHTML = `<span class="success">${UI_MESSAGES.MESSAGE_SENT_HTTP_ONLY}</span>`;
                }
            }
            
            if (messageResult) {
                messageResult.className = 'message-result success';
            }
            
            // Auto-refresh conversations list after sending message
            loadConversationsDebounced();
            
            // Clear form
            messageContentInput.value = '';
            
            console.log('Message sent:', { http: httpResult, websocket: wsSent });
            
        } catch (error) {
            console.error('Error sending message:', error);
            if (messageResult) {
                messageResult.innerHTML = `<span class="error">❌ Error sending message: ${error}</span>`;
                messageResult.className = 'message-result error';
            }
        }
    });

    /**
     * Debounced conversation loading to prevent excessive API calls
     * Waits for a pause in calls before actually executing
     */
    function loadConversationsDebounced() {
        if (loadConversationsTimeout) {
            clearTimeout(loadConversationsTimeout);
        }
        
        loadConversationsTimeout = setTimeout(() => {
            loadConversationsAuto();
        }, CHAT_CONFIG.DEBOUNCE_DELAY);
    }

    /**
     * Automatically load and display conversations with real usernames
     * Handles loading states and error scenarios
     */
    async function loadConversationsAuto() {
        try {
            conversationsList.innerHTML = `<div class="loading">${UI_MESSAGES.LOADING_CONVERSATIONS}</div>`;
            
            const result = await getConversations();
            
            if (result.conversations && result.conversations.length > 0) {
                // First show loading placeholders
                conversationsList.innerHTML = result.conversations
                    .map((conv: any) => `
                        <div class="conversation-item" data-user-id="${conv.otherUserId}">
                            <div class="conversation-avatar">${conv.otherUserId.toString().slice(-1)}</div>
                            <div class="conversation-info">
                                <div class="conversation-name">${UI_MESSAGES.LOADING}</div>
                                <div class="conversation-preview">Last updated: ${new Date(conv.updatedAt).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('');

                // Then load usernames asynchronously
                result.conversations.forEach(async (conv: any) => {
                    const username = await getUsername(conv.otherUserId);
                    const conversationItem = document.querySelector(`[data-user-id="${conv.otherUserId}"] .conversation-name`);
                    if (conversationItem) {
                        conversationItem.textContent = username;
                    }
                    
                    // Update avatar with first letter of username
                    const avatarElement = document.querySelector(`[data-user-id="${conv.otherUserId}"] .conversation-avatar`);
                    if (avatarElement && username !== `User ${conv.otherUserId}`) {
                        avatarElement.textContent = username.charAt(0).toUpperCase();
                    }
                });
                    
                // Add click handlers to conversation items
                setTimeout(() => {
                    document.querySelectorAll('.conversation-item').forEach(item => {
                        const userId = Number(item.getAttribute('data-user-id'));
                        
                        // Restore active conversation selection if it exists
                        if (activeConversationId === userId) {
                            item.classList.add('active');
                        }
                        
                        item.addEventListener('click', async () => {
                            // Get the real username (in case it's still loading)
                            const userName = await getUsername(userId);
                            // Visual highlight of the active conversation
                            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            selectConversation(userId, userName);
                        });
                    });
                }, CHAT_CONFIG.USERNAME_LOADING_DELAY);
                
                console.log('Conversations loaded:', result);
            } else {
                conversationsList.innerHTML = `
                    <div class="no-conversations">
                        <p>${UI_MESSAGES.NO_CONVERSATIONS_FOUND}</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <p style="color: red;">❌ Error loading conversations: ${error}</p>
                </div>
            `;
        }
    }

    // Load conversations automatically on page load
    loadConversationsAuto();

    // Handle new chat functionality
    const sidebarNewChatBtn = document.getElementById('sidebar-new-chat') as HTMLButtonElement;
    const newChatModal = document.getElementById('new-chat-modal') as HTMLDivElement;
    const closeNewChatModalBtn = document.getElementById('close-new-chat-modal') as HTMLButtonElement;
    const userSearchInput = document.getElementById('user-search') as HTMLInputElement;
    const userSearchResults = document.getElementById('user-search-results') as HTMLDivElement;

    // Function to open new chat modal
    async function openNewChatModal() {
        if (newChatModal && userSearchInput) {
            newChatModal.style.display = 'block';
            userSearchInput.focus();
            // Load all users by default
            await loadAllUsers();
        }
    }

    // Add event listener for sidebar new chat button
    if (sidebarNewChatBtn) {
        sidebarNewChatBtn.addEventListener('click', openNewChatModal);
    }

    if (newChatModal && closeNewChatModalBtn && userSearchInput && userSearchResults) {

        // Close modal
        closeNewChatModalBtn.addEventListener('click', () => {
            newChatModal.style.display = 'none';
            userSearchInput.value = '';
            userSearchResults.innerHTML = '';
        });

        // Close modal when clicking outside
        newChatModal.addEventListener('click', (e) => {
            if (e.target === newChatModal) {
                newChatModal.style.display = 'none';
                userSearchInput.value = '';
                userSearchResults.innerHTML = '';
            }
        });

        // Handle user search
        let searchTimeout: number | null = null;
        userSearchInput.addEventListener('input', () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(async () => {
                const query = userSearchInput.value.trim();
                if (query.length >= CHAT_CONFIG.MIN_SEARCH_CHARS) {
                    await handleUserSearch(query);
                } else if (query.length === 0) {
                    // If search is empty, show all users
                    await loadAllUsers();
                } else {
                    userSearchResults.innerHTML = `<div class="loading">${UI_MESSAGES.TYPE_TO_SEARCH}</div>`;
                }
            }, CHAT_CONFIG.SEARCH_DEBOUNCE_DELAY);
        });
    }

    // Handle block/unblock user button (if it exists)
    if (blockButton) {
        blockButton.addEventListener('click', async () => {
        if (!activeConversationId) {
            alert('No conversation selected');
            return;
        }

        const isBlocked = blockedUsers.has(activeConversationId);
        const action = isBlocked ? 'unblock' : 'block';
        const confirmMessage = isBlocked 
            ? `Unblock ${activeConversationName}?` 
            : `Block ${activeConversationName}? You won't receive messages from this user.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            if (isBlocked) {
                await unblockUser(activeConversationId);
                blockedUsers.delete(activeConversationId);
                blockButton.textContent = '🚫';
                blockButton.title = 'Block user';
                messageResult.innerHTML = '<span class="success">✅ User unblocked successfully!</span>';
            } else {
                await blockUser(activeConversationId);
                blockedUsers.add(activeConversationId);
                blockButton.textContent = '✅';
                blockButton.title = 'Unblock user';
                messageResult.innerHTML = '<span class="success">✅ User blocked successfully!</span>';
            }
            messageResult.className = 'message-result success';
            
            console.log(`User ${activeConversationId} ${action}ed successfully`);
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            messageResult.innerHTML = `<span class="error">❌ Failed to ${action} user</span>`;
            messageResult.className = 'message-result error';
        }
    });
    }

    // Handle view profile button click (if it exists)
    if (viewProfileButton) {
        viewProfileButton.addEventListener('click', async () => {
        if (!activeConversationId) {
            alert('No conversation selected');
            return;
        }

        try {
            const profile = await getUserProfile(activeConversationId);
            console.log('User profile:', profile);
            
            // Show profile modal
            showProfileModal(profile);
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load user profile');
        }
    });
    }

    /**
     * Initialize WebSocket connection with real-time message handling
     * Sets up event listeners for messages, user connections, and game invitations
     */
    async function initializeWebSocket() {
        try {
            const userId = getCurrentUserId();
            
            console.log(`Connecting to WebSocket with userId: ${userId}`);
            await websocketClient.connect(userId);
            
            // Set up message handler for incoming messages
            websocketClient.onMessage((message: ChatMessage) => {
                console.log('Received WebSocket message:', message);

                if (message.type === 'message') {
                    // Check if it's a game invitation event
                    if (message.data?.event_type) {
                        handleGameInvitationEvent(message.data);
                    } else {
                        // Add received message to UI
                        addMessageToUI({
                            ...message,
                            isSent: false
                        });
                        // Auto-refresh conversations list to show new message/conversation
                        loadConversationsDebounced();
                    }
                } else if (message.type === 'user_connected') {
                    // Track user connection
                    if (message.userId) {
                        connectedUsersSet.add(message.userId);
                        console.log(`User ${message.userId} connected. Online users:`, Array.from(connectedUsersSet));
                    }
                } else if (message.type === 'user_disconnected') {
                    // Track user disconnection
                    if (message.userId) {
                        connectedUsersSet.delete(message.userId);
                        console.log(`User ${message.userId} disconnected. Online users:`, Array.from(connectedUsersSet));
                    }
                } else if (message.type === 'connected_users_list') {
                    // Inicializa el Set de usuarios conectados con la lista recibida
                    connectedUsersSet.clear();
                    if (Array.isArray(message.data)) {
                        message.data.forEach((userId: number) => connectedUsersSet.add(userId));
                        console.log('Lista inicial de usuarios online:', Array.from(connectedUsersSet));
                    }
                }
            });
            
            // Update connection status in UI
            updateConnectionStatus(true);
            
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            updateConnectionStatus(false);
        }
    }

    /**
     * Handle game redirection after accepting invitation
     * @param result - Game invitation result data
     */
    function handleGameRedirection(result: any) {
        try {
            // Future implementation: redirect to multiplayer game when ready
            // window.location.hash = `#/pong/remote?opponent=${result.opponentId}`;
            
            // Current implementation: redirect to game selection
            window.location.hash = '#/game';
            console.log('Redirected to game selection. Opponent data:', result);
        } catch (error) {
            console.error('Error handling game redirection:', error);
            // Fallback: show error message
            if (messageResult) {
                messageResult.innerHTML = '<span class="error">❌ Failed to redirect to game</span>';
                messageResult.className = 'message-result error';
            }
        }
    }

    /**
     * Handle incoming game invitation events via WebSocket
     * @param eventData - Event data containing invitation details
     */
    function handleGameInvitationEvent(eventData: any) {
        const eventType = eventData.event_type;
        
        switch (eventType) {
            case 'game_invitation_received':
                console.log('🎮 New game invitation received:', eventData);
                // Get real username instead of hardcoded "User X"
                getUsername(eventData.from_user_id).then(username => {
                    if (messageResult) {
                        messageResult.innerHTML = `<span class="success">🎮 ${username} invited you to play ${eventData.game_type}!</span>`;
                        messageResult.className = 'message-result success';
                    }
                });
                // Reload invitations to show the new one
                loadGameInvitations();
                break;
                
            case 'game_invitation_accepted':
                console.log('✅ Game invitation accepted:', eventData);
                // Get real username instead of hardcoded "User X"
                getUsername(eventData.to_user_id).then(username => {
                    if (messageResult) {
                        messageResult.innerHTML = `<span class="success">✅ ${username} accepted your invitation!</span>`;
                        messageResult.className = 'message-result success';
                    }
                });
                // TODO: Implement game redirection when multiplayer is ready
                break;
                
            case 'game_invitation_rejected':
                console.log('❌ Game invitation rejected:', eventData);
                // Get real username instead of hardcoded "User X"
                getUsername(eventData.to_user_id).then(username => {
                    if (messageResult) {
                        messageResult.innerHTML = `<span class="error">❌ ${username} rejected your invitation</span>`;
                        messageResult.className = 'message-result error';
                    }
                });
                break;
                
            default:
                console.log('Unknown game invitation event:', eventType);
        }
    }

    // Function to select a conversation and load messages
    async function selectConversation(otherUserId: number, otherUserName: string) {
        activeConversationId = otherUserId;
        activeConversationName = otherUserName;

        // Update the chat header
        const contactName = document.getElementById('contact-name');
        if (contactName) contactName.textContent = otherUserName;

        // Show and update block button
        const blockBtn = document.getElementById('block-user-btn') as HTMLButtonElement;
        if (blockBtn) {
            blockBtn.style.display = 'block';
            const isBlocked = blockedUsers.has(otherUserId);
            blockBtn.textContent = isBlocked ? '✅' : '🚫';
            blockBtn.title = isBlocked ? 'Unblock user' : 'Block user';
        }

        // Show view profile button
        const profileBtn = document.getElementById('view-profile-btn') as HTMLButtonElement;
        if (profileBtn) {
            profileBtn.style.display = 'block';
        }

        // Show invite to game button
        const inviteBtn = document.getElementById('invite-game-btn') as HTMLButtonElement;
        if (inviteBtn) {
            inviteBtn.style.display = 'block';
        }

        // Update message input visibility
        updateMessageInputVisibility();

        // Charge indicator display
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="loading">Cargando mensajes...</div>';
        }

        try {
            const result = await getMessages(otherUserId);
            displayMessages(result.messages || []);
        } catch (err) {
            if (messagesContainer) {
                messagesContainer.innerHTML = '<div class="error">Error cargando mensajes</div>';
            }
        }
    }

    // Render messages in the chat area
    function displayMessages(messages: any[]) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No hay mensajes en esta conversación.</div>';
            return;
        }
        
        const currentUserId = getCurrentUserId();
        console.log('🔍 Display Messages - Current User ID:', currentUserId);
        
        messagesContainer.innerHTML = messages.map(msg => {
            // Determine if the message was sent by the current user
            const isSent = msg.sender_id === currentUserId || msg.isSent;
            console.log('📨 Message:', { sender_id: msg.sender_id, currentUserId, isSent, content: msg.content?.substring(0, 20) });
            return `
                <div class="message-bubble ${isSent ? 'message-sent' : 'message-received'}">
                    <div class="message-content">${sanitizeText(msg.content)}</div>
                    <div class="message-time">${new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
        }).join('');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add message to the UI
    function addMessageToUI(message: ChatMessage & { isSent: boolean }) {
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
        
        messageDiv.innerHTML = `
            <div class="message-content">${sanitizeText(message.content)}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Update connection status indicator
    function updateConnectionStatus(connected: boolean) {
        const statusIndicator = document.querySelector('#connection-status .status-indicator');
        const statusText = document.querySelector('#connection-status .status-text');
        
        if (statusIndicator && statusText) {
            if (connected) {
                statusIndicator.textContent = '●';
                (statusIndicator as HTMLElement).style.color = '#25D366';
                statusText.textContent = UI_MESSAGES.CONNECTED;
            } else {
                statusIndicator.textContent = '●';
                (statusIndicator as HTMLElement).style.color = '#ff4444';
                statusText.textContent = UI_MESSAGES.DISCONNECTED;
            }
        }
    }

    // Get current user ID from authentication
    function getCurrentUserId(): number {
        // First try to get from JWT token
        const tokenUserId = getUserIdFromToken();
        if (tokenUserId) {
            return tokenUserId;
        }

        // Fallback: try to get from localStorage user object
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    return user.id;
                }
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
        }

        // If no authentication found, redirect to login
        console.warn('No authentication found, redirecting to login');
        window.location.hash = '#/login';
        return 0; // Return 0 to indicate no user
    }

    /**
     * Get username with intelligent caching to optimize performance
     * @param userId - The user ID to get username for
     * @returns Promise resolving to username string
     */
    async function getUsername(userId: number): Promise<string> {
        // Check cache first
        if (usernameCache.has(userId)) {
            return usernameCache.get(userId)!;
        }

        try {
            const profile = await getUserProfile(userId);
            const username = profile.username || `User ${userId}`;
            
            // Cache the result
            usernameCache.set(userId, username);
            return username;
        } catch (error) {
            console.error(`Failed to get username for user ${userId}:`, error);
            // Fallback to User ID format
            const fallback = `User ${userId}`;
            usernameCache.set(userId, fallback);
            return fallback;
        }
    }

    // Load game invitations
    async function loadGameInvitations() {
        try {
            const result = await getGameInvitations();
            const invitations = result.invitations || [];
            
            const invitationsSection = document.getElementById('game-invitations-section') as HTMLDivElement;
            const invitationsList = document.getElementById('game-invitations-list') as HTMLDivElement;
            
            if (!invitationsSection || !invitationsList) return;
            
            if (invitations.length > 0) {
                invitationsSection.style.display = 'block';
                
                // First show loading placeholders
                invitationsList.innerHTML = invitations.map((inv: any) => `
                    <div class="invitation-item" data-invitation-id="${inv.id}">
                        <div class="invitation-info">
                            <span class="invitation-user">🎮 ${UI_MESSAGES.LOADING}</span>
                            <span class="invitation-game">${inv.game_type}</span>
                        </div>
                        <div class="invitation-actions">
                            <button class="accept-invitation-btn" data-id="${inv.id}">✅</button>
                            <button class="reject-invitation-btn" data-id="${inv.id}">❌</button>
                        </div>
                    </div>
                `).join('');
                
                // Then load real usernames asynchronously
                invitations.forEach(async (inv: any) => {
                    const username = await getUsername(inv.from_user_id);
                    const userElement = document.querySelector(`[data-invitation-id="${inv.id}"] .invitation-user`);
                    if (userElement) {
                        userElement.textContent = `🎮 ${username}`;
                    }
                });
                
                // Add event listeners to invitation buttons
                setTimeout(() => {
                    document.querySelectorAll('.accept-invitation-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const id = Number((e.target as HTMLElement).getAttribute('data-id'));
                            await handleAcceptInvitation(id);
                        });
                    });
                    
                    document.querySelectorAll('.reject-invitation-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const id = Number((e.target as HTMLElement).getAttribute('data-id'));
                            await handleRejectInvitation(id);
                        });
                    });
                }, 0);
            } else {
                invitationsSection.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading game invitations:', error);
        }
    }

    // Handle accept game invitation
    async function handleAcceptInvitation(invitationId: number) {
        try {
            const result = await acceptGameInvitation(invitationId);
            console.log('Invitation accepted:', result);
            
            // Show success message
            messageResult.innerHTML = '<span class="success">✅ Game invitation accepted! Redirecting to game...</span>';
            messageResult.className = 'message-result success';
            
            // Reload invitations
            await loadGameInvitations();
            
            // Redirect to game page after 2 seconds
            setTimeout(() => {
                handleGameRedirection(result);
            }, CHAT_CONFIG.GAME_REDIRECT_DELAY);
        } catch (error: any) {
            messageResult.innerHTML = `<span class="error">❌ Error: ${error.message}</span>`;
            messageResult.className = 'message-result error';
        }
    }

    // Handle reject game invitation
    async function handleRejectInvitation(invitationId: number) {
        try {
            await rejectGameInvitation(invitationId);
            console.log('Invitation rejected');
            
            // Show rejection message
            messageResult.innerHTML = '<span class="success">❌ Invitation rejected</span>';
            messageResult.className = 'message-result';
            
            // Reload invitations
            await loadGameInvitations();
            
            // Clear message after 3 seconds
            setTimeout(() => {
                messageResult.innerHTML = '';
            }, 3000);
        } catch (error: any) {
            console.error('Error rejecting invitation:', error);
            messageResult.innerHTML = `<span class="error">❌ Error rejecting invitation</span>`;
            messageResult.className = 'message-result error';
        }
    }

    // Profile Modal Functions
    function showProfileModal(profile: any) {
        const modal = document.getElementById('profile-modal');
        const username = document.getElementById('profile-username');
        const userId = document.getElementById('profile-id');
        const avatar = document.getElementById('profile-avatar');
        const victories = document.getElementById('profile-victories');
        
        if (!modal || !username || !userId || !avatar || !victories) {
            console.error('Profile modal elements not found');
            return;
        }

        // Populate modal with profile data
        username.textContent = profile.username || 'Unknown';
        userId.textContent = profile.id?.toString() || '-';
        avatar.textContent = profile.username?.charAt(0).toUpperCase() || '?';
        victories.textContent = profile.victories?.toString() || '0';
        
        // Show modal
        modal.style.display = 'flex';
    }

    function closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Profile modal event listeners
    const closeModalBtn = document.getElementById('close-profile-modal');
    const profileModal = document.getElementById('profile-modal');
    const inviteFromProfileBtn = document.getElementById('invite-from-profile-btn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProfileModal);
    }

    // Close modal when clicking outside
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeProfileModal();
            }
        });
    }

    // Invite to game from profile modal
    if (inviteFromProfileBtn) {
        inviteFromProfileBtn.addEventListener('click', async () => {
            if (!activeConversationId) {
                alert('No conversation selected');
                return;
            }

            try {
                await sendGameInvitation(activeConversationId, 'pong');
                messageResult.innerHTML = '<span class="success">🎮 Game invitation sent!</span>';
                messageResult.className = 'message-result success';
                closeProfileModal();
            } catch (error: any) {
                messageResult.innerHTML = `<span class="error">❌ ${error.message}</span>`;
                messageResult.className = 'message-result error';
            }
        });
    }

    // Handle invite to game button (if it exists)
    if (inviteGameButton) {
        inviteGameButton.addEventListener('click', async () => {
        if (!activeConversationId) {
            if (messageResult) {
                messageResult.innerHTML = '<span class="error">No conversation selected</span>';
                messageResult.className = 'message-result error';
            }
            return;
        }

        try {
            const result = await sendGameInvitation(activeConversationId, 'pong');
            if (messageResult) {
                messageResult.innerHTML = '<span class="success">🎮 Game invitation sent!</span>';
                messageResult.className = 'message-result success';
            }
            console.log('Game invitation sent:', result);
        } catch (error: any) {
            if (messageResult) {
                messageResult.innerHTML = `<span class="error">❌ ${error.message}</span>`;
                messageResult.className = 'message-result error';
            }
        }
    });
    }

    // Function to show/hide message input based on conversation selection
    function updateMessageInputVisibility() {
        const messageForm = document.getElementById('message-form') as HTMLFormElement;
        
        if (activeConversationId) {
            if (messageForm) messageForm.style.display = 'flex';
        } else {
            if (messageForm) messageForm.style.display = 'none';
        }
    }

    // Function to handle user search
    async function handleUserSearch(query: string) {
        const userSearchResults = document.getElementById('user-search-results') as HTMLDivElement;
        
        try {
            userSearchResults.innerHTML = `<div class="loading">${UI_MESSAGES.SEARCHING_USERS}</div>`;
            
            // First try to search, if it fails, filter from available users
            let users;
            try {
                users = await searchUsersByUsername(query);
            } catch (error) {
                console.warn('Search API not available, filtering from known users:', error);
                // Fallback: filter from available users
                const allUsers = await getAvailableUsers();
                users = allUsers.filter((user: any) => 
                    user.username.toLowerCase().includes(query.toLowerCase()) ||
                    user.email.toLowerCase().includes(query.toLowerCase())
                );
            }
            
            if (users && users.length > 0) {
                const currentUserId = getCurrentUserId();
                const filteredUsers = users.filter((user: any) => user.id !== currentUserId);
                const connectedUsers = getConnectedUsersList();
                
                // Separate online and offline users
                const onlineUsers = filteredUsers.filter((user: any) => connectedUsers.includes(user.id));
                const offlineUsers = filteredUsers.filter((user: any) => !connectedUsers.includes(user.id));
                
                let html = '';
                
                if (onlineUsers.length > 0) {
                    html += '<div class="users-section"><h4>🟢 Online Results</h4>';
                    html += renderUserList(onlineUsers, true);
                    html += '</div>';
                }
                
                if (offlineUsers.length > 0) {
                    html += '<div class="users-section"><h4>⚫ Offline Results</h4>';
                    html += renderUserList(offlineUsers, false);
                    html += '</div>';
                }
                
                if (html) {
                    userSearchResults.innerHTML = html;
                    attachUserClickHandlers();
                } else {
                    userSearchResults.innerHTML = '<div class="no-results">No matching users found</div>';
                }
            } else {
                userSearchResults.innerHTML = '<div class="no-results">No users found</div>';
            }
        } catch (error) {
            console.error('Error searching users:', error);
            userSearchResults.innerHTML = '<div class="error">Error searching users</div>';
        }
    }

    /**
     * Load all users from database and display with real-time online/offline status
     * Separates users into online and offline sections for better UX
     */
    async function loadAllUsers() {
        const userSearchResults = document.getElementById('user-search-results') as HTMLDivElement;
        
        try {
            userSearchResults.innerHTML = `<div class="loading">${UI_MESSAGES.LOADING_USERS}</div>`;
            
            // Get all users from the database
            const response = await getAllUsers();
            const allUsers = response.users || [];
            // Get connected users for online status (from WebSocket service)
            const connectedUsers = getConnectedUsersList();
            
            if (allUsers && allUsers.length > 0) {
                const currentUserId = getCurrentUserId();
                const filteredUsers = allUsers.filter((user: any) => user.id !== currentUserId);
                
                // Separate online and offline users
                const onlineUsers = filteredUsers.filter((user: any) => connectedUsers.includes(user.id));
                const offlineUsers = filteredUsers.filter((user: any) => !connectedUsers.includes(user.id));
                
                let html = '';
                
                if (onlineUsers.length > 0) {
                    html += '<div class="users-section"><h4>🟢 Online Users</h4>';
                    html += renderUserList(onlineUsers, true);
                    html += '</div>';
                }
                
                if (offlineUsers.length > 0) {
                    html += '<div class="users-section"><h4>⚫ Offline Users</h4>';
                    html += renderUserList(offlineUsers, false);
                    html += '</div>';
                }
                
                if (html) {
                    userSearchResults.innerHTML = html;
                    attachUserClickHandlers();
                } else {
                    userSearchResults.innerHTML = '<div class="no-results">No other users found</div>';
                }
            } else {
                userSearchResults.innerHTML = '<div class="no-results">No users found</div>';
            }
        } catch (error) {
            console.error('Error loading users:', error);
            userSearchResults.innerHTML = '<div class="error">Error loading users</div>';
        }
    }

    // Function to render user list with online/offline status
    function renderUserList(users: any[], isOnline: boolean): string {
        return users.map((user: any) => `
            <div class="user-search-item" data-user-id="${user.id}">
                <div class="user-avatar">
                    ${user.username.charAt(0).toUpperCase()}
                    <div class="user-status ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <button class="start-conversation-btn" data-user-id="${user.id}" data-username="${user.username}">
                    Chat
                </button>
            </div>
        `).join('');
    }

    // Function to attach click handlers to user items
    function attachUserClickHandlers() {
        document.querySelectorAll('.start-conversation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = Number((e.target as HTMLElement).getAttribute('data-user-id'));
                const username = (e.target as HTMLElement).getAttribute('data-username') || 'Unknown';
                
                // Start conversation with this user
                selectConversation(userId, username);
                
                // Close modal
                const modal = document.getElementById('new-chat-modal') as HTMLDivElement;
                if (modal) {
                    modal.style.display = 'none';
                    const searchInput = document.getElementById('user-search') as HTMLInputElement;
                    if (searchInput) searchInput.value = '';
                    const userSearchResults = document.getElementById('user-search-results') as HTMLDivElement;
                    if (userSearchResults) userSearchResults.innerHTML = '';
                }
                
                // Refresh conversations to show new conversation
                loadConversationsDebounced();
            });
        });
    }

    /**
     * Get available users from database via API
     * @returns Promise resolving to array of user objects
     */
    async function getAvailableUsers(): Promise<any[]> {
        try {
            // Use the getAllUsers API endpoint to get real users from database
            const allUsers = await getAllUsers();
            const currentUserId = getCurrentUserId();
            
            if (allUsers && Array.isArray(allUsers)) {
                // Filter out the current user
                return allUsers.filter((user: any) => user.id !== currentUserId);
            }
            
            return [];
        } catch (error) {
            console.error('Error getting available users:', error);
            // Return empty array instead of hardcoded fallback users
            return [];
        }
    }

    /**
     * Get list of currently connected users tracked via WebSocket events
     * @returns Array of user IDs currently online
     */
    function getConnectedUsersList(): number[] {
        // Return the array of currently connected users tracked via WebSocket events
        return Array.from(connectedUsersSet);
    }

    // Update visibility on page load
    updateMessageInputVisibility();
}