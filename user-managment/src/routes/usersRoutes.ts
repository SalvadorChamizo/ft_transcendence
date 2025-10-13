import { FastifyInstance } from "fastify";
import { registerController , register42Controller , usernameChanger , userGetterByEmail, getCurrentUserController,
    userGetterByUsername, userGetterById, passwordControl } from "../controllers/usersController";
import { getVictoriesController, addVictoryController } from "../controllers/matchResultController";

export default async (fastify: FastifyInstance) => {
    fastify.get("/", getAllUsersController); // Get all users - MUST be before /:id
    fastify.post("/register", registerController);
    fastify.post("/register42", register42Controller);
    fastify.post("/changeUsername", usernameChanger);
    fastify.post("/checkPassword", passwordControl);
    fastify.post("/getUserByName", userGetterByUsername);
    fastify.post("/getUserById", userGetterById);
    fastify.post("/getUserByEmail", userGetterByEmail);
    fastify.post("/getVictories", getVictoriesController);
    fastify.post("/addVictory", addVictoryController);
    fastify.get("/me", getCurrentUserController);
};
