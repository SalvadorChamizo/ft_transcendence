import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import jwt from "jsonwebtoken";

import { authMiddleware } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import pongRoutes from "./routes/pongRoutes";

// Loads .env variables into process.env
dotenv.config();

// Creates a Fastify instance with logger activated
const app = Fastify({ logger: true });

// Register auth middleware BEFORE routes
app.addHook("preHandler", authMiddleware);

app.register(authRoutes);
app.register(chatRoutes);
app.register(pongRoutes);
app.register(userRoutes);


// CORS (puedes dejarlo donde estaba)
await app.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});


// Global hook (HTTP requests)
// Nota: esto NO cubre el handshake WS (upgrade)
//app.addHook("preHandler", authMiddleware);

// Protected example
app.get("/protected", async (req, reply) => {
  return { message: `Hello ${req.user?.username}` };
});

//------------------
//
// END JWT IMPLEMENTATION
//
//------------------

// Endpoint to test the server
app.get("/ping", async () => ({ pong: true }));
app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));

const PORT = process.env.PORT || 8080;

const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
});

async function main() {
  await app.listen({ port: Number(PORT), host: "0.0.0.0" })
    .then(() => console.log(`Server running on port ${PORT}`));
}

main();
