import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import { authMiddleware } from "../middleware/authMiddleware";

export default async function userRoutes(app: FastifyInstance) {
  app.register(async function (protectedRoutes: FastifyInstance) {
    // Step 1: Keep your authMiddleware here
    protectedRoutes.addHook("preHandler", authMiddleware);

    // Step 2: Register the proxy and inject headers before forwarding
    protectedRoutes.register(fastifyHttpProxy, {
      upstream: "http://user-management-service:8082",
      prefix: "/users",
      rewritePrefix: "",
      async preHandler(req, reply) {
        if (req.user) {
          (req.headers as Record<string, string>)["x-user-id"] = req.user.id;
          (req.headers as Record<string, string>)["x-username"] = req.user.username;
        }

        console.log("Forwarding headers to user service:", {
          "x-user-id": req.user?.id,
          "x-username": req.user?.username,
        });
      },
    });
  });
}