import { FastifyInstance } from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import { authMiddleware } from "../middleware/authMiddleware";

export default async function userRoutes(app: FastifyInstance) {
  app.register(async function (protectedRoutes: FastifyInstance) {
    protectedRoutes.register(fastifyHttpProxy, {
      upstream: "http://user-management-service:8082",
      prefix: "/users",
      rewritePrefix: "",
      async preHandler(req, reply) {

        const publicPaths = ["/users/getAvatar"];
        const isPublic = publicPaths.some(path => req.url.startsWith(path));
        console.log("path:", req.url, "isPublic:", isPublic);

        if (isPublic) {
          const userId = req.headers["x-user-id"];
          if (!userId) {
            console.warn(`Public route accessed without x-user-id header: ${req.url}`);
            return reply.code(401).send({ error: "Missing x-user-id header" });
          }
          console.log("Public route allowed. Skipping auth.");
          return;
        }

        // Autenticación para rutas protegidas
        await authMiddleware(req, reply);

        // Añadir headers personalizados de manera segura
        if (req.user) {
          reply.headers({
            "x-user-id": req.user.id,
            "x-username": req.user.username,
          });
        }

        console.log("Forwarding headers to user service:", {
          "x-user-id": req.user?.id,
          "x-username": req.user?.username,
        });
      },
    });
  });
}
