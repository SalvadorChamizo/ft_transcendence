import { getUserIdFromToken, getAccessToken } from "../../state/authState";
import { getAllUsers } from "../../services/api";
import { UI_MESSAGES } from "./chatConstants";
import { getConnectedUsersSet, getUsernameCache } from "./chatState";
import { loadConversationsDebounced, selectConversation } from "./chatConversations";

const apiHost = `${window.location.hostname}`;

export function getCurrentUserId(): number {
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
    }

    // If no authentication found, redirect to login
    window.location.hash = '#/login';
    return 0; // Return 0 to indicate no user
}

/**
 * Get username with intelligent caching to optimize performance
 * @param userId - The user ID to get username for
 * @returns Promise resolving to username string
 */
export async function getUsername(userId: number): Promise<string> {
    // Check cache first
    const usernameCache = getUsernameCache();
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
        // Fallback to User ID format
        const fallback = `User ${userId}`;
        usernameCache.set(userId, fallback);
        return fallback;
    }
}

export async function getUserProfile(userId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`https://${apiHost}:8443/api/users/getUserById`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: userId })
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

export async function searchUsersByUsername(query: string) {
    try {
        // Get all users and filter locally since backend doesn't have search endpoint
        const response = await getAllUsers();
        const allUsers = response.users || []; // Extract users array from response
        const searchQuery = query.toLowerCase();
        const filteredUsers = allUsers.filter((user: any) => 
            user.username.toLowerCase().includes(searchQuery)
        );
        return filteredUsers;
    } catch (err) {
        throw err;
    }
}

export async function loadAllUsers() {
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
                html += '<div class="users-section"><h4>🔴 Offline Users</h4>';
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
        userSearchResults.innerHTML = '<div class="error">Error loading users</div>';
    }
}

// Function to render user list with online/offline status
export function renderUserList(users: any[], isOnline: boolean): string {
    // Render initial HTML with text avatars
    const html = users.map((user: any) => `
        <div class="user-search-item" data-user-id="${user.id}">
            <div class="user-avatar" id="user-avatar-${user.id}">
                ${user.username.charAt(0).toUpperCase()}
                <div class="user-status ${isOnline ? 'online' : 'offline'}"></div>
            </div>
            <div class="user-info" style="display:flex;flex-direction:column;align-items:flex-start;">
                <div class="user-name" style="width:auto;display:inline-block;">${user.username}</div>
                <div class="user-status-text" style="display:block;text-align:left;color:${isOnline ? '#25D366' : '#ff4444'};margin-top:4px;">${isOnline ? 'Online' : 'Offline'}</div>
            </div>
            <button class="start-conversation-btn" data-user-id="${user.id}" data-username="${user.username}">
                Chat
            </button>
        </div>
    `).join('');

    // Load real avatars asynchronously
    setTimeout(async () => {
        for (const user of users) {
            const avatarUrl = await getUserAvatar(user.id);
            const avatarElement = document.getElementById(`user-avatar-${user.id}`);
            if (avatarElement && avatarUrl) {
                const statusIndicator = avatarElement.querySelector('.user-status');
                avatarElement.innerHTML = `<img src="${avatarUrl}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
                if (statusIndicator) {
                    avatarElement.appendChild(statusIndicator);
                }
            }
        }
    }, 0);

    return html;
}

export function attachUserClickHandlers() {
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
export async function getAvailableUsers(): Promise<any[]> {
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
        // Return empty array instead of hardcoded fallback users
        return [];
    }
}

/**
 * Get list of currently connected users tracked via WebSocket events
 * @returns Array of user IDs currently online
 */
export function getConnectedUsersList(): number[] {
    // Return the array of currently connected users tracked via WebSocket events
    return Array.from(getConnectedUsersSet());
}

// Update connection status indicator
export function updateConnectionStatus(connected: boolean) {
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

// Avatar cache to avoid redundant requests
const avatarCache = new Map<number, string | null>();

/**
 * Fetch user avatar from backend
 * @param userId - The user ID to get avatar for
 * @returns Promise resolving to blob URL or null if avatar doesn't exist
 */
export async function getUserAvatar(userId: number): Promise<string | null> {
    // Check cache first
    if (avatarCache.has(userId)) {
        return avatarCache.get(userId)!;
    }

    try {
        const token = getAccessToken();
        console.log(`[Avatar] Fetching avatar for user ID: ${userId}`);
        const response = await fetch(`https://${apiHost}:8443/api/users/getAvatar`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-user-id': userId.toString()
            }
        });

        if (!response.ok) {
            avatarCache.set(userId, null);
            return null;
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Cache the result
        avatarCache.set(userId, blobUrl);
        return blobUrl;
    } catch (error) {
        avatarCache.set(userId, null);
        return null;
    }
}

/**
 * Clear avatar cache (useful when avatar is updated)
 */
export function clearAvatarCache(userId?: number) {
    if (userId !== undefined) {
        avatarCache.delete(userId);
    } else {
        avatarCache.clear();
    }
}

/**
 * Create avatar element with fallback to text avatar
 * @param userId - The user ID
 * @param username - The username for text fallback
 * @param cssClass - CSS class for the avatar element
 * @returns Promise resolving to HTML string
 */
export async function createAvatarElement(userId: number, username: string, cssClass: string): Promise<string> {
    const avatarUrl = await getUserAvatar(userId);

    if (avatarUrl) {
        return `<div class="${cssClass}"><img src="${avatarUrl}" alt="${username}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/></div>`;
    } else {
        // Fallback to text avatar
        return `<div class="${cssClass}">${username.charAt(0).toUpperCase()}</div>`;
    }
}