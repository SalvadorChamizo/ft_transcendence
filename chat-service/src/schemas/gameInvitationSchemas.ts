/**
 * Schema for sending a game invitation
 */
export const SendGameInvitationSchema = {
    type: 'object',
    properties: {
        toUserId: {
            type: 'number',
            minimum: 1,
            description: 'ID of the user to invite'
        },
        gameType: {
            type: 'string',
            description: 'Type of game (classic, custom, etc.)'
        }
    },
    required: ['toUserId']
} as const;

export interface SendGameInvitationType {
    toUserId: number;
    gameType?: string;
}

/**
 * Schema for game invitation ID parameter
 */
export const GameInvitationIdParamSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            pattern: '^[0-9]+$',
            description: 'Game invitation ID'
        }
    },
    required: ['id']
} as const;

export interface GameInvitationIdParamType {
    id: string;
}

/**
 * Response schemas
 */
export const GameInvitationResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'number' },
        from_user_id: { type: 'number' },
        to_user_id: { type: 'number' },
        game_type: { type: 'string' },
        status: { type: 'string' },
        created_at: { type: 'string' },
        expires_at: { type: 'string' },
        room_id: { type: ['string', 'null'] }
    }
} as const;

export const GameInvitationsListResponseSchema = {
    type: 'object',
    properties: {
        invitations: {
            type: 'array',
            items: GameInvitationResponseSchema
        }
    },
    required: ['invitations']
} as const;

export const GameInvitationSuccessResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        invitationId: { type: 'number' },
        expiresIn: { type: 'string' },
        gameType: { type: 'string' },
        opponentId: { type: 'number' },
        room_id: { type: ['string', 'null'] }
    },
    required: ['success']
} as const;

export const GameInvitationErrorResponseSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' }
    },
    required: ['error']
} as const;
