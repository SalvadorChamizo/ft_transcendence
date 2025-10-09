import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, register42User, getUserByUsername, getUserById, getUserByEmail, getIDbyUsername } from "../services/usersService";

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

export async function register42Controller(req: FastifyRequest, reply: FastifyReply) {
	const { email, username } = req.body as { email: string; username: string };

	const userName = await getUserByUsername(username);
	const userEmail = await getUserByEmail(email);
	try {
		if (userName)
			throw new Error("Username already exists");
		if (userEmail)
			throw new Error("Email already exists");
		const result = await register42User(email, username);
		const user = await getUserByUsername(username);
		return reply.send({ result, user });
	} 
	catch (err: any) {
		console.error("Error occurred during user registration:", err);
		return reply.code(400).send({ error: err.message });	
	}
}

export async function userGetterByUsername(req: FastifyRequest, reply: FastifyReply) {
	const { username } = req.body as { username: string };

	try {
		const user = await getUserByUsername(username);
		return reply.send({
			id: user.id,
			username: user.username,
			email: user.email
		});
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function userGetterByEmail(req: FastifyRequest, reply: FastifyReply) {
	const { email } = req.body as { email: string };

	try {
		const user = await getUserByEmail(email);
		return reply.send({
			id: user.id,
			username: user.username,
			email: user.email
		});
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}

export async function userGetterById(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.body as { id: number };

	try {
		const user = await getUserById(id);
		return reply.send({
			id: user.id,
			username: user.username,
			email: user.email
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

export async function getCurrentUserController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];
	const username = req.headers["x-username"];

  if (!userId || !username) {
	console.log("❌ Missing user headers, not authenticated");
	return reply.code(401).send({ error: "Not authenticated" });
  }

	const user = await getUserById(Number(userId));
	return { user };
}

// Get public user profile by ID
export async function getUserProfileController(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.params as { id: string };
	
	try {
		const user = await getUserById(Number(id));
		if (!user) {
			return reply.code(404).send({ error: "User not found" });
		}
		
		// Return public profile (only username, no password/email)
		return reply.send({
			id: user.id,
			username: user.username
		});
	} catch (err: any) {
		return reply.code(400).send({ error: err.message });
	}
}