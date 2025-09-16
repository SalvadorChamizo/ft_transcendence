import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import { SocketStream } from "@fastify/websocket";
import { authMiddleware } from "../middleware/authMiddleware";
import { connections } from "../index";

const connections = new Map<string, SocketStream>();
export default async function pongRoutes(app: FastifyInstance)
{
	/**
	 * Proxy for the API game calls
	 */
	app.register(fastifyHttpProxy,
	{
		upstream: "http://pong-service:3000",
		prefix: "/game",
		rewritePrefix: "/game",
        //preHandler: authMiddleware,
	});

	/**
	 * Specific proxy for fastify websocket connection
	 */
    app.get('/socket.io/', { websocket: true }, (connection: SocketStream, req) =>
    {
        const userId = req.user?.id;
        if (!userId)
        {
            connection.socket.close(1008, "User not authenticated");
            return;
        }
        console.log(`Gateway: Cliente ${userId} conectado al WebSocket.`);
        connections.set(userId, connection); // Add the connection to the global map

        connection.socket.on('close', () => {
            console.log(`Gateway: Cliente ${userId} desconectado.`);
            connections.delete(userId); // Clean the connection at closing
        });
    })

}