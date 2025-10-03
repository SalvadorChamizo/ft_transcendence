import { createUser, findUser } from "../repositories/userRepository";
import { RefreshTokenRepository } from "../repositories/refreshTokenRepository";
import { generateAccessToken, generateRefreshToken } from "./tokenService";

const refreshTokenRepo = new RefreshTokenRepository();

export async function registerUser(username: string, password: string, email: string) {
    const register = await fetch("http://user-management-service:8082/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
    if (register.ok)
    {
        createUser(username, password, email);
        return { message: "User registered successfully" };
    }
    else
        throw new Error(await register.text());
}

export async function loginUser(username: string, password: string) {
    const res = await fetch("http://user-management-service:8082/getUserByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });

    const user = await res.json();

    if (!user.id)
        throw new Error("Invalid username or password");

    const passwordControl = await fetch("http://user-management-service:8082/checkPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!passwordControl.ok)
        throw new Error("Invalid username or password");
    return user;
}

export function createTokensLogin(user: any) {
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    refreshTokenRepo.add(user.id, refreshToken);
    
    return { token, refreshToken };
}

export function logoutUser(refreshToken: string) {
    const tokenData = refreshTokenRepo.findByToken(refreshToken);
    if (!tokenData)
        return ;

    refreshTokenRepo.deleteAllForUser(tokenData.user_id);
}

export async function findOrCreateUserFrom42(intraUser: any) {
    const username = intraUser.login;
    const email = intraUser.email;

    const res = await fetch("http://user-management-service:8082/getUserByName", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });

    if (res.ok) {
        const user = await res.json();
        return user;
    }

    const register = await fetch("http://user-management-service:8082/register42", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
    });

    if (!register.ok) {
        const errorText = await register.text();
        throw new Error(`Failed to create user from 42 login: ${errorText}`);
    }
    
    const newUser = await register.json();
    createUser(newUser.username, "", newUser.email);
    return newUser;
}

export async function findOrCreateUserFromGoogle(googleUser: any) {
    const email = googleUser.email;
    const username = googleUser.name;

    const res = await fetch("http://user-management-service:8082/getUserByEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });

    if (res.ok) {
        const user = await res.json();
        return user;
    }

    const register = await fetch("http://user-management-service:8082/register42", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
    });

    if (!register.ok) {
        const errorText = await register.text();
        throw new Error(`Failed to create user from Google login: ${errorText}`);
    }
    
    const newUser = await register.json();
    createUser(newUser.username, "", newUser.email);
    return newUser;
}