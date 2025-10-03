/**
 * @file index.ts
 * @brief Pong server entrypoint
 */

/**
 * Imports
 */
import fastify from "fastify";
import { Server } from "socket.io";
import cors from "@fastify/cors";
import { gameController, getIsPaused } from "./controllers/gameControllers";
import {
  getGameState,
  moveUp,
  moveDown,
  updateGame,
  isGameEnded,
} from "./services/gameServices";

const app = fastify({ logger: true });
const io = new Server(app.server, { cors: { origin: "*" } });

/**
 * Register CORS plugin
 */
app.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:3000", "*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
});

/**
 * Register REST routes with io injected
 */
gameController(app, io);

// WebSockets
io.on("connection", (socket) =>
	{
  	console.log("Player connected:", socket.id);

  // Send initial state
	socket.emit("gameState", getGameState());
	socket.emit("gamePaused", { paused: getIsPaused() });

  // Player controls
	socket.on("moveUp", (side: "left" | "right") =>
		{
		if (!getIsPaused() && !isGameEnded)
		{
			const state = moveUp(side);
			io.emit("gameState", state);
		}
	});

	socket.on("moveDown", (side: "left" | "right") =>
	{
		if (!getIsPaused() && !isGameEnded)
		{
			const state = moveDown(side);
			io.emit("gameState", state);
		}
	});

	socket.on("disconnect", () =>
	{
		console.log("Player disconnected:", socket.id);
	});
});

/**
 * Game loop for ball + scoring
 */
	setInterval(() =>
	{
		if (!getIsPaused())
		{
			const state = updateGame();
			io.emit("gameState", state);
		}
	}, 1000 / 120); // 60 FPS

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT), host: "0.0.0.0" }, () =>
	{
		console.log(`Pong server running at http://localhost:${PORT}`);
	});
