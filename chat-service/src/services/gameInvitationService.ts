// Imports of repositories
import * as gameInvitationRepo from "../repositories/gameInvitationRepository";
import * as blockRepo from "../repositories/blockRepository";
import * as websocketService from "./websocketService";
import { findConversation, createConversation } from "../repositories/conversationRepository";
import { createMessage } from "../repositories/messageRepository";


export async function sendGameInvitation(fromUserId: number, toUserId: number, gameType: string = 'pong') {

    if (fromUserId === toUserId) {
        throw new Error("Cannot invite yourself to a game");
    }

    const blocked = blockRepo.areUsersBlocked(fromUserId, toUserId);
    if (blocked) {
        throw new Error("Cannot send invitation: users are blocked");
    }

    let roomId: string | undefined = undefined;
    console.log("Entra en sendInvitation");
    if (gameType === 'pong') {
        try {
            // Create private room via gateway so behaviour matches frontend's private room creation
            const res = await fetch(`http://gateway:8080/game/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ private: true })
            });
            if (res.ok) {
                const data = await res.json();
                roomId = data.roomId ?? data.id ?? data.room_id ?? null;
            } else {
                const text = await res.text();
                console.warn("Failed to create private room via gateway for invitation:", res.status, text);
            }
        } catch (err) {
            console.warn('Error creating private room via gateway for invitation:', err);
        }
    }

    // If we couldn't create a room, abort the invitation flow to avoid sending invalid links
    if (!roomId) {
        throw new Error('Failed to create private room for invitation');
    }

    let conversation = await findConversation(fromUserId, toUserId);
    if (!conversation) {
        await createConversation(fromUserId, toUserId);
        conversation = await findConversation(fromUserId, toUserId);
    }
    if (roomId && conversation) {
        const joinUrl = `#/private-remote-pong?room=${roomId}`;
        const inviteHtml = `🎮 Invitación a Pong: <b>${roomId}</b> <a href='${joinUrl}' class='join-remote-pong-btn'>Unirse a la sala</a>`;
        await createMessage(conversation.id, fromUserId, inviteHtml, 'pong-invite');
    }

    const invitationId = gameInvitationRepo.createInvitation(fromUserId, toUserId, gameType, 2, roomId);

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
            content: `🎮 Invitación a Pong: <b>${roomId}</b> <a href="#/private-remote-pong?room=${roomId}">Unirse</a>`,
            timestamp: invitationData.timestamp,
            data: invitationData
        };
        websocketService.sendToConversation(fromUserId, toUserId, message);
        // Diagnostic: check if recipient was online when sending
        try {
            const recipientOnline = websocketService.isUserConnected(toUserId);
            console.log(`🎮 Game invitation attempted from ${fromUserId} -> ${toUserId}. Recipient online: ${recipientOnline}`);
        } catch (e) {
            console.log(`🎮 Game invitation message sent to conversation between ${fromUserId} and ${toUserId}`);
        }
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

    gameInvitationRepo.expireOldInvitations();

    return gameInvitationRepo.getPendingInvitationsForUser(userId);
}

export function getSentInvitations(userId: number) {

    gameInvitationRepo.expireOldInvitations();

    return gameInvitationRepo.getSentInvitations(userId);
}

export async function acceptGameInvitation(invitationId: number, userId: number) {

    const invitation = gameInvitationRepo.getInvitationById(invitationId);
    
    if (!invitation) {
        throw new Error("Invitation not found");
    }

    if (invitation.status !== 'pending') {
        throw new Error("Invitation has expired");
    }

    gameInvitationRepo.updateInvitationStatus(invitationId, 'accepted');

    if (invitation.room_id) {
        try {
            await fetch(`http://pong-service:7000/rooms/${invitation.room_id}/add-player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ playerId: String(userId) })
            });
        } catch (err) {
            console.warn('No se pudo unir al usuario a la sala remota:', err);
        }
    }

    try {
        const acceptanceData = {
            invitation_id: invitationId,
            from_user_id: invitation.from_user_id,
            to_user_id: userId,
            game_type: invitation.game_type,
            room_id: invitation.room_id || null
        };

        websocketService.notifyGameInvitationAccepted(invitation.from_user_id, acceptanceData);

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

    const invitation = gameInvitationRepo.getInvitationById(invitationId);
    
    if (!invitation) {
        throw new Error("Invitation not found");
    }

    if (invitation.to_user_id !== userId) {
        throw new Error("You are not the recipient of this invitation");
    }

    if (invitation.status !== 'pending') {
        throw new Error(`Invitation is ${invitation.status}`);
    }

    gameInvitationRepo.updateInvitationStatus(invitationId, 'rejected');

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
