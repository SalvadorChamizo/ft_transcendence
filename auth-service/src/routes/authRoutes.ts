import { FastifyInstance } from "fastify";
import { registerController, loginController, refreshController, logoutController, generateQRController, verify2FAController, enable2FAController } from "../controllers/authController";

export default async function authRoutes(app: FastifyInstance) {
    app.post("/login", loginController);
    app.post("/register", registerController);
    app.post("/refresh", refreshController);
    app.post("/logout", logoutController);
    app.post("/verify-2fa", verify2FAController);
    app.post("/enable-2fa", enable2FAController);
    app.post("/generate-qr", generateQRController);
}