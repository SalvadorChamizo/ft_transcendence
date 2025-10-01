import { createUser, findUserByUsername, findUserById, findUserByEmail } from "../repositories/usersRepository";

export async function registerUser(email: string, username: string, password: string) {
    createUser(username, password, email);
    return { message: "User registered successfully" };
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
