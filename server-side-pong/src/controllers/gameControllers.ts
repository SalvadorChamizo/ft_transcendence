/**
 * @file gameControllers.ts
 * @brief Import io to use socket.IO server and sockets, the the gameService and the PaddleSide
 */

import { Server , Socket } from "socket.io";
import * as gameService from "../services/gameServices";
import { PaddleSide } from "../";

/**
 * @brief register the player status and the paddle movement
 * Some logs to check the connection
 * calls to the movement methods for the paddles
 * actualizes the gameState with each movement
 */
export function registerGameHandlers(io: Server, socket: Socket)
{
  console.log("Player connected:", socket.id);

  socket.emit("paddles", gameService.getGameState());

  socket.on("moveUp", (side: PaddleSide) =>
	{
    	gameService.moveUp(side);
    	io.emit("paddles", gameService.getGameState());
	});

  socket.on("moveDown", (side: PaddleSide) =>
	{
		gameService.moveDown(side);
		io.emit("paddles", gameService.getGameState());
	});

  socket.on("disconnect", () =>
	{
		console.log("Player disconnected:", socket.id);
	});
}
