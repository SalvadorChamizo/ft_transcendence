import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, getUser } from "../services/usersService";

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
	const { username, password } = req.body as { username: string; password: string };

	const user = await getUser(username);
	try {
		if (user)
			throw new Error("Invalid username");
		const result = await registerUser(username, password);
		return reply.send(result);
	} 
	catch (err: any) {
		return reply.code(400).send({ error: "Username already exists" });
	}
}

export async function userGetter(req: FastifyRequest, reply: FastifyReply) {
	const { username } = req.body as { username: string };

	try {
		const user = await getUser(username);
		return reply.send([{ 
			id: user.id, 
			username: user.username,
			password: user.password
		}]);
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}