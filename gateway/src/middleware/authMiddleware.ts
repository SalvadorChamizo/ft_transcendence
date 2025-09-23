import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const publicUrls = ["/auth/login", "/auth/register", "/auth/refresh", "/ping", "/auth/verify-2fa"];

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {  
	console.log(`[Auth Middleware] Processing request for: ${req.url}`); // LOG ADDED
	if (publicUrls.some(url => req.url.startsWith(url))) {
		        console.log(`[Auth Middleware] Public URL, skipping auth for: ${req.url}`); // LOG ADDED

		return;
	}

	let token: string | undefined;
    const authHeader = req.headers["authorization"];

	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1];
	} 
	else if (req.query && (req.query as any).token) {
		token = (req.query as any).token;
	}

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
        console.log(`[Auth Middleware] Token validated successfully for user: ${decoded.username}, URL: ${req.url}`); // LOG ADDED

        req.user = decoded;

    }   catch (err) {
            return reply.code(401).send({ error: "Unauthorized: Invalid or expired token" });
    }
}