/**
 * @file index.ts
 * @brief Pong server entrypoint with room support
 */

import fastify from "fastify";
import { Server } from "socket.io";
import cors from "@fastify/cors";
import { gameController, getIsPaused } from "./controllers/gameControllers";
import {pongAIController} from "./controllers/pongAiController"
import {
  getGameState,
  moveUp,
  moveDown,
  updateGame,
  isGameEnded,
  roomStates,
} from "./services/gameServices";

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

function findOrCreateRoom(socketId: string): { roomId: string; role: "left" | "right" }
{
	for (const [roomId, room] of rooms.entries())
	{
		if (room.players.length === 1)
		{
			room.players.push(socketId);
			return { roomId, role: "right" };
		}
	}
	const newRoomId = `room-${Math.random().toString(36).substring(2, 8)}`;
	rooms.set(newRoomId, { id: newRoomId, players: [socketId] });
	return { roomId: newRoomId, role: "left" };
}
/**
 * Register CORS plugin
 */
app.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:3000", "*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

/**
 * Register REST routes
 */
gameController(app, io, rooms);
pongAicontroller(app,io);

/**
 * 	SOCKETS.IO
 * Handles real-time communication for game state updates and player actions
 * with room support
 * for remote it checks that there are two players connected in the room
 */
io.on("connection", (socket) =>
{
	console.log("Player connected:", socket.id);
	socket.join("local");

	socket.on("joinRoom", () =>
	{
    	const { roomId, role } = findOrCreateRoom(socket.id);
    	socket.join(roomId);

    	socket.emit("roomJoined", { roomId, role });
    	console.log(`Socket ${socket.id} joined ${roomId} as ${role}`);

	    const currentRoom = rooms.get(roomId);
    	if (currentRoom && currentRoom.players.length === 2)
    	{
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
        		// Deletes the player from the room
        		room.players.splice(playerIndex, 1);

		        io.to(roomId).emit("opponentDisconnected");
        		console.log(`Player ${socket.id} left room ${roomId}. Notifying remaining players.`);

	        	if (room.players.length < 2)
    	    	{
        			rooms.delete(roomId);
          			roomStates.delete(roomId);
          			console.log(`Room ${roomId} and its game state have been deleted.`);
        		}
        		break;
      		}
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
const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT), host: "0.0.0.0" }, () =>
{
	console.log(`Pong server running at http://localhost:${PORT}`);
});