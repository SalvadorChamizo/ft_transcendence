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