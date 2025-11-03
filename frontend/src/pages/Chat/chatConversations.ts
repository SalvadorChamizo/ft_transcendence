import { getAccessToken } from "../../state/authState";
import { getUsername } from "./chatUtils";
import { UI_MESSAGES, CHAT_CONFIG } from "./chatConstants";
import {
    getActiveConversationId,
    getActiveConversationName,
    getLoadConversationsTimeout,
    setActiveConversationId,
    setActiveConversationName,
    setLoadConversationsTimeout,
    getConnectedUsersSet,
} from "./chatState";
import { getMessages, displayMessages, updateMessageInputVisibility } from "./chatMessages";
import { updateFriendBtn } from "./chatFriends";

const apiHost = `${window.location.hostname}`;

export async function getConversations() {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations`, {
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

// Function to select a conversation and load messages
export async function selectConversation(otherUserId: number, otherUserName: string) {
    setActiveConversationId(otherUserId);
    setActiveConversationName(otherUserName);


    // Update the chat header
    const contactName = document.getElementById('contact-name');
    if (contactName) contactName.textContent = otherUserName;

    // Botón añadir/quitar amigo
    let friendsSet = (window as any).friendsSet;
    if (!friendsSet) {
        friendsSet = new Set();
        (window as any).friendsSet = friendsSet;
    }
    let addFriendBtn = document.getElementById('add-friend-btn') as HTMLButtonElement;
    if (!addFriendBtn) {
        const chatHeader = document.querySelector('.chat-header .contact-details');
        if (chatHeader) {
            addFriendBtn = document.createElement('button');
            addFriendBtn.id = 'add-friend-btn';
            addFriendBtn.className = 'add-friend-btn';
            addFriendBtn.style.marginLeft = '10px';
            chatHeader.appendChild(addFriendBtn);
        }
    }
    updateFriendBtn(otherUserId);
    if (addFriendBtn) {
        addFriendBtn.style.display = 'block';
        addFriendBtn.onclick = () => {
            if (friendsSet.has(otherUserId)) {
                friendsSet.delete(otherUserId);
            } else {
                friendsSet.add(otherUserId);
            }
            updateFriendBtn(otherUserId);
        };
    }

    // Actualizar el estado online/offline dinámicamente
    const contactStatus = document.getElementById('contact-status');
    if (contactStatus) {
        contactStatus.style.display = 'block';
        if (getConnectedUsersSet().has(otherUserId)) {
            contactStatus.textContent = 'Online';
            contactStatus.style.color = '#25D366';
        } else {
            contactStatus.textContent = 'Offline';
            contactStatus.style.color = '#ff4444';
        }
    }

    // Show and update block button
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const viewProfileButton = document.getElementById('view-profile-btn') as HTMLButtonElement;
    const profileBtn = document.getElementById('view-profile-btn') as HTMLButtonElement;
    if (profileBtn) {
        profileBtn.style.display = 'block';
    }

    if (blockButton) {
        blockButton.style.display = 'block';
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

export async function loadConversationsAuto() {
    const conversationsList = document.getElementById('conversations-list') as HTMLDivElement;
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
                    conversationItem.setAttribute('data-username', username);
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
                    if (getActiveConversationId() === userId) {
                        item.classList.add('active');
                    }

                    item.addEventListener('click', async (e) => {
                        const target = e.target as HTMLElement;
                        const username = target.getAttribute('data-username') || await getUsername(userId);

                        if (target.classList.contains('conversation-name')) {
                            // Navigate to profile
                            window.location.hash = `#/profile/${username}`;
                        } else {
                            // Select conversation
                            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            selectConversation(userId, username);
                        }
                    });
                });
            }, CHAT_CONFIG.USERNAME_LOADING_DELAY);
                
        } else {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <p>${UI_MESSAGES.NO_CONVERSATIONS_FOUND}</p>
                </div>
            `;
        }

    } catch (error) {
        if (conversationsList) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <p style="color: red;">❌ Error loading conversations: ${error}</p>
                </div>
            `;
        }
    }
    setTimeout(() => {
    conversationsList.scrollTop = conversationsList.scrollHeight;
    }, 0);
}

export function loadConversationsDebounced() {

    const loadConversationsTimeout = getLoadConversationsTimeout();
    if (loadConversationsTimeout) {
        clearTimeout(loadConversationsTimeout);
    }

    setLoadConversationsTimeout(setTimeout(() => {
        loadConversationsAuto();
    }, CHAT_CONFIG.DEBOUNCE_DELAY));
}