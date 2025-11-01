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
	
	const extension = path.extname(file.filename).toLowerCase();
	const buffer = await file.toBuffer();

	const uploadPath = path.join("./avatars", `${id}${extension}`);
	console.log("Uploading avatar to:", uploadPath);
	await fs.promises.writeFile(uploadPath, buffer);
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
}

export async function getAllUsers() {
	const users = findAllUsers();
	return users;
}
