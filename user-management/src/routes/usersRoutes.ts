import {
  registerController,
  register42Controller,
  loginTimeRegister,
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
  removeUser,
  passwordChangerController,
} from "../controllers/usersController";

import {
  getResultsController,
  addVictoryController,
  addDefeatController,
} from "../controllers/matchResultController";

import { 
    getAllUsersController,
    addFriendController,
    getFriendController,
    removeFriendController,
    checkFriendController
} from "../controllers/friendsController";

import { 
  registerSchema,
  usernameChangerSchema,
  addVictorySchema,
  register42Schema,
  loginTimeRegisterSchema,
  emailChangerSchema,
  passwordChangerControllerSchema,
  passwordChangerSchema,
  getAllUsersSchema,
  userGetterByUsernameSchema,
  userGetterByIdSchema,
  userGetterByEmailSchema,
  avatarGetterSchema,
  avatarChangerSchema,
  getResultsSchema,
  addDefeatSchema,
  getFriendSchema,
  addFriendSchema,
  removeFriendSchema,
  checkFriendSchema,
  removeUserSchema,
  getCurrentUserSchema,
  passwordControlSchema
} from "../schemas/userSchemas";

export default async (fastify: FastifyInstance) => {
    fastify.post("/register", { schema: registerSchema, handler: registerController });
    fastify.post("/register42", register42Controller); //check
    fastify.post("/loginTime",{schema: loginTimeRegisterSchema, handler: loginTimeRegister});
    fastify.get("/me", {schema: getCurrentUserSchema, handler: getCurrentUserController});
    fastify.post("/changeUsername", { schema: usernameChangerSchema, handler: usernameChanger });
    fastify.post("/changeEmail", {schema: emailChangerSchema, handler: emailChanger});
    fastify.post("/checkPassword", {schema: passwordControlSchema, handler: passwordControl});
    fastify.post("/changePassword", {schema: passwordChangerSchema, handler: passwordChanger});
    fastify.post("/changePasswordBackend", {schema: passwordChangerControllerSchema, handler: passwordChangerController});
    fastify.get("/getAllUsers", {schema: getAllUsersSchema, handler: getAllUsersController});
    fastify.post("/getUserByName", {schema: userGetterByUsernameSchema, handler: userGetterByUsername});
    fastify.post("/getUserById", {schema: userGetterByIdSchema, handler: userGetterById});
    fastify.post("/getUserByEmail", {schema: userGetterByEmailSchema, handler: userGetterByEmail});
    fastify.get("/getAvatar", {schema: avatarGetterSchema, handler: avatarGetterController});
    fastify.post("/changeAvatar", {schema: avatarChangerSchema, handler: avatarChanger});
    fastify.get("/getResults", getResultsController);
    fastify.post("/addVictory", { schema: addVictorySchema, handler: addVictoryController});
    fastify.post("/addDefeat", {schema: addDefeatSchema, handler: addDefeatController});
    fastify.get("/getFriends", {schema: getFriendSchema, handler: getFriendController});
    fastify.post("/addFriend", {schema: addFriendSchema, handler: addFriendController});
    fastify.post("/removeFriend", {schema: removeFriendSchema, handler: removeFriendController});
    fastify.post("/checkFriend", {schema: checkFriendSchema, handler: checkFriendController});
    fastify.delete("/removeUsers", {schema: removeUserSchema, handler: removeUser});
};