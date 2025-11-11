import { FastifyInstance } from "fastify";
import { registerController,
         loginController,
         refreshController,
         logoutController,
         generateQRController,
         verify2FAController,
         enable2FAController,
         forgotPasswordController,
         restoreUserController,
         deleteUserController, } from "../controllers/authController";

import { callbackGoogleController,
         loginGoogleController,
         callback42Controller,
         login42Controller, } from "../controllers/oauthController";

import { logoutSchema, loginSchema, refreshSchema, registerSchema, verify2FASchema, enable2FASchema, generateQRSchema, forgotPasswordSchema, restoreUserSchema, deleteUserSchema } from "../schemas/authSchemas"
import { login42Schema, callback42Schema, loginGoogleSchema, callbackGoogleSchema } from "../schemas/oauthSchemas";

export default async function authRoutes(app: FastifyInstance) {
    app.post("/login", {schema: loginSchema }, loginController);
    app.post("/register", {schema: registerSchema}, registerController);
    app.post("/refresh", { schema: refreshSchema }, refreshController);
    app.post("/logout", { schema: logoutSchema }, logoutController);
    app.post("/verify-2fa", { schema: verify2FASchema }, verify2FAController);
    app.post("/enable-2fa", { schema: enable2FASchema}, enable2FAController);
    app.post("/generate-qr", { schema: generateQRSchema}, generateQRController);
    app.get("/42/login", login42Controller);
    app.get("/42/callback", callback42Controller);
    app.get("/google/login", { schema: loginGoogleSchema }, loginGoogleController);
    app.get("/google/callback", { schema: callbackGoogleSchema}, callbackGoogleController);
    app.post("/forgot-password", { schema: forgotPasswordSchema}, forgotPasswordController);
    app.get("/restoreUserSession", { schema: restoreUserSchema }, restoreUserController);
    app.delete("/deleteAuthUser", { schema: deleteUserSchema }, deleteUserController);
}