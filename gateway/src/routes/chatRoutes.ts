import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

export default async function chatRoutes(app: FastifyInstance) {
    app.register(fastifyHttpProxy, {
        upstream: "http://livechat-service:8083",
        prefix: "/conversations",
        rewritePrefix: "",
    });
}