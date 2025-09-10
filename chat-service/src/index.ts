import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { chatRoutes } from "./routes/chatRoutes";

// Loads .env variables into process.env
dotenv.config();

// Creates a Fastify instance with logger activated
const app = Fastify({ logger: true });

// Register CORS plugin
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
});

// Register WebSocket plugin for live chat
await app.register(websocket);

// Health check endpoint
app.get("/health", async () => {
    return { 
        status: "ok", 
        service: "chat-service",
        uptime: process.uptime() 
    };
});

// Ping endpoint to test the server
app.get("/ping", async () => {
    return { pong: true };
});

// Register chat routes
await app.register(chatRoutes);

// ALL: Register WebSocket handlers
// ALL: Initialize database

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

async function main() {
    try {
        await app.listen({ port: Number(PORT), host: "0.0.0.0" });
        console.log(`🚀 Chat-service listening on port: ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

main();
