import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export default async function pongRoutes(fastify: FastifyInstance) {
  fastify.log.info("Registering pongRoutes");

  // Proxy REST API routes to the pong service
  fastify.register(proxy, {
    upstream: "http://pong-service:7000",
    prefix: "/game", // REST API calls
    
    preHandler: async (request, reply) => {
      fastify.log.info(`[PONG PROXY] Incoming REST request: ${request.method} ${request.url}`);
    },
    rewriteRequestHeaders: (originalReq, headers) => {
        fastify.log.info(`[PONG PROXY] Rewriting headers for ${originalReq.method} ${originalReq.url}`);
        if (originalReq.user) {
          headers["x-player-id"] = String(originalReq.user.id);
          fastify.log.info(`[REST] Injected x-player-id: ${headers["x-player-id"]}`);
        }
        return headers;
      },
  });

  // Proxy WebSocket connections for Socket.IO
  fastify.register(proxy, {
    upstream: `http://pong-service:7000`,
    websocket: true, // Enable WebSocket proxying
    prefix: "/socket.io",
    rewritePrefix: "/socket.io",
  });


  fastify.log.info("pongRoutes registered successfully");
}