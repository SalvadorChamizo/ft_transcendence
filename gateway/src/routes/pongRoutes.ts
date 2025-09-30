import { FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";

export default async function pongRoutes(fastify: FastifyInstance) {
  fastify.log.info("Registering pongRoutes");

  //Proxy para rutas REST - Solo HTTP, no WebSockets
  fastify.register(proxy, {
    upstream: "http://pong-service:3000",
    prefix: "/game",
    rewritePrefix: "/game",
    
    preHandler: async (request, reply) => {
      fastify.log.info(`[PONG PROXY] Incoming request: ${request.method} ${request.url}`);
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