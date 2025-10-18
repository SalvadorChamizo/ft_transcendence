import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, register42User, changeUsername , changeEmail , getUserByUsername, getUserById, getUserByEmail, 
	getUserAvatar } from "../services/usersService";

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

export async function usernameChanger(req: FastifyRequest, reply: FastifyReply) {
	const { newUsername } = req.body as { newUsername: string };
	const userId = req.headers["x-user-id"];

	if (!userId) {
		return reply.code(401).send({ error: "Not authenticated" });
	}

	try {
		const existingUser = await getUserByUsername(newUsername);
		if (existingUser) {
			return reply.code(400).send({ error: "Username already exists" });
		}
		console.log("Controller -> Changing username for user ID:", userId);
		console.log("Controller -> New username:", newUsername);
		const result = await changeUsername(userId, newUsername);
		return reply.send({ result });
	} catch (err: any) {
		console.error("Error occurred during username change:", err);
		return reply.code(400).send({ error: err.message });
	}
}

export async function emailChanger(req: FastifyRequest, reply: FastifyReply) {
	const { newEmail } = req.body as { newEmail: string };
	const userId = req.headers["x-user-id"];

	if (!userId) {
		return reply.code(401).send({ error: "Not authenticated" });
	}

	try {
		const existingUser = await getUserByEmail(newEmail);
		if (existingUser) {
			return reply.code(400).send({ error: "Email already exists" });
		}
		console.log("Controller -> Changing email for user ID:", userId);
		console.log("Controller -> New email:", newEmail);
		const result = await changeEmail(userId, newEmail);
		return reply.send({ result });
	} catch (err: any) {
		console.error("Error occurred during email change:", err);
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

export async function avatarGetterController(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.headers["x-user-id"];

	console.log("Fetching avatar for user ID:", userId);
	if (!userId) {
		return reply.code(401).send({ error: "Not authenticated" });
	}

	try {
		const avatar = await getUserAvatar(userId);
		return (
			reply
				.type("image/jpeg")
				.send( avatar )
		);
	} catch (err: any) {
		console.error("Error occurred during avatar retrieval");
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
	//delete this line
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
