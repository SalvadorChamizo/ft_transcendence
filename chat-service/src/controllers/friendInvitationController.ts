import { FastifyRequest, FastifyReply } from "fastify"
import { createFriendInvitation,
         acceptFriendInvitation,
         setNewFriend } from "../services/friendInvitationService"


export async function inviteFriendController(req: FastifyRequest, reply: FastifyReply) {
    const { otherUserId } = req.params as { otherUserId: string };
	const userId = req.headers["x-user-id"];

    console.log("userId:", userId);
    console.log("otherUserId:", otherUserId);
    try {
        const res = await createFriendInvitation(userId, Number(otherUserId));
        reply.code(200).send({ success: true });
    } catch (err: any) {
        reply.code(200).send({ success: false, error: err.error })
    }
}

export async function acceptFriendInvitationController(req: FastifyRequest, reply: FastifyReply) {
    const { otherUserId } = req.params as { otherUserId: string };
    const userId = req.headers["x-user-id"];

    try {
        const res = await acceptFriendInvitation(userId, Number(otherUserId));

        if (res.success && res.success === true ) {
            const response = await setNewFriend(userId, Number(otherUserId));

        }
        reply.code(200).send({ success: true });
    } catch (err: any) {
        reply.code(200).send({ success: false, error: err.error });
    }
}