import { getAccessToken } from "../../state/authState";
import { getActiveConversationId, getActiveConversationName, getBlockedUsers, setBlockedUsers } from "./chatState";

const apiHost = `${window.location.hostname}`

export async function fetchBlockedUsers() {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/blocked`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        // Update the blocked users set with data from backend
        const blockedUsersSet = new Set<number>(data.blockedUsers || []);
        setBlockedUsers(blockedUsersSet);
        return blockedUsersSet;
    } catch (err) {
        console.error("Failed to fetch blocked users:", err);
        throw err;
    }
}

export function updateBlockButtonUI() {
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const activeConversationId = getActiveConversationId();
    
    if (blockButton && activeConversationId) {
        const blockedUsers = getBlockedUsers();
        const isBlocked = blockedUsers.has(activeConversationId);
        if (isBlocked) {
            blockButton.textContent = '✅';
            blockButton.title = 'Unblock user';
        } else {
            blockButton.textContent = '🚫';
            blockButton.title = 'Block user';
        }
    }
}

export async function blockHandler() {
    
    const blockButton = document.getElementById('block-user-btn') as HTMLButtonElement;
    const messageResult = document.getElementById('message-result') as HTMLDivElement;
    const activeConversationName = getActiveConversationName();
    const activeConversationId = getActiveConversationId();
    const blockedUsers = getBlockedUsers();

    if (activeConversationId === null) {
        messageResult.innerHTML = `<span class="error">❌ No active conversation selected</span>`;
        messageResult.className = 'message-result error';
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
            updateBlockButtonUI();
            messageResult.innerHTML = '<span class="success">✅ User unblocked successfully!</span>';
        } else {
            await blockUser(activeConversationId);
            blockedUsers.add(activeConversationId);
            updateBlockButtonUI();
            messageResult.innerHTML = '<span class="success">✅ User blocked successfully!</span>';
        }
        messageResult.className = 'message-result success';
            
    } catch (error) {
        messageResult.innerHTML = `<span class="error">❌ Failed to ${action} user</span>`;
        messageResult.className = 'message-result error';
    }
}

export async function blockUser(blockedUserId: number) {
    try {
        const token = getAccessToken();
        
        const url = `http://${apiHost}:8080/conversations/${blockedUserId}/block`;
        const options = {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}) // Send empty JSON body
        };
        
        const res = await fetch(url, options);
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}

export async function unblockUser(blockedUserId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/${blockedUserId}/block`, {
            method: 'DELETE',
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        throw err;
    }
}