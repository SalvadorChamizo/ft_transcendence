export const CHAT_CONFIG = {
    DEBOUNCE_DELAY: 500,
    SEARCH_DEBOUNCE_DELAY: 300,
    MIN_SEARCH_CHARS: 2,
    GAME_REDIRECT_DELAY: 2000,
    USERNAME_LOADING_DELAY: 100
} as const;

export const UI_MESSAGES = {
    LOADING: 'Loading...',
    SENDING_MESSAGE: 'Sending message...',
    MESSAGE_SENT_SUCCESS: '✅ Message sent successfully!',
    MESSAGE_SENT_HTTP_ONLY: '✅ Message sent via HTTP (WebSocket offline)',
    NO_CONVERSATION_SELECTED: 'No conversation selected',
    NO_NOTIFICATION_SELECTED: 'No notification selected',
    MESSAGE_INPUT_NOT_FOUND: 'Message input not found',
    ENTER_MESSAGE: 'Please enter a message',
    LOADING_CONVERSATIONS: 'Loading conversations...',
    LOADING_NOTIFICATIONS: 'Loading notifications...',
    NO_CONVERSATIONS_FOUND: 'No conversations found. Send a message to start chatting!',
    NO_NOTIFICATIONS_FOUND: 'No notifications found.',
    LOADING_MESSAGES: 'Cargando mensajes...',
    ERROR_LOADING_MESSAGES: 'Error cargando mensajes',
    SEARCHING_USERS: 'Searching users...',
    LOADING_USERS: 'Loading users...',
    NO_USERS_FOUND: 'No users found',
    NO_OTHER_USERS: 'No other users found',
    TYPE_TO_SEARCH: 'Type at least 2 characters to search...',
    CONNECTED: 'Connected',
    CONNECTING: 'Connecting...',
    DISCONNECTED: 'Disconnected'
} as const;