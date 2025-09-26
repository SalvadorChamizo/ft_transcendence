/**
 * @file index.ts
 * @brief Pong server con soporte para modo LOCAL y REMOTE
 */

import fastify from "fastify";
import websocket, { SocketStream } from "@fastify/websocket";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { gameController, isPaused, setPaused } from "./controllers/gameControllers";
import {
  moveUp,
  moveDown,
  updateGame,
  resetGame,
} from "./services/gameServices";

dotenv.config();

const app = fastify({ logger: true });

export const playerConnections = new Map<string, SocketStream>();
export const playerSides = new Map<string, "left" | "right" | "both">(); // "both" para modo local

app.register(websocket);
gameController(app);

app.get("/", { websocket: true }, (connection: SocketStream, req) => {
  console.log("=== NEW WEBSOCKET CONNECTION ===");

  // 1. Extraer token de la query string
  const token = (req.query as { token: string }).token;

  if (!token) {
    console.error("❌ No token provided!");
    connection.socket.close(1008, "Missing token");
    return;
  }

  // 2. Verificar el token JWT
  let decodedToken: { id: string; username: string };
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    console.log(`✅ Token verified for user: ${decodedToken.username}`);
  } catch (err) {
    console.error("❌ Invalid token!", err);
    connection.socket.close(4001, "Invalid token");
    return;
  }

  // 3. Usar el ID del token como el único identificador del cliente
  const clientId = decodedToken.id;
  console.log(`✅ Player ID from token: ${clientId}`);

  // 4. Extraer game mode de la query (o default a 'local')
  const gameMode = (req.query as { mode?: string }).mode || "local";

  playerConnections.set(clientId, connection);
  
  // 5. Asignación de lado según el modo de juego
  let assignedSide: "left" | "right" | "both";
  
  if (gameMode === "local") {
    assignedSide = "both";
    playerSides.set(clientId, assignedSide);
    console.log(`🎮 LOCAL MODE: Player ${clientId} controls BOTH paddles`);
  } else {
    const sidesInUse = Array.from(playerSides.values());
    assignedSide = sidesInUse.includes("left") ? "right" : "left";
    playerSides.set(clientId, assignedSide);
    console.log(`🎮 REMOTE MODE: Player ${clientId} → ${assignedSide} paddle`);
  }

  // Enviar asignación al cliente
  setImmediate(() => {
    try {
      connection.socket.send(JSON.stringify({
        event: "assigned",
        side: assignedSide,
        mode: gameMode
      }));
      console.log(`📤 Sent assignment to ${clientId}: ${assignedSide} (${gameMode})`);
    } catch (err) {
      console.error(`❌ Error sending assignment:`, err);
    }
  });

  // 6. Manejar mensajes del cliente
  connection.socket.on("message", (message: Buffer) => {
    try {
      const msg = JSON.parse(message.toString());
      
      if (isPaused) return;

      const playerSide = playerSides.get(clientId);
      if (!playerSide) return;

      // El frontend envía { event: "moveUp", payload: "left" | "right" }
      const targetSide = msg.payload; // Usamos 'payload' como envía el frontend
      if (!targetSide) return;

      if (playerSide === "both" || playerSide === targetSide) {
        if (msg.event === "moveUp") {
          moveUp(targetSide);
        } else if (msg.event === "moveDown") {
          moveDown(targetSide);
        }
      } else {
        console.warn(`⚠️ ${clientId} tried to move ${targetSide} but is assigned to ${playerSide}`);
      }
    } catch (e) {
      console.error("Invalid message:", message.toString(), e);
    }
  });

  connection.socket.on("error", (err: Error) => {
    console.error(`❌ WebSocket error (${clientId}):`, err);
  });

  connection.socket.on("close", () => {
    console.log(`👋 Player ${clientId} disconnected`);
    playerConnections.delete(clientId);
    playerSides.delete(clientId);

    // Si no quedan jugadores, pausar y resetear el juego
    if (playerConnections.size === 0) {
        console.log("All players disconnected. Pausing and resetting game.");
        setPaused(true);
        resetGame();
    }
  });
});

// Game loop
let frameCount = 0;
setInterval(() => {
  if (!isPaused && playerConnections.size > 0) {
    const state = updateGame();
    const message = JSON.stringify({ event: "gameState", data: state });

    if (frameCount % 300 === 0) { // Log cada 5 segundos
      console.log(`📡 Broadcasting frame ${frameCount} to ${playerConnections.size} players`);
    }
    frameCount++;

    for (const [playerId, connection] of playerConnections.entries()) {
      try {
        if (connection.socket.readyState === 1) { // 1 = OPEN
          connection.socket.send(message);
        }
      } catch (err) {
        console.error(`Error sending to ${playerId}:`, err);
      }
    }
  }
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Pong server running at ${address}`);
});