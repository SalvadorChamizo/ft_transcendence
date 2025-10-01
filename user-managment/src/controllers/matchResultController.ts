import { FastifyReply, FastifyRequest } from "fastify";
import { getVictories , addVictory } from "../services/matchResultService";

export async function getVictoriesController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.body as { userId: number };

    try {
        const victories = await getVictories(userId);
        return reply.send(victories);
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function addVictoryController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.body as { userId: number };

    try {
        await addVictory(userId);
        return reply.send({ message: "Victory added successfully" });
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}
