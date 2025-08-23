import bcrypt from "bcrypt";
import { createUser, findUser } from "../repositories/userRepository";
import { generateAccessToken } from "./tokenService"

export async function registerUser(username: string, password: string) {
    const user = findUser(username);
    if (user) {
        throw new Error("User already exists");
    }

    const hashed = await bcrypt.hash(password, 10);
    createUser(username, hashed);
    return { message: "User registered successfully" };
}

export async function loginUser(username: string, password: string) {
    const user = findUser(username);
    if (!user)
        throw new Error("Invalid username or password");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        throw new Error("Invalid username or password");

    const token = generateAccessToken(user);

    return { token };
}

export async function logoutUser() {
    
}