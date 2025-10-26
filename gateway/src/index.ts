import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import jwt from "jsonwebtoken";

import { authMiddleware } from "./middleware/authMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import pongRoutes from "./routes/pongRoutes";
import tournamentRoutes from "./routes/tournamentRoutes.js";

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
app.register(tournamentRoutes);

// CORS (puedes dejarlo donde estaba)
const whitelist = ["http://localhost:5173"];
app.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1 || /http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
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
