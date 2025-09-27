import { FastifyInstance } from "fastify";
import { registerController , userGetter, passwordControl } from "../controllers/usersController";

export default async (fastify: FastifyInstance) => {
    fastify.post("/register", registerController);
    fastify.post("/getUser", userGetter);
    fastify.post("/checkPassword", passwordControl);
};
