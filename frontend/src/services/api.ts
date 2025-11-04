import { refreshAccessToken } from "../state/authState";

export async function addFriend(friendId: number) {
    const token = getAccessToken();
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userId = user.id;
        } catch {}
    }
    const res = await fetch(`http://${apiHost}:8080/users/addFriend`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(userId ? { "x-user-id": userId.toString() } : {})
        },
        body: JSON.stringify({ friendId: friendId.toString() })
    });
    if (!res.ok) throw new Error('Error al añadir amigo');
    return await res.json();
}

export async function removeFriend(friendId: number) {
    const token = getAccessToken();
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userId = user.id;
        } catch {}
    }
    const res = await fetch(`http://${apiHost}:8080/users/removeFriend`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(userId ? { "x-user-id": userId.toString() } : {})
        },
        body: JSON.stringify({ friendId: friendId.toString() })
    });
    if (!res.ok) throw new Error('Error al eliminar amigo');
    return await res.json();
}
// Get user stats by ID (calls backend endpoint)
export async function getUserStatsById(id: number): Promise<{victories: number, defeats: number} | null> {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getResults`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${token}`,
                "x-user-id": id.toString()
            }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
// Get user ID by username (calls backend endpoint)
export async function getUserIdByUsername(username: string): Promise<number | null> {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getUserByName`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.id || null;
    } catch {
        return null;
    }
}

// Get user data by username (calls backend endpoint)
export async function getUserByUsername(username: string): Promise<any | null> {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getUserByName`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Get user data by ID (calls backend endpoint)
export async function getUserById(id: number): Promise<any | null> {
    try {
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/getUserById`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
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
        const data = await res.json();
        // If room_id is not directly in response, check acceptanceData
        if (!data.room_id && data.acceptanceData && data.acceptanceData.room_id) {
            data.room_id = data.acceptanceData.room_id;
        }
        return data;
    } catch (err) {
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
        throw err;
    }
}

export async function getMatchesByPlayerId(playerId: number): Promise<any[]> {
    try {
        let token = getAccessToken();
    let res = await fetch(`http://${apiHost}:8080/game/matches/player/${playerId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // If unauthorized, try refresh once and retry
        if (res.status === 401) {
            await refreshAccessToken();
            token = getAccessToken();
            res = await fetch(`http://${apiHost}:8080/game/matches/player/${playerId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error('Failed fetching player matches');
        }
        return await res.json();
    } 
    catch (err) {
        return [];
    }
}
