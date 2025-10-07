import { getConversations, sendMessage, getMessages, blockUser, unblockUser, sendGameInvitation, getGameInvitations, acceptGameInvitation, rejectGameInvitation } from "../services/api";
import { websocketClient, ChatMessage } from "../services/websocketClient";

// Status for active conversation
let activeConversationId: number | null = null;
let activeConversationName: string = '';
let blockedUsers: Set<number> = new Set(); // Track blocked users

export function Chat(): string {
    return `
        <div class="whatsapp-container">
            <!-- Left sidebar: Conversations list -->
            <div class="conversations-sidebar">
                <div class="sidebar-header">
                    <h2>Chats</h2>
                    <button id="load-conversations" class="refresh-btn">
                        <span>↻</span>
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
                        <input 
                            type="number" 
                            id="recipient-id" 
                            placeholder="ID destinatario" 
                            class="recipient-input"
                            required 
                        />
                        <div class="input-with-button">
                            <input 
                                type="text" 
                                id="message-content" 
                                placeholder="Write a message..." 
                                class="message-input"
                                required 
                            />
                            <button type="submit" class="send-button">
                                ➤
                            </button>
                        </div>
                    </form>
                    <div id="message-result" class="message-result"></div>
                </div>
            </div>
        </div>
    `;
}

export function chatHandlers() {
    // Get DOM elements with TypeScript types
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    const loadButton = document.getElementById('load-conversations') as HTMLButtonElement;
    const messageResult = document.getElementById('message-result') as HTMLDivElement;
    const conversationsList = document.getElementById('conversations-list') as HTMLDivElement;
    const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const inviteGameButton = document.getElementById('invite-game-btn') as HTMLButtonElement;

    if (!messageForm || !loadButton || !messageResult || !conversationsList || !messagesContainer || !blockButton || !inviteGameButton) {
        console.error('Chat elements not found in DOM');
        return;
    }

    // Load game invitations on page load
    loadGameInvitations();

    // Initialize WebSocket connection
    initializeWebSocket();

    // Handle message form submission
    messageForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
        const recipientIdInput = document.getElementById('recipient-id') as HTMLInputElement;
        const messageContentInput = document.getElementById('message-content') as HTMLInputElement;
        
        if (!recipientIdInput || !messageContentInput) {
            messageResult.innerHTML = '<span class="error">Form elements not found</span>';
            messageResult.className = 'message-result error';
            return;
        }

        const recipientId = parseInt(recipientIdInput.value);
        const content = messageContentInput.value;

        if (isNaN(recipientId) || !content.trim()) {
            messageResult.innerHTML = '<span class="error">Please fill all fields correctly</span>';
            messageResult.className = 'message-result error';
            return;
        }

        try {
            messageResult.innerHTML = 'Sending message...';
            messageResult.className = 'message-result';
            
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
                messageResult.innerHTML = '<span class="success">✅ Message sent successfully!</span>';
                
                // Add message to UI immediately (sent message)
                addMessageToUI({
                    ...wsMessage,
                    isSent: true
                });
            } else {
                messageResult.innerHTML = '<span class="success">✅ Message sent via HTTP (WebSocket offline)</span>';
            }
            
            messageResult.className = 'message-result success';
            
            // Clear form
            messageContentInput.value = '';
            
            console.log('Message sent:', { http: httpResult, websocket: wsSent });
            
        } catch (error) {
            console.error('Error sending message:', error);
            messageResult.innerHTML = `<span class="error">❌ Error sending message: ${error}</span>`;
            messageResult.className = 'message-result error';
        }
    });

    // Handle load conversations button
    loadButton.addEventListener('click', async () => {
        try {
            conversationsList.innerHTML = '<div class="loading">Loading conversations...</div>';
            
            const result = await getConversations();
            
            if (result.conversations && result.conversations.length > 0) {
                conversationsList.innerHTML = result.conversations
                    .map((conv: any) => `
                        <div class="conversation-item" data-user-id="${conv.otherUserId}">
                            <div class="conversation-avatar">${conv.otherUserId.toString().slice(-1)}</div>
                            <div class="conversation-info">
                                <div class="conversation-name">User ${conv.otherUserId}</div>
                                <div class="conversation-preview">Last updated: ${new Date(conv.updatedAt).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('');
                    
                // Add click handlers to conversation items
                setTimeout(() => {
                    document.querySelectorAll('.conversation-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const userId = Number(item.getAttribute('data-user-id'));
                            const userName = item.querySelector('.conversation-name')?.textContent || '';
                            // Visual highlight of the active conversation
                            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            selectConversation(userId, userName);
                        });
                    });
                }, 0);
                
                console.log('Conversations loaded:', result);
            } else {
                conversationsList.innerHTML = `
                    <div class="no-conversations">
                        <p>No conversations found. Send a message to start chatting!</p>
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
    });

    // Handle block/unblock user button
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

    // Initialize WebSocket connection and message handling
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

    // Handle game invitation WebSocket events
    function handleGameInvitationEvent(eventData: any) {
        const eventType = eventData.event_type;
        
        switch (eventType) {
            case 'game_invitation_received':
                console.log('🎮 New game invitation received:', eventData);
                messageResult.innerHTML = `<span class="success">🎮 User ${eventData.from_user_id} invited you to play ${eventData.game_type}!</span>`;
                messageResult.className = 'message-result success';
                // Reload invitations to show the new one
                loadGameInvitations();
                break;
                
            case 'game_invitation_accepted':
                console.log('✅ Game invitation accepted:', eventData);
                messageResult.innerHTML = `<span class="success">✅ User ${eventData.to_user_id} accepted your invitation!</span>`;
                messageResult.className = 'message-result success';
                // TODO: Redirect to game page
                break;
                
            case 'game_invitation_rejected':
                console.log('❌ Game invitation rejected:', eventData);
                messageResult.innerHTML = `<span class="error">❌ User ${eventData.to_user_id} rejected your invitation</span>`;
                messageResult.className = 'message-result error';
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

        // Show invite to game button
        const inviteBtn = document.getElementById('invite-game-btn') as HTMLButtonElement;
        if (inviteBtn) {
            inviteBtn.style.display = 'block';
        }

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
        messagesContainer.innerHTML = messages.map(msg => `
            <div class="message-bubble ${msg.isSent ? 'message-sent' : 'message-received'}">
                <div class="message-content">${msg.content}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `).join('');
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
            <div class="message-content">${message.content}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Update connection status indicator
    function updateConnectionStatus(connected: boolean) {
        const statusElement = document.getElementById('contact-status') as HTMLSpanElement;
        if (statusElement) {
            statusElement.textContent = connected ? 'Online' : 'Offline';
            statusElement.style.color = connected ? '#25D366' : '#999';
        }
    }

    // Get current user ID (temporary implementation)
    function getCurrentUserId(): number {
        // TODO: Get from authState or user input
        // For now, use a default value
        return 1;
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
                invitationsList.innerHTML = invitations.map((inv: any) => `
                    <div class="invitation-item" data-invitation-id="${inv.id}">
                        <div class="invitation-info">
                            <span class="invitation-user">🎮 User ${inv.from_user_id}</span>
                            <span class="invitation-game">${inv.game_type}</span>
                        </div>
                        <div class="invitation-actions">
                            <button class="accept-invitation-btn" data-id="${inv.id}">✅</button>
                            <button class="reject-invitation-btn" data-id="${inv.id}">❌</button>
                        </div>
                    </div>
                `).join('');
                
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
            
            // TODO: Redirect to game page with opponent info
            // For now, just log the result
            console.log('Game ready with opponent:', result.opponentId);
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
            
            // Reload invitations
            await loadGameInvitations();
        } catch (error: any) {
            console.error('Error rejecting invitation:', error);
        }
    }

    // Handle invite to game button
    inviteGameButton.addEventListener('click', async () => {
        if (!activeConversationId) {
            messageResult.innerHTML = '<span class="error">No conversation selected</span>';
            messageResult.className = 'message-result error';
            return;
        }

        try {
            const result = await sendGameInvitation(activeConversationId, 'pong');
            messageResult.innerHTML = '<span class="success">🎮 Game invitation sent!</span>';
            messageResult.className = 'message-result success';
            console.log('Game invitation sent:', result);
        } catch (error: any) {
            messageResult.innerHTML = `<span class="error">❌ ${error.message}</span>`;
            messageResult.className = 'message-result error';
        }
    });
}