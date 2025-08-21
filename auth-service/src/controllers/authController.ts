import { FastifyReply, FastifyRequest } from "fastify";
import { registerUser, loginUser, validateToken } from "../services/authService"

export async function registerController(req: FastifyRequest, reply: FastifyReply) {
   const { username, password } = req.body as { username: string; password: string };

   try {
    const result = await registerUser(username, password);
        return reply.send(result);
   } catch (err: any) {
        return reply.code(400).send({ error: err.message });
   }
}

export async function loginController(req: FastifyRequest, reply: FastifyReply) {
    const { username, password } = req.body as { username: string; password: string };

    try {
        const result = await loginUser(username, password);
        return reply.send(result);
    } catch (err: any) {
        return reply.code(401).send({ error: err.message });
    }
}

export async function validateController(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.body as { token: string };

    try {
        const user = validateToken(token);
        return reply.send({ valid: true, user });
    } catch (err: any) {
        const code = err.message === "Token is required" ? 400 : 401;
        return reply.code(code).send({ valid: false, error: err.message });
    }
}