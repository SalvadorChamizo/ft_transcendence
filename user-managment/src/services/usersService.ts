import { createUser, usernameChanger, findUserByUsername, findUserById, findUserByEmail, findIDByUsername, findAllUsers } from "../repositories/usersRepository";

export async function registerUser(email: string, username: string, password: string) {
    createUser(username, password, email);
    return { message: "User registered successfully" };
}

export async function register42User(email: string, username: string) {
    createUser(username, "", email);
    return { message: "User registered successfully" };
}

export async function changeUsername(id: number, newUsername: string) {
    console.log("Controller -> Changing username for user ID:", id);
    console.log("Controller -> New username:", newUsername);
    usernameChanger(id, newUsername);
    return { message: "Username changed successfully" };
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

export async function getAllUsers() {
    const users = findAllUsers();
    return users;
}
