import Fastify from "fastify";
import multipart from "@fastify/multipart";

import usersRoutes from "./routes/usersRoutes";
import { removeInactiveUsers } from "./repositories/usersRepository";

const intervalTime = 24 * 60 * 60 * 1000;
const inactiveDays = 30 * 24 * 60 * 60;

const app = Fastify({ logger: true });

app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

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

setInterval(() => {
  try {
    removeInactiveUsers(inactiveDays);
  } catch (err) {
    console.error("Error cleaning inactives users:", err);
  }
}, intervalTime);

app.listen({ port: Number(PORT), host: "0.0.0.0" })
	.then(() => console.log(`user-service listening on port: 8082`));