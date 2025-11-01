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

export default async function authRoutes(app: FastifyInstance) {
    app.post("/login", loginController);
    app.post("/register", registerController);
    app.post("/refresh", refreshController);
    app.post("/logout", logoutController);
    app.post("/verify-2fa", verify2FAController);
    app.post("/enable-2fa", enable2FAController);
    app.post("/generate-qr", generateQRController);
    app.get("/42/login", login42Controller);
    app.get("/42/callback", callback42Controller);
    app.get("/google/login", loginGoogleController);
    app.get("/google/callback", callbackGoogleController);
    app.post("/forgot-password", forgotPasswordController);
    app.get("/restoreUserSession", restoreUserController);
    app.delete("/deleteAuthUser", deleteUserController);
}