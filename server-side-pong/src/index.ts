
/**
 * @file index.ts
 * @brief
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

export type PaddleSide = "left" | "right";

export interface PaddleState
{
	y: number;
}

export interface GameState
{
	paddles:
	{
		left: PaddleState;
		right: PaddleState;
	};
}

import { registerGameHandlers } from "./controllers/gameControllers";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server,
	{
	cors: { origin: "*" },
	});

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) =>
	{
  registerGameHandlers(io, socket);
	});
server.listen(PORT, () =>
	{
		console.log(`Pong paddle server running on port ${PORT}`);
	});
