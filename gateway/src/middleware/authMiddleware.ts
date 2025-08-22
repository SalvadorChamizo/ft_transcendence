import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const publicUrls = ["/auth/login", "/auth/register", "/ping"];

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
    if (publicUrls.includes(req.url))
        return ;

    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return reply.code(401).send({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return reply.code(401).send({ error: "Unauthorized: Malformed token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        (req as any).user = decoded;

    }   catch (err) {
            return reply.code(401).send({ error: "Unauthorized: Invalid or expired token" });
    }
}