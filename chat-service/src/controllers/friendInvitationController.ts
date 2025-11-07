import { FastifyRequest, FastifyReply } from "fastify"
import { createFriendInvitation,
         acceptFriendInvitation,
         rejectFriendInvitation,
         setNewFriend } from "../services/friendInvitationService"


export async function inviteFriendController(req: FastifyRequest, reply: FastifyReply) {
    const { otherUserId } = req.params as { otherUserId: string };
	const userId = req.headers["x-user-id"];

    try {
        if (!userId || isNaN(userId)) {
            return reply.code(200).send({ success: false, error: "Invalid or missing user ID" });
        }
        if (!otherUserId || isNaN(Number(otherUserId))) {
            return reply.code(200).send({ success: false, error: "Invalid or missing other user ID" });
        }

        const res = await createFriendInvitation(Number(userId), Number(otherUserId));
        if (!res?.success) {
            return reply.code(200).send({ success: false, error: res?.message });
        }

        return reply.code(200).send({ 
            success: true, 
            message: "Friend invitation sent successfully" 
        });
    } catch (err: any) {
        reply.code(200).send({ success: false, error: err.error })
    }
}

export async function acceptFriendInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { otherUserId } = req.params as { otherUserId: string };
    const userId = Number(req.headers["x-user-id"]);

    try {

        if (!userId || isNaN(userId)) {
            return reply.code(200).send({ success: false, error: "Invalid or missing user ID" });
        }
        if (!otherUserId || isNaN(Number(otherUserId))) {
            return reply.code(200).send({ success: false, error: "Invalid or missing other user ID" });
        }

        const res = await acceptFriendInvitation(userId, Number(otherUserId));
        if (!res.success) {
            return reply.code(200).send({ success: false, error: res.message });
        }

        const newFriend = await setNewFriend(userId, Number(otherUserId));
        if (!newFriend) {
            console.warn(`⚠️ Failed to persist friendship between ${userId} and ${otherUserId}`);
            return reply.code(200).send({ success: false, error: "Failed to add new friend" });
        }

        return reply.code(200).send({ 
            success: true, 
            message: "Friend invitation accepted and friendship created successfully" 
        });

    } catch (err: any) {
        console.error(`❌ acceptFriendInvitationController error:`, err);
        return reply.code(200).send({ 
            success: false, 
            error: err.message || "Unexpected server error" 
        });
    }
}

export async function rejectFriendInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { otherUserId } = req.params as { otherUserId: string };
    const userId = req.headers["x-user-id"];

    try {

        if (!userId || isNaN(userId)) {
            return reply.code(200).send({ success: false, error: "Invalid or missing user ID" });
        }
        if (!otherUserId || isNaN(Number(otherUserId))) {
            return reply.code(200).send({ success: false, error: "Invalid or missing other user ID" });
        }

        const res = await rejectFriendInvitation(Number(userId), Number(otherUserId));
        if (!res.success) {
            return reply.code(200).send({ success: false, error: res.message });
        }

        return reply.code(200).send({ 
            success: true, 
            message: "Friend invitation rejected successfully" 
        });
    } catch (err: any) {
        reply.code(200).send({ success: false, error: err.error });
    }
}