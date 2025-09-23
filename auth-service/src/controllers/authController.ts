import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginUser, logoutUser, createTokensLogin } from "../services/authService";
import { rotateTokens} from "../services/tokenService"
import * as speakeasy from "speakeasy";
import { findUserById, updateUser2FA, debugUsers } from "../repositories/userRepository";
import QRCode from "qrcode";

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
   const { username, password, email } = req.body as { username: string; password: string; email: string };

   try {
    const result = await registerUser(username, password, email);
        return reply.send(result);
   } catch (err: any) {
        return reply.code(400).send({ error: err.message });
   }
}

export async function loginController(req: FastifyRequest, reply: FastifyReply) {
    const { username, password } = req.body as { username: string; password: string };

    try {
        const user = await loginUser(username, password);

        if (user.is_2fa_enabled) {
            return reply.send({ require2FA: true, userId: user.id })
        }

        const { token, refreshToken } = createTokensLogin(user);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, //Change in future to true
            sameSite: "lax", //Change in future to strict
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.send({ accessToken: token, user: { id: user.id, username: user.username },
        });

    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function refreshController(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        const { newAccessToken, newRefreshToken } = rotateTokens(refreshToken);

        reply.setCookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60
        });

        return reply.send({
            accessToken: newAccessToken
        });

    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function logoutController(req: FastifyRequest, reply: FastifyReply) {
    let refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        const authHeader = req.headers["authorization"];
        if (authHeader?.startsWith("Bearer ")) {
            refreshToken = authHeader.split(" ")[1].trim();
        }
        else
            return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        logoutUser(refreshToken);

        reply.clearCookie("refreshToken", {
            path: "/auth/refresh",
        })

        return reply.send({ success: true, message: "Logged out successfully" });
    } catch (err) {
        return reply.code(500).send({ error: "Logout failed" });
    }
}

export async function verify2FAController(req: FastifyRequest, reply: FastifyReply) {
    const { userId, code } = req.body as { userId: number; code: string };

    debugUsers();
    const user = findUserById(userId);
    if (!user || !user.totp_secret) {
        return reply.code(400).send({ error: "2FA not enabled" });
    }

    const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: "base32",
        token: code,
        window: 1,
    });

    if (!verified) {
        return reply.code(401).send({ error: "Invalid 2FA code" });
    }

    const { token, refreshToken } = createTokensLogin(user);

    reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, //Change in future to true
        sameSite: "lax", //Change in future to strict
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({ accessToken: token});
}

export async function enable2FAController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { username, userId } = req.body as {username: string, userId: number};
        const secret = speakeasy.generateSecret({
            name: `MyApp (${username})`,
            length: 20,
        });

        updateUser2FA(secret.base32, userId);
    
        const qr = await QRCode.toDataURL(secret.otpauth_url);
    
        return reply.send({ qr });

    } catch (err: any) {
        console.error("enable2FA error:", err);
        return reply.code(500).send({ error: "Failed to enable 2FA" });
    }
}