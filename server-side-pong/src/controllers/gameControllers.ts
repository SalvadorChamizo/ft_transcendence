/**
 * @file gameControllers.ts
 * @brief REST API for controlling the Pong game
 */
import { FastifyInstance } from "fastify";
import { getGameState, resetGame, isGameEnded, startBallMovement } from "../services/gameServices";
import { Server } from "socket.io";

interface Room {
	id: string;
	players: string[];
}

// Pause flags for room
const pauseState = new Map<string, boolean>();

export const getIsPaused = (roomId?: string) => pauseState.get(roomId ?? "local") ?? true;
const setIsPaused = (value: boolean, roomId?: string) =>
{
	pauseState.set(roomId ?? "local", value);
};

import { getRoom, saveRoom } from "../db/roomRepository";

export async function gameController(fastify: FastifyInstance, io: Server)
{
	fastify.post("/:roomId/init", async (req, reply) =>
	{
			const { roomId } = req.params as { roomId: string };
			const state = resetGame(roomId);
			setIsPaused(true, roomId);
			// save the state of the game if its not local
			if (!roomId.startsWith("local_")) {
				const dbRoom = getRoom(roomId);
				if (dbRoom) saveRoom(roomId, state, dbRoom.players);
			}
			io.to(roomId).emit("gameState", state);
			return { message: "Game initialized", state };
	});

	fastify.get("/:roomId/state", async (req, reply) =>
	{
		const { roomId } = req.params as { roomId: string };
		return { paused: getIsPaused(roomId), state: getGameState(roomId) };
  	});

	fastify.post("/:roomId/pause", async (req, reply) =>
	{
		const { roomId } = req.params as { roomId: string };
		if (isGameEnded(roomId)) return { message: "Game has ended" };
		setIsPaused(true, roomId);
		io.to(roomId).emit("gamePaused", { paused: true });
		return { message: "Game paused" };
	});

	fastify.post("/:roomId/resume", async (req, reply) => {
		const { roomId } = req.params as { roomId: string };
		const dbRoom = getRoom(roomId);
		// Validation
		if (!roomId.startsWith('local_') && roomId !== 'local' && (!dbRoom || dbRoom.players.length < 2)) {
			return reply.code(400).send({ message: "Cannot resume, waiting for opponent." });
		}
		if (isGameEnded(roomId)) return { message: "Game has ended" };
		// delay to start the game
		io.to(roomId).emit("gameStarting");
		setTimeout(() => {
			// player check for disconnections
			const currentRoom = getRoom(roomId);
			if (!roomId.startsWith('local_') && roomId !== 'local' && (!currentRoom || currentRoom.players.length < 2)) {
				console.log(`[RESUME-DELAY] Start aborted for room ${roomId}, an opponent disconnected.`);
				return;
			}
			if (!isGameEnded(roomId) && getIsPaused(roomId)) {
				startBallMovement(roomId);
				setIsPaused(false, roomId);
				io.to(roomId).emit("gamePaused", { paused: false });
			}
		}, 1000); // 1 second delay
		return { message: "Game will start in 1 second" };
	});

	fastify.post("/:roomId/toggle-pause", async (req, reply) => {
		const { roomId } = req.params as { roomId: string };
		const dbRoom = getRoom(roomId);
		// Validation
		if (getIsPaused(roomId) && !roomId.startsWith('local_') && roomId !== 'local' && (!dbRoom || dbRoom.players.length < 2)) {
			return reply.code(400).send({ message: "Cannot toggle pause, waiting for opponent." });
		}
		if (isGameEnded(roomId)) return { message: "Game has ended" };
		if (getIsPaused(roomId)) startBallMovement(roomId);
		setIsPaused(!getIsPaused(roomId), roomId);
		io.to(roomId).emit("gamePaused", { paused: getIsPaused(roomId) });
		return { message: `Game ${getIsPaused(roomId) ? "paused" : "resumed"}` };
	});

	fastify.post("/:roomId/reset-score", async (req, reply) => {
		const { roomId } = req.params as { roomId: string };
		const state = getGameState(roomId);
		if (state) {
			state.scores.left = 0;
			state.scores.right = 0;
			// save the state in the db when game is not local
			if (!roomId.startsWith("local_")) {
				const dbRoom = getRoom(roomId);
				if (dbRoom) saveRoom(roomId, state, dbRoom.players);
			}
			io.to(roomId).emit("gameState", state);
			return { message: "Scores reset", state };
		} else {
			return reply.code(404).send({ message: "Room not found" });
		}
	});
}