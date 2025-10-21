/**
 * @file pongAiController.ts
 * @brief Manages game logic for Player vs. AI matches.
 */
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { getGameState, moveUp, moveDown, isGameEnded } from "../services/gameServices";
import { PADDLE_SPEED as DEFAULT_PADDLE_SPEED } from "../utils/pong-constants";
import { getIsPaused } from "./gameControllers";

const aiIntervals = new Map<string, NodeJS.Timeout>();
const aiMovementTimers = new Map<string, NodeJS.Timeout[]>();

function stopAi(roomId: string)
{
    if (aiIntervals.has(roomId))
    {
        clearInterval(aiIntervals.get(roomId));
        aiIntervals.delete(roomId);
    }
    // Clear any scheduled movement timers
    if (aiMovementTimers.has(roomId))
    {
        aiMovementTimers.get(roomId)?.forEach(clearTimeout);
        aiMovementTimers.delete(roomId);
    }
    // Remove simulated key state for this AI
    if (aiKeyState.has(roomId)) aiKeyState.delete(roomId);
    console.log(`[AI] Stopped for room ${roomId}`);
}

// Simulate the keyboard keys state for the ai
const aiKeyState = new Map<string, { up: boolean, down: boolean }>();

export async function pongAiController(fastify: FastifyInstance, io: Server)
{
    fastify.post("/:roomId/start-ai", async (req, reply) =>
    {
        const { roomId } = req.params as { roomId: string };

        if (aiIntervals.has(roomId))
            return reply.send({ message: "AI already running." });

        console.log(`[AI] Starting for room ${roomId}`);
        aiKeyState.set(roomId, { up: false, down: false });

        // Planning loop for the ai, 1 second
        const intervalId = setInterval(async () => {
            const state = getGameState(roomId);
            const isPaused = getIsPaused(roomId);

            // Stop ai ionce the game ends
            if (state.gameEnded)
            {
                stopAi(roomId);
                return;
            }

            // If the game is paused, just skip this planning cycle.
            if (isPaused)
                return;


            try {
                // game state velocities are in px per tick (game runs at ~60fps).
                // The AI microservice expects velocities in px per second, so convert them.
                const aiServiceUrl = process.env.AI_SERVICE_URL || "http://ai-service:7010";
                console.log(`[AI] Requesting plan from ${aiServiceUrl} for room ${roomId}`);

                // Create a shallow clone of the state and convert velocities to px/sec
                const stateForAI = JSON.parse(JSON.stringify(state));
                if (stateForAI.ball && typeof stateForAI.ball.dx === 'number')
                {
                    // conver from px/frame to px/second assuming 60 frames per second
                    stateForAI.ball.dx = stateForAI.ball.dx * 60;
                    stateForAI.ball.dy = stateForAI.ball.dy * 60;
                }

                // Convert paddle speed from px/frame to px/sec (60fps). Use state override if present.
                const paddleFrameSpeed = typeof state.paddleSpeed === 'number' ? state.paddleSpeed : DEFAULT_PADDLE_SPEED;
                const paddleSpeedPxSec = paddleFrameSpeed * 60;

                const response = await fetch(`${aiServiceUrl}/ai/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ state: stateForAI, side: "right", dt: 1.0, paddleSpeed: paddleSpeedPxSec }), // dt is 1 second
                });

                if (!response.ok) throw new Error(`AI service error: ${response.statusText}`);

                const { events } = await response.json() as { events: { type: string, key: string, atMs: number }[] };
                console.log(`[AI] Received plan for room ${roomId}:`, events);

                // Clean old plans before executing the new one
                aiMovementTimers.get(roomId)?.forEach(clearTimeout);
                aiMovementTimers.set(roomId, []);

                // Execute the plan
                console.log(`[AI] Executing plan for room ${roomId}...`);
                for (const event of events)
                {
                    const timer = setTimeout(() =>
                    {
                        console.log(`[AI EXEC] Room ${roomId}: ${event.type} ${event.key}`);
                        const keys = aiKeyState.get(roomId);
                        if (!keys) return;

                        if (event.key === 'ArrowUp')
                            keys.up = (event.type === 'keydown');
                        else if (event.key === 'ArrowDown')
                            keys.down = (event.type === 'keydown');
                    }, event.atMs);
                    aiMovementTimers.get(roomId)?.push(timer);
                }

            }
            catch (error) {
                console.error("[AI] Failed to get plan from AI service:", error);
                stopAi(roomId);
            }
        }, 1000); // <-- RESTRICTIOM: 1 CALL PER SECOND

        aiIntervals.set(roomId, intervalId);
        io.to(roomId).emit("gameReady", { roomId });
        reply.send({ message: "AI started" });
    });

    // AI movement loop (60 times per second, like the game)
    setInterval(() => {
        for (const [roomId, keys] of aiKeyState.entries()) {
            if (getIsPaused(roomId) || isGameEnded(roomId)) continue;
            
            if (keys.up) moveUp("right", roomId);
            if (keys.down) moveDown("right", roomId);
        }
    }, 1000 / 60);

    fastify.post("/:roomId/stop-ai", async (req, reply) => {
        const { roomId } = req.params as { roomId: string };
        stopAi(roomId);
        reply.send({ message: "AI stopped" });
    });
}