import Fastify from "fastify";
import multipart from "@fastify/multipart";

import usersRoutes from "./routes/usersRoutes";

const app = Fastify({ logger: true });

app.register(multipart);

app.register(usersRoutes);

const PORT = 8082;

app.get("/health", async (req, reply) => {
  const uptime = process.uptime();

  return reply.status(200).send({
    service: "user-management-service",
    status: "ok",
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.listen({ port: Number(PORT), host: "0.0.0.0" })
	.then(() => console.log(`user-service listening on port: 8082`));