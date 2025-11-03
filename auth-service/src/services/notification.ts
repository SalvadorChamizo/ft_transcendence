export async function sendNotification(userId: number, title: string | null, content: string) {

    try {
        const res = await fetch(`http://chat-service:8083/conversations/${userId}/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: `${title}`,
                content: `${content}`,
                message_type: "system"
            })
        });
    } catch (err: any) {
        return { success: false, error: `Failed to send notification to user ${userId}`};
    }
}