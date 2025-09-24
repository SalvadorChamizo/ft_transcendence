import { createUser, findUser } from "../repositories/usersRepository";

export async function registerUser(username: string, password: string) {
    createUser(username, password);
    return { message: "User registered successfully" };
}

export async function getUser(username: string ) {
    const user = findUser(username);
    return user;
}
