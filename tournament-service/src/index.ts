import Fastify from "fastify";
import dotenv from "dotenv";

import tournamentRoutes from "./routes/tournamentRoutes";

dotenv.config();

const app = Fastify({ logger: true });

app.register(tournamentRoutes);

app.get("/ping", async () => {
    return { pong: true };
});

app.get("/health", async (req, reply) => {
  const uptime = process.uptime();

  return reply.status(200).send({
    service: "tournament-service",
    status: "ok",
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

const PORT = process.env.PORT || 8085;

app.listen({ port: Number(PORT), host: "0.0.0.0" })
    .then(() => console.log(`Tournament-service listening on port: ${PORT}`));
