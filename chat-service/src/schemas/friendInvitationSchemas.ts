/**
 * Schema for friend invitation parameter
 */
export const FriendInvitationParamSchema = {
    type: 'object',
    properties: {
        otherUserId: {
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'ID of the other user'
        }
    },
    required: ['otherUserId']
} as const;

export interface FriendInvitationParamType {
    otherUserId: string;
}

/**
 * Response schemas
 */
export const FriendInvitationSuccessSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        error: { type: 'string' }
    },
    required: ['success']
} as const;

export interface FriendInvitationSuccessType {
    success: boolean;
    message?: string;
    error?: string;
}
