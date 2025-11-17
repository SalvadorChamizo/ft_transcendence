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
		return reply.code(400).send({ error: err.message || "Error obteniendo amigos" });
	}
}

export async function addFriendController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];
	const { friendId } = req.body as { friendId: string };

	console.log("[addFriendController] Headers:", req.headers);
	console.log("[addFriendController] Body:", req.body);

	try {
		if (userId === friendId){
			console.error("[addFriendController] Same Users Ids");
			throw new Error("Same Users Ids");
		}
		const result = await addFriendService(Number(userId), Number(friendId));
		console.log("[addFriendController] addFriendService result:", result);
		if (result.changes === 2) {
			console.log("Success adding friend");
			return reply.send({ success: true, friendId });
		} else {
			console.error("[addFriendController] Error adding friends, result:", result);
			throw new Error("Error adding friends");
		}
	}
	catch (err: any) {
		console.error("[addFriendController] Error:", err);
		if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return reply.code(400).send({ error: 'Ya existe la relación de amistad' });
		}
		return reply.code(400).send({ error: err.message || "Error añadiendo amigo" });
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
			return reply.send({ success: true, friendId });
		} else {
			throw new Error("Error removing friends");
		}
	}
	catch (err: any) {
		console.error("[removeFriendController] Error:", err);
		if (err.code === 'SQLITE_CONSTRAINT') {
			return reply.code(400).send({ error: 'No existe la relación de amistad' });
		}
		return reply.code(400).send({ error: err.message || "Error eliminando amigo" });
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
		
		return reply.send({ isFriend: !!result });
	}
	catch (err: any) {
		console.error("[checkFriendController] Error:", err);
		return reply.code(400).send({ error: err.message || "Error comprobando amistad" });
	}
}