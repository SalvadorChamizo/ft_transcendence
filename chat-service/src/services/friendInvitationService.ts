import * as blockRepo from "../repositories/blockRepository"
import { createInvitation, getInvitationByUsers, updateInvitationStatus } from "../repositories/friendInvitationRepository";
import { findConversation, createConversation } from "../repositories/conversationRepository";
import { createMessage, updateMessageTypeByInvitation } from "../repositories/messageRepository";
import * as websocketService from "../services/websocketService";

export async function createFriendInvitation(userId: number, otherUserId: number) {

    if (userId === otherUserId) {
        throw new Error("Cannot invite yourself to a game");
    }

    const blocked = blockRepo.areUsersBlocked(userId, otherUserId);
    if (blocked) {
        throw new Error("Cannot send invitation: users are blocked");
    }

    let conversation = await findConversation(userId, otherUserId);
    if (!conversation) {
        await createConversation(userId, otherUserId);
        conversation = await findConversation(userId, otherUserId);
    }

    const invitationCheck = await getInvitationByUsers(userId, otherUserId);
    if (invitationCheck)
        throw new Error("Already send invitation to this user");

    if (conversation) {
        const inviteHtml = `Do you wanna be my friend? :)`;
        const messageId = await createMessage(conversation.id, userId, inviteHtml, 'friend-invite');

        const invitation = await createInvitation(userId, otherUserId, "friend", 1440, messageId);
        if (!invitation)
            throw new Error("Failed to create friend invitation");
        
        try {
            const invitationData = {
                id: invitation,
                from_user_id: userId,
                to_user_id: otherUserId,
                type: "friend",
                status: "pending",
                room_id: null,
                timestamp: new Date().toISOString(),
                event_type: 'friend_invitation_message'
            };
            const message = {
                type: 'message' as 'message',
                userId: userId,
                recipientId: otherUserId,
                content: `Do you wanna be my friend? :)`,
                timestamp: invitationData.timestamp,
                data: invitationData
            };
            websocketService.sendToConversation(userId, otherUserId, message);
            try {
                const recipientOnline = websocketService.isUserConnected(otherUserId);
                console.log(`🎮 Game invitation attempted from ${userId} -> ${otherUserId}. Recipient online: ${recipientOnline}`);
            } catch (e) {
                console.log(`🎮 Game invitation message sent to conversation between ${userId} and ${otherUserId}`);
            }
            console.log(`Friend invitation message sent to conversation between ${userId} and ${otherUserId}`);
        } catch (wsError) {
            console.warn(`Failed to send friend invitation message:`, wsError);
        }
    
        return { 
            success: true, 
            invitation, 
            message: "Friend invitation sent successfully",
            expiresIn: "1 day"
        };
    }
}

export async function setNewFriend(userId: number, otherUserId: number) {
    
    const res = fetch(`http://user-management-service:8082/addFriend`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
                    "x-user-id": `${userId}`,
         },
        body: JSON.stringify({ friendId: otherUserId })
    })
}

export async function acceptFriendInvitation(userId: number, otherUserId: number) {

    const invitation = getInvitationByUsers(userId, otherUserId);
    
    if (!invitation) {
        throw new Error("Invitation not found");
    }

    if (invitation.status !== 'pending') {
        throw new Error("Invitation has expired");
    }

    await updateInvitationStatus(invitation.id, 'accepted');
    updateMessageTypeByInvitation(invitation.id, 'friend-invite-accepted');

    try {
        const acceptanceData = {
            invitation_id: invitation.id,
            user_id: invitation.user_id,
            other_user_id: userId,
            type: invitation.type,
            room_id: invitation.room_id || null
        };

        //websocketService.notifyFriendInvitationAccepted(invitation.user_id, acceptanceData);
        console.log(` Friend invitation ${invitation.id} accepted by user ${userId}`);
    } catch (wsError) {
        console.warn(`Failed to send acceptance notification:`, wsError);
    }

    return { 
        success: true, 
        message: "Invitation accepted",
        type: invitation.type,
        opponentId: invitation.user_id,
        room_id: invitation.room_id || null
    };
}