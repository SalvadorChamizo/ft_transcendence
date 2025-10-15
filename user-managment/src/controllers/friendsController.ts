import { FastifyRequest, FastifyReply } from "fastify";
import { getAllUsersService } from "../services/friendsService";

export async function getAllUsersController(req: FastifyRequest, reply: FastifyReply) {
    try {
        // 1. Llamar al service para obtener todos los usuarios
        const users = await getAllUsersService();
        
        // 2. Formatear la respuesta: solo id y username
        const userList = users.map(user => ({
            id: user.id,
            username: user.username
        }));
        
        // 3. Enviar respuesta exitosa
        return reply.send({ users: userList });
        
    } catch (error) {
        // 4. Manejar errores
        console.error("Error getting all users:", error);
        return reply.code(500).send({ 
            error: "Failed to get users" 
        });
    }
}