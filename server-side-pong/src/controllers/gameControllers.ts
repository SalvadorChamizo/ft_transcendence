/**
 * @file gameControllers.ts
 * @brief REST API for controlling the Pong game
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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
import { POWERUP_SPEED_MULTIPLIER, PADDLE_SPEED as DEFAULT_PADDLE_SPEED, BALL_SPEED_X as DEFAULT_BALL_SPEED_X, BALL_SPEED_Y as DEFAULT_BALL_SPEED_Y } from "../utils/pong-constants";

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

	// Toggle power-up multiplier per room. Accepts ?enabled=true/false or JSON { enabled: boolean }
	fastify.post("/:roomId/powerup", async (req, reply) => {
		const { roomId } = req.params as { roomId: string };
		const enabledQuery = (req.query as any)?.enabled;
		let enabled: boolean | undefined;
		if (typeof enabledQuery !== 'undefined') {
			enabled = enabledQuery === 'true' || enabledQuery === true;
		} else if (req.body && typeof (req.body as any).enabled === 'boolean') {
			enabled = (req.body as any).enabled;
		}
		if (typeof enabled === 'undefined') return reply.code(400).send({ message: 'Missing `enabled` param' });
		const state = getGameState(roomId);
		if (!state) return reply.code(404).send({ message: 'Room not found' });
		state.powerUpMultiplier = enabled ? POWERUP_SPEED_MULTIPLIER : 1;
		// persist change for non-local rooms
		if (!roomId.startsWith('local_')) {
			const dbRoom = getRoom(roomId);
			if (dbRoom) saveRoom(roomId, state, dbRoom.players);
		}
		io.to(roomId).emit('gameState', state);
		return { message: 'Powerup updated', enabled };
	});

	// Set per-room speeds. Accepts query params or JSON body with paddleSpeed, ballSpeedX, ballSpeedY (numbers).
	fastify.post("/:roomId/speeds", async (req: FastifyRequest, reply: FastifyReply) => {
		const { roomId } = req.params as { roomId: string };
		const body = req.body as any || {};
		const query = req.query as any || {};
		const toNumber = (v: any) => {
			if (typeof v === 'number') return v;
			if (typeof v === 'string' && v.trim() !== '') {
				const n = Number(v);
				return Number.isFinite(n) ? n : undefined;
			}
			return undefined;
		};

		const paddleSpeed = toNumber(query.paddleSpeed ?? body.paddleSpeed);
		const ballSpeedX = toNumber(query.ballSpeedX ?? body.ballSpeedX);
		const ballSpeedY = toNumber(query.ballSpeedY ?? body.ballSpeedY);
		const difficulty = (query.difficulty ?? body.difficulty) as string | undefined;
		const gameLength = (query.gameLength ?? body.gameLength) as string | undefined;

		// If no params provided and no difficulty/gameLength provided, return bad request
		if (paddleSpeed === undefined && ballSpeedX === undefined && ballSpeedY === undefined && typeof difficulty === 'undefined' && typeof gameLength === 'undefined') {
			return reply.code(400).send({ message: 'Missing speed/option parameters' });
		}

		const state = getGameState(roomId);
		if (!state) return reply.code(404).send({ message: 'Room not found' });

		if (typeof paddleSpeed === 'number') state.paddleSpeed = paddleSpeed;
		if (typeof ballSpeedX === 'number') state.ballSpeedX = ballSpeedX;
		if (typeof ballSpeedY === 'number') state.ballSpeedY = ballSpeedY;

		// Apply difficulty multipliers when provided. Difficulty values: easy, medium, hard
		if (typeof difficulty === 'string') {
			const muls: Record<string, number> = { easy: 0.9, medium: 1, hard: 1.25 };
			const mul = muls[difficulty] ?? 1;
			// Only set values if they weren't explicitly provided above
			if (typeof paddleSpeed !== 'number') state.paddleSpeed = DEFAULT_PADDLE_SPEED * mul;
			if (typeof ballSpeedX !== 'number') state.ballSpeedX = DEFAULT_BALL_SPEED_X * mul;
			if (typeof ballSpeedY !== 'number') state.ballSpeedY = DEFAULT_BALL_SPEED_Y * mul;
		}

		// Apply game length (winning score) if provided. Values: short, long
		if (typeof gameLength === 'string') {
			const lengths: Record<string, number> = { short: 5, long: 10 };
			const win = lengths[gameLength];
			if (typeof win === 'number') state.winningScore = win;
		}

		console.log(`[GameController] Updated speeds for room ${roomId} paddle=${state.paddleSpeed} ballX=${state.ballSpeedX} ballY=${state.ballSpeedY} winningScore=${state.winningScore}`);

		// persist change for non-local rooms
		if (!roomId.startsWith('local_')) {
			const dbRoom = getRoom(roomId);
			if (dbRoom) saveRoom(roomId, state, dbRoom.players);
		}

		io.to(roomId).emit('gameState', state);
		return { message: 'Speeds updated', state };
	});
}

// Expose a server-side resume helper so other modules (index.ts) can trigger a
// server-driven resume when the room reaches 2 connected sockets.
export function resumeRoom(io: Server, roomId: string) {
	// Validation similar to POST /:roomId/resume
	const dbRoom = getRoom(roomId);
	if (!roomId.startsWith('local_') && roomId !== 'local' && (!dbRoom || dbRoom.players.length < 2)) {
		console.log(`[resumeRoom] Cannot resume ${roomId}: waiting for opponent.`);
		return;
	}
	if (isGameEnded(roomId)) {
		console.log(`[resumeRoom] Room ${roomId} already ended.`);
		return;
	}

	// Ensure there's an initialized state; if not, initialize it (but avoid overwriting existing state)
	const currentState = getGameState(roomId);
	if (!currentState) {
		resetGame(roomId);
	}

	// Notify clients that game is about to start
	io.to(roomId).emit("gameStarting");

	setTimeout(() => {
		// Re-check players before actually starting
		const currentRoom = getRoom(roomId);
		if (!roomId.startsWith('local_') && roomId !== 'local' && (!currentRoom || currentRoom.players.length < 2)) {
			console.log(`[RESUME-DELAY] Start aborted for room ${roomId}, an opponent disconnected.`);
			return;
		}
		if (!isGameEnded(roomId) && getIsPaused(roomId)) {
			startBallMovement(roomId);
			// Un-pause for this room (use local setter)
			setIsPaused(false, roomId);
			io.to(roomId).emit("gamePaused", { paused: false });
		}
	}, 1000);
}