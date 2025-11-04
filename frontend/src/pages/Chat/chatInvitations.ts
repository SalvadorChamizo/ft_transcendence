import { getActiveConversationId } from "./chatState";
import { getAccessToken } from "../../state/authState";

const apiHost = `${window.location.hostname}`

export async function acceptFriendInvitation() {
    try {
        const otherUserId = getActiveConversationId();
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/${otherUserId}/accept-friend`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err: any) {
        console.log("Error:", err);
    }
}

export async function checkAlreadyFriend() {
    try {
        const otherUserId = getActiveConversationId();

        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/users/checkFriend`, {
            method: 'GET',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ friendId: otherUserId })
        });
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const friend = await res.json();
        if (friend)
            return true;
        else
            return false;
    } catch (err) {
    }
}

export async function sendFriendInvitation() {
    try {
        const otherUserId = getActiveConversationId();
        const token = getAccessToken();
        const res = await fetch(`http://${apiHost}:8080/conversations/${otherUserId}/invite-friend`, {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
    }
}
