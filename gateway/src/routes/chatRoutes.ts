import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

export default async function chatRoutes(app: FastifyInstance) {
    // Proxy para endpoints REST de conversaciones
    app.register(fastifyHttpProxy, {
        upstream: "http://chat-service:8083",
        prefix: "/conversations",
        rewritePrefix: "/conversations",
        replyOptions: {
            rewriteRequestHeaders: (originalReq, headers) => ({
                ...headers,
                'x-user-id': originalReq.user?.id?.toString() || '',
                'x-username': originalReq.user?.username || '',
            })
        }
    });

    // Proxy para invitaciones de juego
    app.register(fastifyHttpProxy, {
        upstream: "http://chat-service:8083",
        prefix: "/game-invitations",
        rewritePrefix: "/game-invitations",
        replyOptions: {
            rewriteRequestHeaders: (originalReq, headers) => ({
                ...headers,
                'x-user-id': originalReq.user?.id?.toString() || '',
                'x-username': originalReq.user?.username || '',
            })
        }
    });

    // Proxy para WebSocket
    app.register(fastifyHttpProxy, {
        upstream: "http://chat-service:8083",
        prefix: "/ws",
        rewritePrefix: "/ws",
        websocket: true,
        replyOptions: {
            rewriteRequestHeaders: (originalReq, headers) => ({
                ...headers,
                'x-user-id': originalReq.user?.id?.toString() || '',
                'x-username': originalReq.user?.username || '',
            })
        }
    });
}