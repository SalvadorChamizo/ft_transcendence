import Fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({ logger: true });

app.get("/ping", async () => {
    return { pong: true };
});

const PORT = process.env.PORT || 4242;

app.listen({ port: Number(PORT), host: "0.0.0.0" })
    .then(() => console.log(`Auth-service listening on port: ${PORT}`));
