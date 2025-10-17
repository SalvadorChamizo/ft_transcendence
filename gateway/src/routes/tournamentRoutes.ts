import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

export default async function tournamentRoutes(app: FastifyInstance) {
    app.register(fastifyHttpProxy, {
        upstream: "http://tournament-service:8085",
        prefix: "/tournaments",
        rewritePrefix: "/tournaments",
    });
}