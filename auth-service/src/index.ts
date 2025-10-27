import Fastify from "fastify";
import dotenv from "dotenv";
import cookie from "@fastify/cookie";

import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = Fastify({ logger: true });

app.register(authRoutes);

app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "supersecret2",
    parseOptions: {}
});

app.get("/ping", async () => {
    return { pong: true };
});

app.get("/health", async (req, reply) => {
  const uptime = process.uptime();

  return reply.status(200).send({
    service: "auth-service",
    status: "ok",
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

const PORT = process.env.PORT || 8081;

app.listen({ port: Number(PORT), host: "0.0.0.0" })
    .then(() => console.log(`Auth-service listening on port: ${PORT}`));
