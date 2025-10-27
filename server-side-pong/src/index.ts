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
import { saveRoom, getRoom, getAllRooms, deleteRoom as dbDeleteRoom } from "./db/roomRepository";
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


/**
 * Register CORS plugin
 */
const whitelist = ["http://localhost:5173", "http://localhost:7000"];
app.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1 || /http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

/**
 * Register REST routes
 */
app.register(roomRoutes);
gameController(app, io);
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

    // Concurrent local rooms that strat with local_
    if (!roomId.startsWith("local_")) {
      const dbRoom = getRoom(roomId);
      if (!dbRoom) {
        socket.emit("roomNotFound", { roomId });
        console.log(`Socket ${socket.id} failed to join non-existent room ${roomId}`);
        return;
      }
    } else if (!roomStates.has(roomId)) {
      // if the local room doesnt exist ,create it
      resetGame(roomId);
      console.log(`[Local] Room ${roomId} creada automáticamente en joinRoom`);
    }

    const roomAdapter = io.sockets.adapter.rooms.get(roomId);
    const numPlayers = roomAdapter ? roomAdapter.size : 0;

    if (numPlayers >= 2) {
      socket.emit("roomFull", { roomId });
      console.log(`Socket ${socket.id} failed to join full room ${roomId}`);
      return;
    }

    socket.join(roomId);

    // Manage players in the room (DB for non-local, memory for local_)
    if (roomId.startsWith("local_")) {
      // no persistence for local rooms
    } else {
      let dbRoom = getRoom(roomId);
      if (!dbRoom) {
        dbRoom = { id: roomId, state: {}, players: [] };
      }
      if (!dbRoom.players.includes(socket.id)) {
        dbRoom.players.push(socket.id);
        saveRoom(roomId, dbRoom.state, dbRoom.players);
      }
    }

    let role: "left" | "right" = "left";
    if (roomId.startsWith("local_")) {
      const roomAdapter = io.sockets.adapter.rooms.get(roomId);
      const idx = roomAdapter ? Array.from(roomAdapter).indexOf(socket.id) : 0;
      role = idx === 0 ? "left" : "right";
    } else {
      const dbRoom = getRoom(roomId);
      if (dbRoom) {
        const idx = dbRoom.players.indexOf(socket.id);
        role = idx === 0 ? "left" : "right";
      }
    }
    socket.emit("roomJoined", { roomId, role });
    console.log(`Socket ${socket.id} joined ${roomId} as ${role}`);

    if (roomId.startsWith("local_")) {
      const roomAdapter = io.sockets.adapter.rooms.get(roomId);
      if (roomAdapter && roomAdapter.size === 2) {
        io.to(roomId).emit("gameReady", { roomId });
      }
    } else {
      const dbRoom = getRoom(roomId);
      if (dbRoom && dbRoom.players.length === 2) {
        io.to(roomId).emit("gameReady", { roomId });
      }
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
    for (const roomId of socket.rooms) {
      if (roomId.startsWith("local_")) {
        continue;
      }
      const dbRoom = getRoom(roomId);
      if (dbRoom) {
        const playerIndex = dbRoom.players.indexOf(socket.id);
        if (playerIndex !== -1) {
          dbRoom.players.splice(playerIndex, 1);
          const remainingPlayerId = dbRoom.players[0];
          // Game state
          const state = getGameState(roomId);
          if (state && !state.gameEnded) {
            const disconnectedPlayerRole = playerIndex === 0 ? "left" : "right";
            if (disconnectedPlayerRole === "left") {
              state.scores.right = WINNING_SCORE;
            } else {
              state.scores.left = WINNING_SCORE;
            }
            state.gameEnded = true;
            state.gameEndedTimestamp = Date.now();
            io.to(roomId).emit("gameState", state);
          }
          if (remainingPlayerId) {
            io.to(roomId).emit("opponentDisconnected");
          }
          if (dbRoom.players.length === 0) {
            dbDeleteRoom(roomId);
            deleteRoom(roomId); // clean the state
            console.log(`Room ${roomId} and its game state have been deleted.`);
          } else {
            saveRoom(roomId, state, dbRoom.players);
          }
          break;
        }
      }
    }
  });

  socket.on("disconnecting", () => {
    try {
      for (const roomId of socket.rooms) {
        if (roomId.startsWith("local_")) {
          const localSet = io.sockets.adapter.rooms.get(roomId);
          const currentSize = localSet ? localSet.size : 0;
          const remaining = Math.max(0, currentSize - 1);
          if (remaining > 0) {
            io.to(roomId).emit("opponentDisconnected");
          } else {
            resetGame(roomId);
          }
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
 * GARBAGE COLLECTOR
 */
  setInterval(() => {
  const now = Date.now();
  for (const [roomId, state] of roomStates.entries()) {
    if (state.gameEnded && state.gameEndedTimestamp) {
    if (now - state.gameEndedTimestamp > 2000) { // 2 seconds
      deleteRoom(roomId);
      if (!roomId.startsWith("local_")) dbDeleteRoom(roomId);
      console.log(`Cleaned up ended room ${roomId}`);
    }
    }
  }
  }, 5000); // Check every 5 seconds

/**
 * START SERVER
 */
app.get("/health", async (req, reply) => {
  const uptime = process.uptime();

  return reply.status(200).send({
    service: "pong-service",
    status: "ok",
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

const PORT = process.env.PORT || 7000;
app.listen({ port: Number(PORT), host: "0.0.0.0" }, () =>
{
	console.log(`Pong server running at http://localhost:${PORT}`);
});