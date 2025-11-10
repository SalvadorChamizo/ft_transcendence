/**
 * Schema for notification
 */
export const NotificationSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        user_id: { type: 'number' },
        title: { type: ['string', 'null'] },
        content: { type: 'string' },
        message_type: { type: 'string' },
        created_at: { type: 'string' },
        delivered_at: { type: ['string', 'null'] },
        read_at: { type: ['string', 'null'] }
    },
    required: ['id', 'user_id', 'content', 'message_type', 'created_at']
} as const;

export interface NotificationType {
    id: number;
    user_id: number;
    title: string | null;
    content: string;
    message_type: string;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
}

/**
 * Schema for sending a notification
 */
export const SendNotificationSchema = {
    type: 'object',
    properties: {
        content: {
            type: 'string',
            minLength: 1,
            description: 'Notification content'
        },
        message_type: {
            type: 'string',
            description: 'Type of notification message'
        },
        title: {
            type: 'string',
            description: 'Notification title'
        }
    },
    required: ['content']
} as const;

export interface SendNotificationType {
    content: string;
    message_type?: string;
    title?: string | null;
}

/**
 * Schema for notification ID parameter
 */
export const NotificationIdParamSchema = {
    type: 'object',
    properties: {
        notId: {
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'Notification ID'
        }
    },
    required: ['notId']
} as const;

export interface NotificationIdParamType {
    notId: string;
}

/**
 * Schema for update notifications body
 */
export const UpdateNotificationsBodySchema = {
    type: 'object',
    properties: {
        userId: {
            type: 'number',
            minimum: 1,
            description: 'User ID'
        }
    },
    required: ['userId']
} as const;

export interface UpdateNotificationsBodyType {
    userId: number;
}

/**
 * Response schemas
 */
export const NotificationsListResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        notifications: {
            type: 'array',
            items: NotificationSchema
        }
    },
    required: ['success', 'notifications']
} as const;

export const SpecificNotificationResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        notification: {
            type: 'array',
            items: NotificationSchema
        }
    },
    required: ['success', 'notification']
} as const;

export const NotificationSuccessResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        id: { type: 'number' },
        updated: { type: 'number' }
    },
    required: ['success']
} as const;

export const NotificationErrorResponseSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' }
    },
    required: ['error']
} as const;
