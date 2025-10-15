import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export default async function pongRoutes(fastify: FastifyInstance) {
  fastify.log.info("Registering pongRoutes");

  // Proxy only REST API routes to the pong service
  // Socket.IO connections go directly from frontend to pong service
  fastify.register(proxy, {
    upstream: "http://pong-service:7000",
    prefix: "/game",
    // rewritePrefix: "/game",
    
    preHandler: async (request, reply) => {
      fastify.log.info(`[PONG PROXY] Incoming request: ${request.method} ${request.url}`);
      // Log extra para ver cómo se va a reenviar la petición
      fastify.log.info(`[PONG PROXY] Will proxy to: ${request.raw.url}`);
    },
    
    replyOptions: {
      rewriteRequestHeaders: (originalReq, headers) => {
        fastify.log.info(`[PONG PROXY] Rewriting headers for ${originalReq.method} ${originalReq.url}`);
        if (originalReq.user) {
          headers["x-player-id"] = String(originalReq.user.id);
          fastify.log.info(`[REST] Injected x-player-id: ${headers["x-player-id"]}`);
        }
        return headers;
      },
    },
  });

  fastify.log.info("pongRoutes registered successfully");
}