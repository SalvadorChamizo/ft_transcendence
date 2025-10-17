import Fastify from "fastify";
import dotenv from "dotenv";

import tournamentRoutes from "./routes/tournamentRoutes";

dotenv.config();

const app = Fastify({ logger: true });

app.register(tournamentRoutes);

app.get("/ping", async () => {
    return { pong: true };
});

const PORT = process.env.PORT || 8085;

app.listen({ port: Number(PORT), host: "0.0.0.0" })
    .then(() => console.log(`Tournament-service listening on port: ${PORT}`));
