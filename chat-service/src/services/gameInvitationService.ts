// Imports of repositories
import * as gameInvitationRepo from "../repositories/gameInvitationRepository";
import * as blockRepo from "../repositories/blockRepository";
import * as websocketService from "./websocketService";
import { findConversation, createConversation } from "../repositories/conversationRepository";
import { createMessage } from "../repositories/messageRepository";


export async function sendGameInvitation(fromUserId: number, toUserId: number, gameType: string = 'pong', jwtToken?: string) {
    // 1. Validate that user is not trying to invite themselves
    if (fromUserId === toUserId) {
        throw new Error("Cannot invite yourself to a game");
    }

    // 2. Validate that users are not blocked
    const blocked = blockRepo.areUsersBlocked(fromUserId, toUserId);
    if (blocked) {
        throw new Error("Cannot send invitation: users are blocked");
    }

    // 3. Check if there's already an active invitation between these users
    const existingInvitation = gameInvitationRepo.getActiveInvitationBetweenUsers(fromUserId, toUserId);
    if (existingInvitation) {
        throw new Error("There is already a pending invitation to this user");
    }

    // 4. creates room via HTTP if gameType requires it
    let roomId: string | undefined = undefined;
    if (gameType === 'pong') {
        const gatewayUrl = process.env.GATEWAY_URL || 'http://gateway:8080';
        if (!jwtToken) {
            throw new Error('JWT token must be provided as argument to sendGameInvitation');
        }
        try {
            // Request a PRIVATE room for the invitation so it won't appear in public lobby
            const res = await fetch(`${gatewayUrl}/game/remote-rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ public: false }) // <-- request private room
            });
            if (res.ok) {
                const data = await res.json();
                roomId = data.roomId || data.id || data.room_id;
            } else {
                // do not block invitation creation if room creation fails
                const text = await res.text();
                console.warn("Failed to create private room for invitation:", res.status, text);
            }
        } catch (err) {
            console.warn('Error creating private room for invitation:', err);
            // don't throw; continue without roomId
        }
    }

    // SAve roomId in the invitation and send invite message in conversation
    let conversation = await findConversation(fromUserId, toUserId);
    if (!conversation) {
        await createConversation(fromUserId, toUserId);
        conversation = await findConversation(fromUserId, toUserId);
    }
    if (roomId && conversation) {
        const joinUrl = `#/remote-pong?room=${roomId}`; // link directly to the room
        const inviteHtml = `🎮 Invitación a Pong: <b>${roomId}</b> <a href='${joinUrl}' class='join-remote-pong-btn'>Unirse a la sala</a>`;
        await createMessage(conversation.id, fromUserId, inviteHtml, 'pong-invite');
    }

    // 5. Create the invitation with roomId
    const invitationId = gameInvitationRepo.createInvitation(fromUserId, toUserId, gameType, 2, roomId);

    // 6. Send message in the conversation to both users with the room_id and button
    try {
        const invitationData = {
            id: invitationId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            game_type: gameType,
            room_id: roomId,
            timestamp: new Date().toISOString(),
            event_type: 'game_invitation_message'
        };
        const message = {
            type: 'message' as 'message',
            userId: fromUserId,
            recipientId: toUserId,
            content: `🎮 Invitación a Pong: <b>${roomId}</b> <a href="#/remote-pong?room=${roomId}">Unirse</a>`,
            timestamp: invitationData.timestamp,
            data: invitationData
        };
        websocketService.sendToConversation(fromUserId, toUserId, message);
        console.log(`🎮 Game invitation message sent to conversation between ${fromUserId} and ${toUserId}`);
    } catch (wsError) {
        console.warn(`Failed to send game invitation message:`, wsError);
    }

    return { 
        success: true, 
        invitationId, 
        message: "Game invitation sent successfully",
        expiresIn: "2 minutes"
    };
}

export function getPendingInvitations(userId: number) {
    // Expire old invitations first
    gameInvitationRepo.expireOldInvitations();
    
    // Get pending invitations for the user
    return gameInvitationRepo.getPendingInvitationsForUser(userId);
}

export function getSentInvitations(userId: number) {
    // Expire old invitations first
    gameInvitationRepo.expireOldInvitations();
    
    // Get sent invitations from the user
    return gameInvitationRepo.getSentInvitations(userId);
}

export async function acceptGameInvitation(invitationId: number, userId: number, jwtToken?: string) {
    // 1. Get the invitation
    const invitation = gameInvitationRepo.getInvitationById(invitationId);
    
    if (!invitation) {
        throw new Error("Invitation not found");
    }

    // 3. Validate that invitation is still pending
    if (invitation.status !== 'pending') {
        throw new Error("Invitation has expired");
    }

    // 5. Update invitation status to accepted
    gameInvitationRepo.updateInvitationStatus(invitationId, 'accepted');

    // 6. Join opponent to the room if roomId exists (via HTTP)
    if (invitation.room_id) {
        if (!jwtToken) {
            console.warn('JWT token must be provided as argument to acceptGameInvitation');
        } else {
            try {
                const gatewayUrl = process.env.GATEWAY_URL || 'http://gateway:8080';
                await fetch(`${gatewayUrl}/game/rooms/${invitation.room_id}/add-player`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify({ playerId: String(userId) })
                });
            } catch (err) {
                console.warn('No se pudo unir al usuario a la sala remota:', err);
            }
        }
    }

    // 7. Notify both users with the roomId if exists
    try {
        const acceptanceData = {
            invitation_id: invitationId,
            from_user_id: invitation.from_user_id,
            to_user_id: userId,
            game_type: invitation.game_type,
            room_id: invitation.room_id || null
        };
        // Notify creator
        websocketService.notifyGameInvitationAccepted(invitation.from_user_id, acceptanceData);
        // Notify accepter
        websocketService.notifyGameInvitationAccepted(userId, acceptanceData);
        console.log(` Game invitation ${invitationId} accepted by user ${userId} (room: ${acceptanceData.room_id})`);
    } catch (wsError) {
        console.warn(`Failed to send acceptance notification:`, wsError);
    }

    return { 
        success: true, 
        message: "Invitation accepted",
        gameType: invitation.game_type,
        opponentId: invitation.from_user_id,
        room_id: invitation.room_id || null
    };
}

export async function rejectGameInvitation(invitationId: number, userId: number) {
    // 1. Get the invitation
    const invitation = gameInvitationRepo.getInvitationById(invitationId);
    
    if (!invitation) {
        throw new Error("Invitation not found");
    }

    // 2. Validate that the user is the recipient
    if (invitation.to_user_id !== userId) {
        throw new Error("You are not the recipient of this invitation");
    }

    // 3. Validate that invitation is still pending
    if (invitation.status !== 'pending') {
        throw new Error(`Invitation is ${invitation.status}`);
    }

    // 4. Update invitation status to rejected
    gameInvitationRepo.updateInvitationStatus(invitationId, 'rejected');

    // 5. Notify the sender via WebSocket
    try {
        const rejectionData = {
            invitation_id: invitationId,
            from_user_id: invitation.from_user_id,
            to_user_id: userId,
            game_type: invitation.game_type
        };
        
        websocketService.notifyGameInvitationRejected(invitation.from_user_id, rejectionData);
        console.log(`❌ Game invitation ${invitationId} rejected by user ${userId}`);
    } catch (wsError) {
        console.warn(`Failed to send rejection notification:`, wsError);
    }

    return { 
        success: true, 
        message: "Invitation rejected" 
    };
}
