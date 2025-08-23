import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginUser } from "../services/authService";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../services/tokenService";
import { RefreshTokenRepository } from "../repositories/refreshTokenRepository";

const refreshTokenRepo = new RefreshTokenRepository();

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
   const { username, password } = req.body as { username: string; password: string };

   try {
    const result = await registerUser(username, password);
        return reply.send(result);
   } catch (err: any) {
        return reply.code(400).send({ error: err.message });
   }
}

export async function loginController(req: FastifyRequest, reply: FastifyReply) {
    const { username, password } = req.body as { username: string; password: string };

    try {
        const result = await loginUser(username, password);
        return reply.send(result);
    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function refreshController(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);

        const existing = refreshTokenRepo.findByToken(refreshToken);
        if (!existing) {
            return reply.code(401).send({ error: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken({ username: decoded.username, id: decoded.id });
        const newRefreshToken = generateRefreshToken({ username: decoded.username, id: decoded.id });

        refreshTokenRepo.delete(refreshToken);
        refreshTokenRepo.add(decoded.id, newRefreshToken);

        return reply.send({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function logoutController(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token is required" });
    }

    try {
        refreshTokenRepo.delete(refreshToken);

        return reply.send({ success: true, message: "Logged out successfully" });
    } catch (err) {
        return reply.code(500).send({ error: "Logout failed" });
    }
}