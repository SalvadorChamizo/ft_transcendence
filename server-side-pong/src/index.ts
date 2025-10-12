/**
 * @file index.ts
 * @brief Pong server entrypoint with room support
 */

import fastify from "fastify";
import { Server } from "socket.io";
import cors from "@fastify/cors";
import { gameController, getIsPaused } from "./controllers/gameControllers";
import {pongAiController} from "./controllers/pongAiController"
import { roomRoutes } from "./routes/roomRoutes";
import { roomStates } from "./services/roomService";
import {
	getGameState,
	moveUp,
	moveDown,
	updateGame,
	isGameEnded,
	resetGame,
	deleteRoom,
} from "./services/gameServices";
import { WINNING_SCORE } from "./utils/pong-constants";

const app = fastify({ logger: true });
const io = new Server(app.server, { cors: { origin: "*" } });

/**
 * ROOMS
 */
interface Room
{
  id: string;
  players: string[]; // socket ids
}
const rooms: Map<string, Room> = new Map();

/**
 * Register CORS plugin
 */
app.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:7000", "*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

/**
 * Register REST routes
 */
app.register(roomRoutes, { prefix: "/api" });
gameController(app, io, rooms);
pongAiController(app, io);

/**
 * 	SOCKETS.IO
 * Handles real-time communication for game state updates and player actions
 * with room support
 * for remote it checks that there are two players connected in the room
 */
io.on("connection", (socket) =>
{
	console.log("Player connected:", socket.id);

	// Do NOT auto-join all sockets into the shared "local" room.
	// Clients must explicitly request to join "local" by emitting { roomId: 'local' }.

	// joinRoom accepts an optional payload: { roomId?: string }
	socket.on("joinRoom", (payload?: { roomId?: string }) =>
	{
		const roomId = payload?.roomId;
		if (!roomId) {
			socket.emit("error", { message: "Room ID is required" });
			return;
		}

		// Check if the room exists (a game state has been created for it)
		if (roomId !== "local" && !roomStates.has(roomId)) {
			socket.emit("roomNotFound", { roomId });
			return;
		}

		const roomAdapter = io.sockets.adapter.rooms.get(roomId);
		const numPlayers = roomAdapter ? roomAdapter.size : 0;

		if (numPlayers >= 2) {
			socket.emit("roomFull", { roomId });
			return;
		}

		socket.join(roomId);

		// Manage players in the room
		let room = rooms.get(roomId);
		if (!room) {
			room = { id: roomId, players: [] };
			rooms.set(roomId, room);
		}
		if (!room.players.includes(socket.id)) {
			room.players.push(socket.id);
		}

		const role: "left" | "right" = room.players.indexOf(socket.id) === 0 ? "left" : "right";
		socket.emit("roomJoined", { roomId, role });
		console.log(`Socket ${socket.id} joined ${roomId} as ${role}`);

		if (room.players.length === 2) {
			console.log(`Room ${roomId} is full. Emitting 'gameReady'.`);
			io.to(roomId).emit("gameReady", { roomId });
		}
	});

	socket.on("moveUp", (side: "left" | "right", roomId?: string) =>
	{
    	if (!getIsPaused(roomId) && !isGameEnded(roomId))
		{
			const state = moveUp(side, roomId);
    		io.to(roomId ?? "local").emit("gameState", state);
		}
	});

	socket.on("moveDown", (side: "left" | "right", roomId?: string) =>
  	{
    	if (!getIsPaused(roomId) && !isGameEnded(roomId))
    	{
    		const state = moveDown(side, roomId);
    		io.to(roomId ?? "local").emit("gameState", state);
		}
	});

	socket.on("disconnect", () =>
	{
		console.log("Player disconnected:", socket.id);
		for (const [roomId, room] of rooms.entries())
		{
			const playerIndex = room.players.indexOf(socket.id);
			if (playerIndex !== -1)
			{
				// Player was in this room, remove them
				room.players.splice(playerIndex, 1);
				const remainingPlayerId = room.players[0]; // The one left
	
				// If the game was ongoing, grant victory to the remaining player
				const state = getGameState(roomId);
				if (!state.gameEnded)
				{
					// Determine which side won
					if (remainingPlayerId)
					{
						// Find the role of the disconnected player to determine the winner
						// This is a simplified assumption; a more robust system would store roles
						const disconnectedPlayerRole = playerIndex === 0 ? "left" : "right";
						if (disconnectedPlayerRole === "left") {
							state.scores.right = WINNING_SCORE;
						} else {
							state.scores.left = WINNING_SCORE;
						}
					}
					state.gameEnded = true;
					io.to(roomId).emit("gameState", state); // Notify about the win
				}
	
				// Notify remaining player and clean up the room
				if (remainingPlayerId) {
					io.to(roomId).emit("opponentDisconnected");
					console.log(`Player ${socket.id} left room ${roomId}. Notifying remaining player.`);
				}
	
				// Delete the room since it's no longer playable
				rooms.delete(roomId);
				deleteRoom(roomId);
				console.log(`Room ${roomId} and its game state have been deleted.`);
				
				break; // Exit loop once the room is handled
			}
		}
	});

	/**  
	* Handle sockets that are leaving rooms before the final 'disconnect' event.
	* This is useful to detect if a socket was part of the special 'local' room
	* and notify remaining players or reset the local state accordingly.
	*/
	socket.on('disconnecting', () => {
		try {
			if (socket.rooms && socket.rooms.has('local')) {
				const localSet = io.sockets.adapter.rooms.get('local');
				const currentSize = localSet ? localSet.size : 0;
				const remaining = Math.max(0, currentSize - 1); // after this socket leaves
				if (remaining > 0) {
					io.to('local').emit('opponentDisconnected');
					console.log(`Player ${socket.id} left local. Notifying remaining players.`);
				} else {
					// No players left in local, reset its state
					resetGame('local');
					console.log('Local room emptied. Reset local state.');
				}
			}
		} catch (err) {
			console.error('Error handling disconnecting for socket', socket.id, err);
		}
	});
});

/**
 * GAME LOOP
 */

setInterval(() =>
{
	const activeRooms = ["local", ...roomStates.keys()];

	for (const roomId of activeRooms)
	{
		if (!getIsPaused(roomId))
		{
			const state = updateGame(roomId);
			io.to(roomId).emit("gameState", state);
		}
	}
}, 1000 / 60);

/**
 * START SERVER
 */
const PORT = process.env.PORT || 7000;
app.listen({ port: Number(PORT), host: "0.0.0.0" }, () =>
{
	console.log(`Pong server running at http://localhost:${PORT}`);
});