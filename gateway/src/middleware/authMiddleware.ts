import { FastifyReply, FastifyRequest } from "fastify";
import { parse } from "url";
import jwt from "jsonwebtoken";

const publicUrls = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/ping",
    "/auth/verify-2fa",
    "/auth/42/login",
    "/auth/42/callback",
    "/auth/google/login",
    "/auth/google/callback",
];

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {  
    const path = parse(req.url).pathname;
    
    if (publicUrls.includes(path!))
        return ;

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return reply.code(401).send({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
        return reply.code(401).send({ error: "Unauthorized: Malformed token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string;
            username: string;
            iat?: number;
            exp?: number;
        };
        console.log(`[Auth Middleware] Token validated successfully for user: ${decoded.username}`); // LOG ADDED

        req.user = decoded;

        req.headers["x-user-id"] = decoded.id;
        req.headers["x-username"] = decoded.username;

    }   catch (err) {
            return reply.code(401).send({ error: "Unauthorized: Invalid or expired token" });
    }
}