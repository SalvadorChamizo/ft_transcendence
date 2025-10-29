import { FastifyRequest, FastifyReply } from "fastify";
import { 
    getAllUsersService,
    getFriendsService,
    addFriendService,
	removeFriendService,
	checkFriendService
} from "../services/friendsService";

export async function getAllUsersController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const users = await getAllUsersService();
        
        const userList = users.map(user => ({
            id: user.id,
            username: user.username
        }));

        return reply.send({ users: userList });
    } catch (error) {
        console.error("Error getting all users:", error);
        return reply.code(500).send({ 
            error: "Failed to get users" 
        });
    }
}

export async function getFriendController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];

	try {
		const friends = await getFriendsService(Number(userId));
		return reply.send({
			friends: friends,
			count: friends.length
		});
	}
	catch (err: any) {
		console.error("Error getting friends:", err);
		return reply.code(400).send({ error: err.message });
	}
}

export async function addFriendController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];
	const { friendId } = req.body as { friendId: string };

	try {
		if (userId === friendId){
			throw new Error("Same Users Ids");
		}
		const result = await addFriendService(Number(userId), Number(friendId));
		if (result.changes === 2) {
			console.log("Success adding friend");
		} else {
			throw new Error("Error adding friends");
		}
	}
	catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function removeFriendController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];
	const { friendId } = req.body as { friendId: string };

	try {
		if (userId === friendId){
			throw new Error("Same Users Ids");
		}
		const result = await removeFriendService(Number(userId), Number(friendId));
		
		if (result.changes > 0) {
			console.log("Success removing friend");
		} else {
			throw new Error("Error removing friends");
		}
	}
	catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function checkFriendController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];
	const { friendId } = req.body as { friendId: string };

	try {
		if (userId === friendId){
			throw new Error("Same Users Ids");
		}
		const result = await checkFriendService(Number(userId), Number(friendId));
		
		return reply.send({ result });
	}
	catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}