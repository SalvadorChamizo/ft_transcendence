import { getAccessToken } from "../state/authState";

const apiHost = window.location.hostname;

export async function pingGateway(): Promise<string> {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/ping` , {
                headers: { "Authorization": `Bearer ${token}` }
            });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();
        return `Gateway status: ${data.pong}
        chat: ${data.chat}
        auth: ${data.auth}`;
    } catch (err) {
        console.error("Failed to reach gateway:", err);
        return "Gateway is unreachable";
    }
}

// Functions for Chat-Service
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
        console.error("Failed to get conversations:", err);
        throw err;
    }
}

export async function sendMessage(recipientId: number, content: string) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/1/messages`, {
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
        console.error("Failed to send message:", err);
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
        console.error("Failed to get messages:", err);
        throw err;
    }
}

export async function blockUser(blockedUserId: number) {
    try {
        const token = getAccessToken();
        console.log('🔒 Blocking user:', blockedUserId);
        console.log('📝 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        
        const url = `http://${apiHost}:8080/conversations/${blockedUserId}/block`;
        const options = {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}) // Send empty JSON body
        };
        
        console.log('🌐 Request URL:', url);
        console.log('📤 Request options:', JSON.stringify(options, null, 2));
        
        const res = await fetch(url, options);
        
        console.log('📥 Response status:', res.status);
        console.log('📥 Response ok:', res.ok);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to block user:", err);
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
        console.error("Failed to unblock user:", err);
        throw err;
    }
}

// Game Invitation Functions
export async function sendGameInvitation(toUserId: number, gameType: string = 'pong') {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/game-invitations/send`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ toUserId, gameType })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to send game invitation:", err);
        throw err;
    }
}

export async function getGameInvitations() {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/game-invitations/received`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to get game invitations:", err);
        throw err;
    }
}

export async function getSentGameInvitations() {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/game-invitations/sent`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to get sent game invitations:", err);
        throw err;
    }
}

export async function acceptGameInvitation(invitationId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/game-invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to accept game invitation:", err);
        throw err;
    }
}

export async function rejectGameInvitation(invitationId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/game-invitations/${invitationId}/reject`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to reject game invitation:", err);
        throw err;
    }
}

// User Profile Functions
export async function getUserProfile(userId: number) {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getUserById`, {
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
        console.error("Failed to get user profile:", err);
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
        console.error("Failed to search users:", err);
        throw err;
    }
}

export async function getAllUsers() {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getAllUsers`, {
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Failed to get all users:", err);
        throw err;
    }
}