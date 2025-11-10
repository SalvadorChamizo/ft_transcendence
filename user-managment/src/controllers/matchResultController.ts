import { FastifyReply, FastifyRequest } from "fastify";
import { getResults , addVictory, addDefeat } from "../services/matchResultService";

export async function getResultsController(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.headers['x-user-id'] as string;
    const id = parseInt(userId);

    try {
        const results = await getResults(id);
        return reply.send(results);
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function addVictoryController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.body as { userId: number };

	if (!userId) {
		return reply.code(401).send({ error: "Not authenticated" });
	}

    try {
        await addVictory(userId);
        return reply.send({ message: "Victory added successfully" });
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}

export async function addDefeatController(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.body as { userId: number };

    try {
        await addDefeat(userId);
        return reply.send({ message: "Defeat added successfully" });
    } catch (err: any) {
        return reply.code(400).send({ error: err.message });
    }
}
