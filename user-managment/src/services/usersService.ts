import { createUser, findUser } from "../repositories/usersRepository";

export async function registerUser(email: string, username: string, password: string) {
    createUser(username, password, email);
    return { message: "User registered successfully" };
}

export async function getUser(username: string ) {
    const user = findUser(username);
    return user;
}
