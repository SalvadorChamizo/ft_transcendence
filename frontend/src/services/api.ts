import { getAccessToken } from "../state/authState";

export async function pingGateway(): Promise<string> {
    try {
        const token = getAccessToken();
        const res = await fetch("http://localhost:8080/ping" , {
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
        const res = await fetch("http://localhost:8080/conversations", {
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
        const res = await fetch(`http://localhost:8080/conversations/1/messages`, {
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
        const res = await fetch(`http://localhost:8080/conversations/${otherUserId}/messages`, {
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
        const res = await fetch(`http://localhost:8080/conversations/${blockedUserId}/block`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
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
        const res = await fetch(`http://localhost:8080/conversations/${blockedUserId}/block`, {
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