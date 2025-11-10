/**
 * Schema for sending a message
 */
export const SendMessageSchema = {
    type: 'object',
    properties: {
        recipientId: { 
            type: 'number',
            minimum: 1,
            description: 'ID of the recipient user'
        },
        content: { 
            type: 'string',
            minLength: 1,
            maxLength: 5000,
            description: 'Message content'
        },
        messageType: {
            type: 'string',
            description: 'Type of message (text, image, etc.)'
        }
    },
    required: ['recipientId', 'content']
} as const;

export interface SendMessageType {
    recipientId: number;
    content: string;
    messageType?: string;
}

/**
 * Schema for get messages query parameters
 */
export const GetMessagesQuerySchema = {
    type: 'object',
    properties: {
        limit: {
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'Maximum number of messages to retrieve'
        }
    }
} as const;

export interface GetMessagesQueryType {
    limit?: string;
}

/**
 * Schema for user ID parameter
 */
export const UserIdParamSchema = {
    type: 'object',
    properties: {
        userId: {
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'User ID'
        }
    },
    required: ['userId']
} as const;

export interface UserIdParamType {
    userId: string;
}

/**
 * Response schemas
 */
export const MessageResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        conversation_id: { type: 'number' },
        sender_id: { type: 'number' },
        content: { type: 'string' },
        message_type: { type: 'string' },
        created_at: { type: 'string' },
        read_at: { type: ['string', 'null'] },
        delivered_at: { type: ['string', 'null'] }
    }
} as const;

export const ConversationResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        otherUserId: { type: 'number' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
    },
    required: ['id', 'otherUserId']
} as const;

export const ConversationsResponseSchema = {
    type: 'object',
    properties: {
        conversations: {
            type: 'array',
            items: ConversationResponseSchema
        }
    }
} as const;

export const MessagesResponseSchema = {
    type: 'object',
    properties: {
        messages: {
            type: 'array',
            items: MessageResponseSchema
        }
    }
} as const;

export const BlockedUsersResponseSchema = {
    type: 'object',
    properties: {
        blockedUsers: {
            type: 'array',
            items: { type: 'number' }
        }
    }
} as const;

export const SuccessResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
    },
    required: ['success', 'message']
} as const;

export const ErrorResponseSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' }
    },
    required: ['error']
} as const;

/**
 * Schema for delete user data response
 */
export const DeleteUserDataResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        conversationsDeleted: { type: 'number' },
        blocksDeleted: { type: 'number' },
        usersNotified: { type: 'number' }
    },
    required: ['success', 'conversationsDeleted', 'blocksDeleted', 'usersNotified']
} as const;
