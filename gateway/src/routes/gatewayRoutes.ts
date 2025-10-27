import { FastifyInstance } from "fastify";
import { healthController } from "../controllers/gatewayControllers";

export default async function gatewayRoutes(app: FastifyInstance) {

    app.get("/health", healthController);
}