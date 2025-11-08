export function getChatHtml(): string {
    return `
        <div class="whatsapp-container">
            <!-- Left sidebar: Conversations list -->
            <div class="conversations-sidebar">
                <div class="sidebar-header">
                    <ul class="sidebar-nav">
                        <li class="sidebar-nav-item">
                        <button type="button" class="sidebar-nav-link active chat-btl" data-tab="chats-tab">Chats
                        </button>
                        </li>
                        <li class="sidebar-nav-item">
                        <button type="button" class="sidebar-nav-link notification-btr" data-tab="notifications-tab">Notifications</button>
                        </li>
                    </ul>
                </div>
                
                <div id="chats-tab" class="sidebar-tab-panel active">
                    <!-- New Chat Button - Always visible -->
                    <div class="new-chat-section">
                        <button id="sidebar-new-chat" class="sidebar-new-chat-btn">
                            <span>+</span> New Chat
                        </button>
                    </div>
                    
                    
                    <div class="conversations-list" id="conversations-list">
                        <!-- Conversations will be loaded here dynamically -->
                        <div class="no-conversations">
                            <p>Click ↻ to load conversations</p>
                        </div>
                    </div>
                </div>
            
                <div id="notifications-tab" class="sidebar-tab-panel">
                    <div class="notifications-list" id="notifications-list">
                        <!-- notifications will be loaded here dynamically -->
                        <div class="no-notifications">
                            <p>Click ↻ to load notifications</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main chat area -->
            <div class="chat-area">
                <!-- Chat header -->
                <div class="chat-header">
                    <div class="contact-info">
                        <div id="contact-avatar" class="contact-avatar">👤</div>
                        <div class="contact-details">
                            <h3 id="contact-name">Select a conversation</h3>
                            <span id="contact-status"></span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button id="view-profile-btn" class="view-profile-btn" title="View profile">
                            👤
                        </button>
                        <button id="invite-friend-btn" class="invite-friend-btn" title="Invite friend">
                            <span id="person-emoji">
                            <svg width="20" height="20" fill="#42F3FA" viewBox="0 0 24 24">
                                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6Z"/>
                            </svg>
                            </span>
                            <span id="plus-emoji">+​</span>
                        </button>
                        <button id="invite-game-btn" class="invite-game-btn" title="Invite to play Pong">
                            🎮
                        </button>
                        <button id="block-user-btn" class="block-btn" title="Block user">
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
                                placeholder="Type a message..." 
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