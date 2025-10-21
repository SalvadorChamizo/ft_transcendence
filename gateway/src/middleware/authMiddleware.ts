import { FastifyReply, FastifyRequest } from "fastify";
import { parse } from "url";
import jwt from "jsonwebtoken";

const publicUrls = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/ping",
    "/health",
    "/auth/verify-2fa",
    "/auth/42/login",
    "/auth/42/callback",
    "/auth/google/login",
    "/auth/google/callback",
    "/tournaments/local",
    "/tournaments/:id/start",
    "/tournaments/:id/advance",
];

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const urlPath = req.url.split("?")[0];

  const isPublic = publicUrls.some((publicUrl) => {
    if (publicUrl.includes(":")) {
      const regex = new RegExp("^" + publicUrl.replace(/:[^/]+/g, "[^/]+") + "$");
      return regex.test(urlPath);
    }
    return publicUrl === urlPath;
  });

  // ✅ Allow public or WebSocket routes
  if (isPublic || urlPath.startsWith("/ws")) {
    return;
  }

  // ✅ Allow local games
  if (urlPath.startsWith("/game/local")) {
    return;
  }

    // Para WebSocket, buscar token en query params
    if (urlPath.startsWith('/ws')) {
        const url = parse(req.url, true);
        const token = url.query.token as string;

        if (!token) {
            return reply.code(401).send({ error: "Unauthorized: No token provided in WebSocket" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
                id: string;
                username: string;
                iat?: number;
                exp?: number;
            };
            console.log(`[Auth Middleware WS] Token validated for user: ${decoded.username}`);

            req.user = decoded;
            req.headers["x-user-id"] = decoded.id;
            req.headers["x-username"] = decoded.username;
            return;
        } catch (err) {
            return reply.code(401).send({ error: "Unauthorized: Invalid or expired token in WebSocket" });
        }
    }

    // Para HTTP normal, buscar token en header Authorization
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
        console.log(`[Auth Middleware] Token validated successfully for user: ${decoded.username}`);

        req.user = decoded;

        req.headers["x-user-id"] = decoded.id;
        req.headers["x-username"] = decoded.username;

    }   catch (err) {
            return reply.code(401).send({ error: "Unauthorized: Invalid or expired token" });
    }
}