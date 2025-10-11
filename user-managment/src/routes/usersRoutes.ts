import { FastifyInstance } from "fastify";
import { registerController , register42Controller , userGetterByEmail, getCurrentUserController, userGetterByUsername, userGetterById, passwordControl, getUserProfileController } from "../controllers/usersController";
import { getVictoriesController, addVictoryController } from "../controllers/matchResultController";

export default async (fastify: FastifyInstance) => {
    fastify.post("/register", registerController);
    fastify.post("/register42", register42Controller);
    fastify.post("/checkPassword", passwordControl);
    fastify.post("/getUserByName", userGetterByUsername);
    fastify.post("/getUserById", userGetterById);
    fastify.post("/getUserByEmail", userGetterByEmail);
    fastify.post("/getVictories", getVictoriesController);
    fastify.post("/addVictory", addVictoryController);
    fastify.get("/me", getCurrentUserController);
    fastify.get("/:id", getUserProfileController); // Get user profile by ID
};
