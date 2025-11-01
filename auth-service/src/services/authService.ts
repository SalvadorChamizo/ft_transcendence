import { createUser, deleteUser, findUser, findUserById } from "../repositories/userRepository";
import { RefreshTokenRepository } from "../repositories/refreshTokenRepository";
import { generateAccessToken, generateRefreshToken } from "./tokenService";
import nodemailer from "nodemailer"

const refreshTokenRepo = new RefreshTokenRepository();

export async function registerUser(username: string, password: string, email: string) {
    const register = await fetch("http://user-management-service:8082/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
    if (register.ok)
    {
        createUser();
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

    const authUser = findUserById(user.id);
    if (!authUser.id)
        throw new Error("Invalid username or password");

    return ({ user, authUser });
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

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    
        const mailOptions = {
            from: `"Ft-Transcendence" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };
    
        await transporter.sendMail(mailOptions);

    } catch (err) {
        console.log("Error:", err);
    }
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export async function deleteUserData(userId: number) {

    refreshTokenRepo.deleteAllForUser(userId);
    deleteUser(userId);
}