/**
 * @file index.ts
 * @brief Pong server entrypoint with room support
 */

import fastify from "fastify";
import { Server } from "socket.io";
import cors from "@fastify/cors";
import { gameController, getIsPaused } from "./controllers/gameControllers";
import { pongAiController } from "./controllers/pongAiController";
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
interface Room {
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
 */
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinRoom", (payload?: { roomId?: string }) => {
    const roomId = payload?.roomId;
    if (!roomId) {
      socket.emit("error", { message: "Room ID is required" });
      return;
    }

    // The game state must exist for a room to be valid.
    if (roomId !== "local" && !roomStates.has(roomId)) {
      socket.emit("roomNotFound", { roomId });
      console.log(`Socket ${socket.id} failed to join non-existent room ${roomId}`);
      return;
    }

    const roomAdapter = io.sockets.adapter.rooms.get(roomId);
    const numPlayers = roomAdapter ? roomAdapter.size : 0;

    if (numPlayers >= 2) {
      socket.emit("roomFull", { roomId });
      console.log(`Socket ${socket.id} failed to join full room ${roomId}`);
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

    const role: "left" | "right" =
      room.players.indexOf(socket.id) === 0 ? "left" : "right";
    socket.emit("roomJoined", { roomId, role });
    console.log(`Socket ${socket.id} joined ${roomId} as ${role}`);

    if (room.players.length === 2) {
      console.log(`Room ${roomId} is full. Emitting 'gameReady'.`);
      io.to(roomId).emit("gameReady", { roomId });
    }
  });

  socket.on("moveUp", (side: "left" | "right", roomId?: string) => {
    if (!getIsPaused(roomId) && !isGameEnded(roomId)) {
      const state = moveUp(side, roomId);
      if (state) io.to(roomId ?? "local").emit("gameState", state);
    }
  });

  socket.on("moveDown", (side: "left" | "right", roomId?: string) => {
    if (!getIsPaused(roomId) && !isGameEnded(roomId)) {
      const state = moveDown(side, roomId);
      if (state) io.to(roomId ?? "local").emit("gameState", state);
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        const remainingPlayerId = room.players[0];

        const state = getGameState(roomId);
        // Only assign victory if the game existed and was not ended
        if (state && !state.gameEnded) {
          const disconnectedPlayerRole = playerIndex === 0 ? "left" : "right";
          if (disconnectedPlayerRole === "left") {
            state.scores.right = WINNING_SCORE;
          } else {
            state.scores.left = WINNING_SCORE;
          }
          state.gameEnded = true;
          io.to(roomId).emit("gameState", state);
        }

        if (remainingPlayerId) {
          io.to(roomId).emit("opponentDisconnected");
        }

        rooms.delete(roomId);
        deleteRoom(roomId); // Also delete the game state
        console.log(`Room ${roomId} and its game state have been deleted.`);
        break;
      }
    }
  });

  socket.on("disconnecting", () => {
    try {
      if (socket.rooms && socket.rooms.has("local")) {
        const localSet = io.sockets.adapter.rooms.get("local");
        const currentSize = localSet ? localSet.size : 0;
        const remaining = Math.max(0, currentSize - 1);
        if (remaining > 0) {
          io.to("local").emit("opponentDisconnected");
        } else {
          resetGame("local");
        }
      }
    } catch (err) {
      console.error("Error handling disconnecting for socket", socket.id, err);
    }
  });
});

/**
 * GAME LOOP
 */
setInterval(() => {
  // Create a new array from keys to avoid issues if roomStates is modified during iteration
  const activeRoomIds = Array.from(roomStates.keys());
  
  // Also include the 'local' game
  if (!activeRoomIds.includes('local')) {
	  activeRoomIds.push('local');
  }

  for (const roomId of activeRoomIds) {
    if (!getIsPaused(roomId)) {
      const state = updateGame(roomId);
      // Only emit if the state was updated
      if (state) {
        io.to(roomId).emit("gameState", state);
      }
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