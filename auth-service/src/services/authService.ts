import { createUser, findUser } from "../repositories/userRepository";
import { RefreshTokenRepository } from "../repositories/refreshTokenRepository";
import { generateAccessToken, generateRefreshToken } from "./tokenService";

const refreshTokenRepo = new RefreshTokenRepository();

export async function registerUser(username: string, password: string, email: string) {
    console.log("Aqui llega 1");
    const register = await fetch("http://user-management-service:8082/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
    console.log("Aqui llega 2");
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