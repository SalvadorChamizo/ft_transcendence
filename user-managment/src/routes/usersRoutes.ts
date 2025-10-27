import {
  registerController,
  register42Controller,
  usernameChanger,
  emailChanger,
  userGetterByEmail,
  getCurrentUserController,
  userGetterByUsername,
  userGetterById,
  avatarGetterController,
  avatarChanger,
  passwordControl,
  passwordChanger,
} from "../controllers/usersController";

import {
  getResultsController,
  addVictoryController,
  addDefeatController,
} from "../controllers/matchResultController";

import { 
    getAllUsersController 
} from "../controllers/friendsController";

export default async (fastify: FastifyInstance) => {
    fastify.post("/register", registerController);
    fastify.post("/register42", register42Controller);
    fastify.get("/me", getCurrentUserController);
    fastify.post("/changeUsername", usernameChanger);
    fastify.post("/changeEmail", emailChanger);
    fastify.post("/checkPassword", passwordControl);
    fastify.post("/changePassword", passwordChanger)
    fastify.get("/getAllUsers", getAllUsersController);
    fastify.post("/getUserByName", userGetterByUsername);
    fastify.post("/getUserById", userGetterById);
    fastify.post("/getUserByEmail", userGetterByEmail);
    fastify.get("/getAvatar", avatarGetterController);
    fastify.post("/changeAvatar", avatarChanger);
    fastify.get("/getResults", getResultsController);
    fastify.post("/addVictory", addVictoryController);
    fastify.post("/addDefeat", addDefeatController);
};