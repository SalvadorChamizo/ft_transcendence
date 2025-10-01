import { FastifyInstance } from "fastify";
import { registerController , register42Controller , userGetterByUsername, userGetterById, passwordControl } from "../controllers/usersController";
import { getVictoriesController, addVictoryController } from "../controllers/matchResultController";

export default async (fastify: FastifyInstance) => {
    fastify.post("/register", registerController);
    fastify.post("/register42", register42Controller);
    fastify.post("/checkPassword", passwordControl);
    fastify.post("/getUserByName", userGetterByUsername);
    fastify.post("/getUserById", userGetterById);
    fastify.post("/getVictories", getVictoriesController);
    fastify.post("/addVictory", addVictoryController);
};
