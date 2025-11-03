import { getCurrentUserId, loadAllUsers, updateConnectionStatus } from "./chatUtils"
import { websocketClient, ChatMessage } from "../../services/websocketClient";
import { addMessageToUI } from "./chatMessages";
import { loadConversationsDebounced } from "./chatConversations";
import { getConnectedUsersSet, getActiveConversationId } from "./chatState";
import { handleUserSearch } from "./chatUserSearch";

export async function initializeWebSocket() {
    try {
        const userId = getCurrentUserId();
            
        await websocketClient.connect(userId);
            
        // Set up message handler for incoming messages

        websocketClient.onMessage((message: ChatMessage) => {
            // Handle special server-sent events embedded in message.data
            try {
                if (message.type === 'message' && message.data && message.data.event_type === 'game_invitation_accepted') {
                    // If acceptance contains a room_id, redirect to private remote pong
                    const room = message.data.room_id || message.data.roomId || null;
                    if (room) {
                        try {
                            // Store pending id (optional) and navigate
                            localStorage.setItem('pendingRemoteRoomId', String(room));
                        } catch (e) {}
                        window.location.hash = `#/private-remote-pong?room=${room}`;
                        return;
                    }
                }
            } catch (e) {}

            if (message.type === 'message') {
                addMessageToUI({
                    ...message,
                    isSent: false
                });
                loadConversationsDebounced();
            } else if (message.type === 'user_connected') {
                if (message.userId) {
                    getConnectedUsersSet().add(message.userId);
                    updateActiveContactStatus();
                    updateUserSearchModalStatus();
                }
            } else if (message.type === 'user_disconnected') {
                if (message.userId) {
                    getConnectedUsersSet().delete(message.userId);
                    updateActiveContactStatus();
                    updateUserSearchModalStatus();
                }
            } else if (message.type === 'connected_users_list') {
                getConnectedUsersSet().clear();
                if (Array.isArray(message.data)) {
                    message.data.forEach((userId: number) => getConnectedUsersSet().add(userId));
                }
                updateActiveContactStatus();
                updateUserSearchModalStatus();
            }
        });

        // Actualiza el estado online/offline en el modal de búsqueda de usuarios si está abierto
        async function updateUserSearchModalStatus() {
            const modal = document.getElementById('new-chat-modal');
            if (modal && modal.style.display !== 'none') {
                const searchInput = document.getElementById('user-search') as HTMLInputElement;
                const query = searchInput ? searchInput.value.trim() : '';
                if (query) {
                    await handleUserSearch(query);
                } else {
                    await loadAllUsers();
                }
            }
        }

        // Función para actualizar el estado del contacto activo
        function updateActiveContactStatus() {

            const activeConversationId = getActiveConversationId();
            if (activeConversationId != null) {
                const contactStatus = document.getElementById('contact-status');
                if (contactStatus) {
                    if (getConnectedUsersSet().has(activeConversationId)) {
                        contactStatus.textContent = 'Online';
                        contactStatus.style.color = '#25D366';
                    } else {
                        contactStatus.textContent = 'Offline';
                        contactStatus.style.color = '#ff4444';
                    }
                }
            }
        }
            
        // Update connection status in UI
        updateConnectionStatus(true);
            
    } catch (error) {
        updateConnectionStatus(false);
    }
}