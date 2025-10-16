import { FastifyInstance } from "fastify";
import { createRoom } from "../services/roomService";
import { getRoom, getAllRooms, saveRoom } from "../db/roomRepository";

export async function roomRoutes(fastify: FastifyInstance) {
  fastify.post("/rooms", async (request, reply) => {
    const roomId = createRoom();
    // initialize in database with empty state and no players
    reply.send({ roomId });
  });

  // new endpoint to create remote rooms (persistent)
  fastify.post("/remote-rooms", async (request, reply) => {
    // Unique id
    const roomId = `room_${Math.random().toString(36).substring(2, 10)}`;
    // empty no players
    saveRoom(roomId, {}, []);
    reply.send({ roomId });
  });

  fastify.get("/rooms", async (request, reply) => {
    const rooms = getAllRooms();
    reply.send(rooms);
  });

  fastify.get("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = getRoom(id);
    if (!room) return reply.code(404).send({ error: "Room not found" });
    reply.send(room);
  });
}