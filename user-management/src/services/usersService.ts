import * as fs from "fs";
import path from "path";

import { 
	createUser,
	timeRegister,
	usernameChanger,
	emailChanger,
	passwordChanger,
	findUserByUsername,
	findUserById,
	findUserByEmail,
	findIDByUsername,
	findAllUsers,
	removeUser
} from "../repositories/usersRepository";

export async function registerUser(email: string, username: string, password: string) {
	createUser(username, password, email);
	return { message: "User registered successfully" };
}

export async function register42User(email: string, username: string) {
	createUser(username, "", email);
	return { message: "User registered successfully" };
}

export async function registerTime( userId: number ) {
	const result = timeRegister(userId);
	
	if (result.changes === 0) {
  		console.warn(`⚠️ No user found with id ${userId}`);
	}

	return { message: "User login time register successfully" };
}

export async function changeUsername(id: number, newUsername: string) {
	usernameChanger(id, newUsername);
	return { message: "Username changed successfully" };
}

export async function changeEmail(id: number, newEmail: string) {
	emailChanger(id, newEmail);
	return { message: "Email changed successfully" };
}

export async function changePassword(id: number, hashedNewPassword: string) {
	passwordChanger(id, hashedNewPassword);
	return { message: "Password changed successfully" };
}

export async function getUserByUsername(username: string ) {
	const user = findUserByUsername(username);
	return user;
}

export async function getUserById(id: number) {
	const user = findUserById(id);
	return user;
}

export async function getUserByEmail(email: string) {
	const user = findUserByEmail(email);
	return user;
}

export async function getIDbyUsername(username: string) {
	const id = findIDByUsername(username);
	return id;
}

export async function getUserAvatar(id: number): Promise<string> {
	const extensions = [".jpg", ".jpeg", ".png"];
	const basePath = "./avatars";

	for (const ext of extensions) {
		const filePath = path.join(basePath, `${id}${ext}`);
		try {
		await fs.promises.access(filePath, fs.constants.F_OK);
		return await fs.promises.readFile(filePath);
		} catch {
		continue;
		}
	}

	const defaultPath = path.join(basePath, "0.jpeg");
	return await fs.promises.readFile(defaultPath);
}

export async function avatarUploader(id: number, file: Express.Multer.File): Promise<{ message: string }> {
	try {
		const extension = path.extname(file.filename).toLowerCase();
		const buffer = await file.toBuffer();
	
		const uploadPath = path.join("./avatars", `${id}${extension}`);
		console.log("Uploading avatar to:", uploadPath);
		await fs.promises.writeFile(uploadPath, buffer);
	} catch (err: any) {

	}
	return { message: "Avatar uploaded successfully" };
}

export async function avatarDeleter(id: number) {
	const extensions = [".jpg", ".jpeg", ".png"];
	const basePath = "./avatars";

	for (const ext of extensions) {
		const filePath = path.join(basePath, `${id}${ext}`);
		try {
			await fs.promises.access(filePath, fs.constants.F_OK);
			await fs.promises.unlink(filePath);
		} catch {
			continue;
		}
	}
}

export async function userRemover(id: number) {
	const result = removeUser(id);
	if (result.changes === 0) {
		throw new Error("No user found with the given ID");
	}
	
	// Delete chat data (conversations, messages, blocks) for this user
	try {
		const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://chat-service:8083';
		const response = await fetch(`${chatServiceUrl}/users/${id}/data`, {
			method: 'DELETE'
		});

		const res = await fetch("http://auth-service:8081/deleteAuthUser", {
			method: "DELETE",
        	headers: { "Content-Type": "application/json" },
        	body: JSON.stringify({ userId: id }),
		})
		if (!response.ok) {
			console.error(`Failed to delete chat data for user ${id}:`, await response.text());
		} else if (!res.ok) {
			console.error(`Failed to delete auth data for user ${id}`);
		} else {
			console.log(`Chat data and auth data deleted successfully for user ${id}`);
		}
	} catch (error) {
		console.error(`Error deleting chat data for user ${id}:`, error);
		// Don't throw - we still want to delete the user even if chat cleanup fails
	}
}

export async function getAllUsers() {
	const users = findAllUsers();
	return users;
}
