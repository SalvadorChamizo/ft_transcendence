import { UI_MESSAGES, CHAT_CONFIG } from "./chatConstants";
import { initializeWebSocket } from "./chatWebSocket";
import { handleMessageFormSubmit, updateMessageInputVisibility } from "./chatMessages";
import { loadConversationsAuto } from "./chatConversations";
import { loadAllUsers, getUserProfile } from "./chatUtils";
import { handleUserSearch } from "./chatUserSearch";
import { getActiveConversationId, 
         setActiveConversationId,
         setActiveConversationName,
         setActiveNotificationId,
         setActiveNotificationName,
         } from "./chatState";
import { blockHandler, fetchBlockedUsers } from "./chatBlockUsers";
import { sendGameInvitation } from "../../services/api";
import { openNewChatModal, closeProfileModal } from "./chatModal";
import { getAccessToken } from "../../state/authState";
import { loadNotificationsAuto, getNotifications } from "./chatNotifications";

export async function chatHandlers() {
    // Get essential DOM elements with proper error handling
    const messageForm = document.getElementById('message-form') as HTMLFormElement;
    const messageResult = document.getElementById('message-result') as HTMLDivElement;
    const conversationsList = document.getElementById('conversations-list') as HTMLDivElement;
    const messagesContainer = document.getElementById('messages-container') as HTMLDivElement;

    setActiveConversationId(0);
    setActiveConversationName("");
    setActiveNotificationId(0);
    setActiveNotificationName("");

    // Check essential elements
    if (!conversationsList || !messagesContainer) {
        return;
    }

    // Get optional elements (these might not exist initially)
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const inviteGameButton = document.getElementById('invite-game-btn') as HTMLButtonElement;
    const viewProfileButton = document.getElementById('view-profile-btn') as HTMLButtonElement;

    // Initialize WebSocket connection
    initializeWebSocket();

    // Load blocked users from backend first, then load conversations
    fetchBlockedUsers()
        .then(() => {
            // Load conversations after blocked users are loaded
            loadConversationsAuto();
        })
        .catch(err => {
            console.error("Failed to load blocked users on page load:", err);
            // Load conversations anyway even if blocked users fail
            loadConversationsAuto();
        });

    // Eliminar el listener previo antes de añadirlo
    messageForm.removeEventListener('submit', handleMessageFormSubmit);
    messageForm.addEventListener('submit', handleMessageFormSubmit);

    /**
     * Automatically load and display conversations with real usernames
     * Handles loading states and error scenarios
     */

    // Load conversations automatically on page load
    loadConversationsAuto();
    loadNotificationsAuto();

    const result = await getNotifications();

    if (result.notifications && result.notifications.length > 0) {
      // Render notifications

    const unreadCount = result.notifications.filter((not: any) => not.read_at === null).length;

    if (unreadCount !== 0) {
        const notificationsTabBtn = document.querySelector('.sidebar-nav-link.notification-btr') as HTMLElement;
            if (notificationsTabBtn) {
            notificationsTabBtn.textContent = `Notifications (${unreadCount})`;
            }
        }
    }
    // Handle new chat functionality
    const sidebarNewChatBtn = document.getElementById('sidebar-new-chat') as HTMLButtonElement;
    const newChatModal = document.getElementById('new-chat-modal') as HTMLDivElement;
    const closeNewChatModalBtn = document.getElementById('close-new-chat-modal') as HTMLButtonElement;
    const userSearchInput = document.getElementById('user-search') as HTMLInputElement;
    const userSearchResults = document.getElementById('user-search-results') as HTMLDivElement;

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
        if (!getActiveConversationId()) {
            alert('No conversation selected');
            return;
        }
            
        blockHandler();
        
        });
    }

    // Handle view profile button click (if it exists)
    if (viewProfileButton) {
        viewProfileButton.addEventListener('click', async () => {
        if (!getActiveConversationId()) {
            alert('No conversation selected');
            return;
        }

        try {
            const activeConversationId = getActiveConversationId();
            if (activeConversationId) {
                // Navigate to profile page with username
                const profile = await getUserProfile(activeConversationId);
                window.location.hash = `#/profile/${profile.username}`;
            }
        } catch (error) {
            alert('Failed to load user profile');
        }
    });
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
            if (!getActiveConversationId()) {
                alert('No conversation selected');
                return;
            }

            try {
                const activeConversationId = getActiveConversationId();
                if (activeConversationId) {
                    await sendGameInvitation(activeConversationId, 'pong');
                    messageResult.innerHTML = '<span class="success">🎮 Game invitation sent!</span>';
                    messageResult.className = 'message-result success';
                    closeProfileModal();
                }
            } catch (error: any) {
                messageResult.innerHTML = `<span class="error">❌ ${error.message}</span>`;
                messageResult.className = 'message-result error';
            }
        });
    }

    // Handle invite to game button (if it exists)
    if (inviteGameButton) {
        inviteGameButton.addEventListener('click', async () => {
            if (!getActiveConversationId()) {
                if (messageResult) {
                    messageResult.innerHTML = '<span class="error">No conversation selected</span>';
                    messageResult.className = 'message-result error';
                }
                return;
            }

            try {
                const activeConversationId = getActiveConversationId();
                if (activeConversationId) {
                    const result = await sendGameInvitation(activeConversationId, 'pong');
                    if (result && result.roomId) {
                        // Save roomId to localStorage for pending redirection
                        localStorage.setItem('pendingRemoteRoomId', result.roomId);
                        // Automatically redirect to the private remote room
                        window.location.hash = `#/private-remote-pong?room=${result.roomId}`;
                    }
                }
            } catch (error) {
                const errMsg = (error instanceof Error) ? error.message : String(error);
                if (messageResult) {
                    messageResult.innerHTML = `<span class="error">❌ ${errMsg}</span>`;
                    messageResult.className = 'message-result error';
                }
            }
        });
    }

    // Update visibility on page load
    updateMessageInputVisibility();
}