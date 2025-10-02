import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";

import { authMiddleware } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

// Loads .env variables into process.env
dotenv.config();

// Creates a Fastify instance with logger activated
const app = Fastify({ logger: true });

await app.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

app.register(authRoutes);
app.register(userRoutes);


//----------------------------
// Protected endpoint example
//----------------------------

app.get("/protected", async (req, reply) => {
    return { message: `Hello ${req.user?.username}` };
});

//------------------
//
// END JWT IMPLEMENTATION
//
//------------------

app.addHook("preHandler", authMiddleware);

// Endpoint to test the server
app.get("/ping", async () => {
    return { pong: true };
});

app.get("/health", async () => {
    return { status: "ok", uptime: process.uptime() };
});

const PORT = process.env.PORT || 8080;

const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
    process.on(signal, async () => {
        await app.close();
        process.exit(0);
    })
});

async function main() {
    await app.listen({ port: Number(PORT), host: "0.0.0.0" })
        .then(() => console.log(`Server running on port ${PORT}`));
}

main()