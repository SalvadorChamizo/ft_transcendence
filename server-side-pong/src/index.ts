/**
 * @file index.ts
 * @brief Pong server entrypoint
 */


/**
 * Imports
 */
import fastify from "fastify";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { gameController, isPaused } from "./controllers/gameControllers";
import { getGameState, moveUp, moveDown, updateGame } from "./services/gameServices";

dotenv.config();

const app = fastify({ logger: true });
const server = createServer(app.server);
const io = new Server(server, { cors: { origin: "*" } });

/**
 * Auth middleware for socker.io
 * executed for each client trying to connect
 */
io.use((socket: Socket, next) =>
{
		const token = socket.handshake.auth.token;

		if (!token)
		{
			return next(new Error("Authentication error: No token provided."));
		}

		const JWT_SECRET = process.env.JWT_SECRET;
		if (!JWT_SECRET)
		{
			return next(new Error("Configuration error: JWT_SECRET not set on server."));
		}

		jwt.verify(token, JWT_SECRET, (err: any, decoded: any) =>
		{
			if (err)
			{
				console.error("Invalid token:", err.message);
				return next(new Error("Authentication error: Invalid token."));
			}
		// Add user data  for the future, review
		(socket as any).user = decoded;
		next(); // valid token connection allowed
	});
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

  // Player controls
	socket.on("moveUp", (side: "left" | "right") =>
		{
		if (!isPaused)
		{
			const state = moveUp(side);
			io.emit("gameState", state);
		}
	});

	socket.on("moveDown", (side: "left" | "right") =>
	{
		if (!isPaused)
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
		if (!isPaused)
		{
			const state = updateGame();
			io.emit("gameState", state);
		}
	}, 1000 / 60); // 60 FPS

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
server.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) =>
{
	if (err)
	{
		console.error(err);
		process.exit(1);
	}
	console.log(`Pong server running at ${address}`);
});