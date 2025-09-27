import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, getUser } from "../services/usersService";

//sudo docker logs trascende-user-management-service-1
//sudo docker exec -it cbb022043b70 bash

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
	const { email, username, password } = req.body as { email: string; username: string; password: string };

	const user = await getUser(username);
	try {
		if (user)
			throw new Error("Invalid username");
		const hashed = await bcrypt.hash(password, 10);
		const result = await registerUser(email, username, hashed);
		return reply.send(result);
	} 
	catch (err: any) {
		console.error("Error occurred during user registration:", err);
		return reply.code(400).send({ error: "Username already exists" });
	}
}

export async function userGetter(req: FastifyRequest, reply: FastifyReply) {
	const { username } = req.body as { username: string };

	try {
		const user = await getUser(username);
		console.log("user.id:", user.id);
		console.log("user.username:", user.username);
		console.log("user.password:", user.password);
		return reply.send({ 
			id: user.id, 
			username: user.username,
			password: user.password
		});
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function passwordControl(req: FastifyRequest, reply: FastifyReply) {
	const { username, password } = req.body as { username: string; password: string };

	try {
		const user = await getUser(username);
		if (!user.id) 
			throw new Error("User not found");
		const valid = await bcrypt.compare(password, user.password);
		if (!valid)
			throw new Error("Invalid password");
		return reply.send({ message: "Password is valid" });
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}