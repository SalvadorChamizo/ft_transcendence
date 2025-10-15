import { FastifyInstance } from "fastify";
import { createRoom, getRooms } from "../services/roomService";

export async function roomRoutes(fastify: FastifyInstance) {
  fastify.post("/rooms", async (request, reply) => {
    const room = createRoom();
    reply.send({ roomId: room });
  });

  fastify.get("/rooms", async (request, reply) => {
    const rooms = getRooms();
    reply.send(rooms);
  });
}