import { FastifyInstance } from "fastify";
import { createRoom } from "../services/roomService";
import { getRoom, getAllRooms, saveRoom, saveMatch, getMatchesByPlayer, addPlayerToRoom } from "../db/roomRepository";
import { scheduleAutoDeleteIfEmpty } from "../services/publicRoomtimers";

export async function roomRoutes(fastify: FastifyInstance) {

  fastify.post("/rooms", async (request, reply) => {
    const body = (request.body as any) || {};
    const isPublic = body.private === true ? false : (typeof body.public === 'boolean' ? body.public : true);

    const roomId = createRoom();
    saveRoom(roomId, {}, [], isPublic);

    if (isPublic) {
      scheduleAutoDeleteIfEmpty(roomId, 60_000);
      fastify.log.info(`[ROOMS] Scheduled auto-delete for public room ${roomId} (60s)`);
    }

    reply.send({ roomId, public: isPublic });
  });

  fastify.post("/remote-rooms", async (request, reply) => {
    const body = (request.body as any) || {};
    const isPublic = typeof body.public === 'boolean' ? body.public : true;

    if (!isPublic) {
      const auth = (request.headers as any)['authorization'] || request.headers['Authorization'];
      if (!auth) return reply.code(401).send({ error: 'Authorization required to create private room' });
    }

    const roomId = `room_${Math.random().toString(36).substring(2, 10)}`;
    saveRoom(roomId, {}, [], isPublic);

    if (isPublic) {
      scheduleAutoDeleteIfEmpty(roomId, 60_000);
      fastify.log.info(`[ROOMS] Scheduled auto-delete for public room ${roomId} (60s)`);
    }

    reply.send({ roomId, public: isPublic });
  });

  fastify.get("/rooms", async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const onlyPublic =
        q.public === true || q.public === "true" || q.public === 1 || q.public === "1";

      const roomsRaw: any = getAllRooms();
      const roomsArr: any[] = Array.isArray(roomsRaw) ? roomsRaw : Object.values(roomsRaw || {});

      const result = roomsArr
        .map((r: any) => ({
          id: r?.id ?? r?.roomId,
          players: Array.isArray(r?.players) ? r.players : [],
          public: typeof r?.public === "boolean" ? r.public : true,
          state: r?.state ?? {},
        }))
        .filter((r: any) => (onlyPublic ? r.public === true : true));

      return reply.send(result);
    }
    catch (e) {
      request.log.error("Failed to list rooms", e);
      return reply.code(500).send({ error: "Failed to list rooms" });
    }
  });


  fastify.post("/rooms/:id/add-player", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { playerId } = request.body as { playerId: string };
    if (!playerId) return reply.code(400).send({ error: "playerId required" });

    try {
      addPlayerToRoom(id, playerId);
      const room = getRoom(id);
      return reply.send({ success: true, roomId: id, players: room?.players || [] });
    } catch (e: any) {
      request.log.error('Failed to add player to room', id, e);
      return reply.code(500).send({ error: 'Failed to add player' });
    }
  });

  fastify.get("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = getRoom(id);
    if (!room) return reply.code(404).send({ error: "Room not found" });
    reply.send(room);
  });

  fastify.post('/matches', async (request: any, reply: any) => {
    const body = request.body as any;
    if (!body || !Array.isArray(body.players) || typeof body.score === 'undefined') {
      return reply.code(400).send({ error: 'Invalid body' });
    }
    try {
      const matchId = saveMatch({ id: body.id, roomId: body.roomId, players: body.players, winner: body.winner ?? null, score: body.score, endedAt: body.endedAt });
      return reply.send({ matchId });
    } catch (err) {
      request.log.error('Failed saving match', err);
      return reply.code(500).send({ error: 'Failed to save match' });
    }
  });

  fastify.get('/matches/player/:playerId', async (request: any, reply: any) => {
    const { playerId } = request.params as { playerId: string };
    if (!playerId) return reply.code(400).send({ error: 'playerId required' });
    try {
      const matches = getMatchesByPlayer(playerId);
      return reply.send(matches);
    } catch (err) {
      request.log.error('Failed fetching matches for player', playerId, err);
      return reply.code(500).send({ error: 'Failed fetching matches' });
    }
  });
}