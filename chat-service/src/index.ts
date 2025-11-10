import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { chatRoutes } from "./routes/chatRoutes";
import { gameInvitationRoutes } from "./routes/gameInvitationRoutes";
import { websocketRoutes } from "./routes/websocketRoutes";
import "./db/sqlite"; // Initialize database
import { notificationsRoutes } from "./routes/notificationRoutes";
import { friendInvitationRoutes } from "./routes/friendInvitationRoutes";

// Loads .env variables into process.env
dotenv.config();

async function startServer() {
    // Creates a Fastify instance with logger activated
    const app = Fastify({ logger: true });

    // Register CORS plugin

const whitelist = ["https://localhost:8443", "http://localhost:8083"];
app.register(cors, {
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);


    const localNetworkPattern = /.*/;

    if (
      whitelist.includes(origin) ||
      localNetworkPattern.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});

    // Register WebSocket plugin for live chat
    await app.register(websocket);

    // Health check endpoint
    app.get("/health", async (req, reply) => {
    const uptime = process.uptime();

    return reply.status(200).send({
        service: "chat-service",
        status: "ok",
        uptime: Math.round(uptime),
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
    });

    // Ping endpoint to test the server
    app.get("/ping", async () => {
        return { pong: true, chat: true };
    });

    // Register chat routes
    await app.register(chatRoutes);

    // Register game invitation routes
    await app.register(gameInvitationRoutes);

    // Register WebSocket routes
    await app.register(websocketRoutes);

    await app.register(notificationsRoutes);
    // ALL: Register WebSocket handlers

    await app.register(friendInvitationRoutes);
    const PORT = process.env.PORT || 8083;

    // Graceful shutdown handlers
    const listeners = ['SIGINT', 'SIGTERM'];
    listeners.forEach((signal) => {
        process.on(signal, async () => {
            console.log(`Received ${signal}, shutting down gracefully...`);
            await app.close();
            process.exit(0);
        });
    });

    try {
        await app.listen({ port: Number(PORT), host: "0.0.0.0" });
        console.log(`🚀 Chat-service listening on port: ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

startServer();
