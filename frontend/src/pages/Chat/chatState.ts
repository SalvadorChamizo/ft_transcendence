// Active conversation state
let activeConversationId: number | null = null;
let activeConversationName: string = '';
let blockedUsers: Set<number> = new Set(); // Track blocked users
let activeNotificationId: number | null = null;
let activeNotificationName: string = '';
// Caching and performance
const usernameCache: Map<number, string> = new Map();

// Real-time connection tracking
const connectedUsersSet: Set<number> = new Set();

let loadConversationsTimeout: ReturnType<typeof setTimeout> | null = null;
let loadNotificationsTimeout: ReturnType<typeof setTimeout> | null = null;

export function getActiveNotificationId(): number | null {
    return activeNotificationId;
}

export function setActiveNotificationId(newId: number) {
    activeNotificationId = newId;
}

export function getActiveNotificationName(): string | null {
    return activeNotificationName;
}

export function setActiveNotificationName(newName: string) {
    activeNotificationName = newName;
}


export function getActiveConversationId(): number | null {
    return activeConversationId;
}

export function setActiveConversationId(newId: number) {
    activeConversationId = newId;
}

export function getActiveConversationName(): string | null {
    return activeConversationName;
}

export function setActiveConversationName(newName: string) {
    activeConversationName = newName;
}

export function getBlockedUsers(): Set<number> {
    return blockedUsers;
}

export function setBlockedUsers(newBlockedUsers: Set<number>) {
    blockedUsers = newBlockedUsers;
}

export function getLoadConversationsTimeout(): ReturnType<typeof setTimeout> | null {
    return loadConversationsTimeout;
}

export function setLoadConversationsTimeout(newLoadConversationsTimeout: ReturnType<typeof setTimeout>) {
    loadConversationsTimeout = newLoadConversationsTimeout;
}

export function getLoadNotificationsTimeout(): ReturnType<typeof setTimeout> | null {
    return loadNotificationsTimeout;
}

export function setLoadNotificationsTimeout(newLoadNotificationsTimeout: ReturnType<typeof setTimeout>) {
    loadNotificationsTimeout = newLoadNotificationsTimeout;
}

export function getConnectedUsersSet(): Set<number> {
    return connectedUsersSet;
}

/*export function setConnectedUsersSet(newBlockedUsers: Set<number>) {
    connectedUsersSet = newBlockedUsers;
}*/

export function getUsernameCache(): Map<number, string> {
    return usernameCache;
}

/*export function setUsernameCache(newBlockedUsers: Map<number, string>) {
    usernameCache = newBlockedUsers;
}*/