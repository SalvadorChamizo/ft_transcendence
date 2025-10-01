import Fastify from "fastify";

import usersRoutes from "./routes/usersRoutes";

const app = Fastify({ logger: true });

app.register(usersRoutes);

const PORT = 8082;

app.listen({ port: Number(PORT), host: "0.0.0.0" })
	.then(() => console.log(`user-service listening on port: 8082`));