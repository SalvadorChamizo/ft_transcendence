// Imports of repositories
import * as gameInvitationRepo from "../repositories/gameInvitationRepository";
import * as blockRepo from "../repositories/blockRepository";
import * as websocketService from "./websocketService";

export async function sendGameInvitation(fromUserId: number, toUserId: number, gameType: string = 'pong') {
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

    // 4. Create the invitation (expires in 2 minutes by default)
    const invitationId = gameInvitationRepo.createInvitation(fromUserId, toUserId, gameType, 2);

    // 5. Send real-time notification via WebSocket if recipient is connected
    try {
        const invitationData = {
            id: invitationId,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            game_type: gameType,
            timestamp: new Date().toISOString()
        };
        
        websocketService.notifyGameInvitation(toUserId, invitationData);
        console.log(`🎮 Game invitation sent from user ${fromUserId} to user ${toUserId}`);
    } catch (wsError) {
        console.warn(`Failed to send WebSocket notification for game invitation:`, wsError);
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

export async function acceptGameInvitation(invitationId: number, userId: number) {
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

    // 4. Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
        gameInvitationRepo.updateInvitationStatus(invitationId, 'expired');
        throw new Error("Invitation has expired");
    }

    // 5. Update invitation status to accepted
    gameInvitationRepo.updateInvitationStatus(invitationId, 'accepted');

    // 6. Notify the sender via WebSocket
    try {
        const acceptanceData = {
            invitation_id: invitationId,
            from_user_id: invitation.from_user_id,
            to_user_id: userId,
            game_type: invitation.game_type
        };
        
        websocketService.notifyGameInvitationAccepted(invitation.from_user_id, acceptanceData);
        console.log(`✅ Game invitation ${invitationId} accepted by user ${userId}`);
    } catch (wsError) {
        console.warn(`Failed to send acceptance notification:`, wsError);
    }

    return { 
        success: true, 
        message: "Invitation accepted",
        gameType: invitation.game_type,
        opponentId: invitation.from_user_id
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
