import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, getUserByUsername, getUserByEmail } from "../services/usersService";

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
	const { email, username, password } = req.body as { email: string; username: string; password: string };

	const userName = await getUserByUsername(username);
	const userEmail = await getUserByEmail(email);
	try {
		if (userName)
			throw new Error("Username already exists");
		if (userEmail)
			throw new Error("Email already exists");
		const hashed = await bcrypt.hash(password, 10);
		const result = await registerUser(email, username, hashed);
		return reply.send(result);
	} 
	catch (err: any) {
		console.error("Error occurred during user registration:", err);
		return reply.code(400).send({ error: err.message });	
	}
}

export async function userGetter(req: FastifyRequest, reply: FastifyReply) {
	const { username } = req.body as { username: string };

	try {
		const user = await getUserByUsername(username);
		return reply.send({
			id: user.id,
			username: user.username
		});
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function passwordControl(req: FastifyRequest, reply: FastifyReply) {
	const { username, password } = req.body as { username: string; password: string };

	try {
		const user = await getUserByUsername(username);
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