import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginUser, logoutUser } from "../services/authService";
import { rotateTokens} from "../services/tokenService"

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
        const {token, refreshToken} = await loginUser(username, password);

        reply.setCookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60,
        });

        return reply.send({ accessToken: token});

    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function refreshController(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies.refresh;

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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
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