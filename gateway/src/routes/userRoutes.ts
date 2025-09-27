import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";

export default async function userRoutes(app: FastifyInstance) {
    app.register(fastifyHttpProxy, {
        upstream: "http://user-management:8082",
        prefix: "/users",
        rewritePrefix: "",
    });
}