/**
 * @file pongAiController.ts
 * @brief Manages game logic for Player vs. AI matches.
 */
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { getGameState, moveUp, moveDown, isGameEnded } from "../services/gameServices";
import { PADDLE_SPEED as DEFAULT_PADDLE_SPEED, PADDLE_HEIGHT } from "../utils/pong-constants";
import { getIsPaused } from "./gameControllers";
import { startAiSchema, stopAiSchema } from "../schemas/pongSchemas";

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
    fastify.post("/:roomId/start-ai",{schema: startAiSchema}, async (req, reply) =>
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
                // Default to the ai-opponent container name used in docker-compose
                const aiServiceUrl = process.env.AI_SERVICE_URL || "http://ai-opponent:7010";
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

                if (!response.ok) {
                    const txt = await response.text().catch(() => '<no-body>');
                    console.error(`[AI] Non-OK response from AI service: ${response.status} ${response.statusText} body=${txt}`);
                    throw new Error(`AI service error: ${response.status} ${response.statusText}`);
                }

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
                // Do not stop the AI entirely; instead use a minimal local fallback so the AI continues
                // to move the paddle toward the ball. This keeps the match playable when the external
                // AI service is down or unreachable.
                try {
                    const currentState = getGameState(roomId);
                    if (currentState && currentState.ball) {
                        // Clear any previously scheduled fallback movement timers
                        // to avoid overlapping timers leaving the AI key state stuck.
                        aiMovementTimers.get(roomId)?.forEach(clearTimeout);
                        aiMovementTimers.set(roomId, []);
                        const paddleY = currentState.paddles.right.y;
                        const paddleCenter = paddleY + (PADDLE_HEIGHT / 2);
                        const ballY = currentState.ball.y;
                        let keys = aiKeyState.get(roomId);
                        if (!keys) {
                            keys = { up: false, down: false };
                        }
                        // If ball is significantly above/below paddle center, move toward it
                        const delta = ballY - paddleCenter;
                        const threshold = 10;
                        if (Math.abs(delta) <= threshold) {
                            // close enough
                            keys.up = false;
                            keys.down = false;
                            aiKeyState.set(roomId, keys);
                        } else {
                            // compute time to move the required distance using current paddle speed
                            const paddleFrameSpeed = typeof currentState.paddleSpeed === 'number' ? currentState.paddleSpeed : DEFAULT_PADDLE_SPEED;
                            const paddleSpeedPxSec = paddleFrameSpeed * 60; // convert from px/frame to px/sec
                            // ensure positive
                            const absDelta = Math.abs(delta);
                            // avoid division by zero
                            const timeSeconds = paddleSpeedPxSec > 0 ? (absDelta / paddleSpeedPxSec) : 0;
                            const timeMs = Math.max(50, Math.min(2000, Math.round(timeSeconds * 1000))); // clamp 50ms..2s

                            if (delta < 0) {
                                // ball is above -> move up
                                keys.up = true;
                                keys.down = false;
                                aiKeyState.set(roomId, keys);
                                const t = setTimeout(() => {
                                    const k = aiKeyState.get(roomId);
                                    if (k) { k.up = false; k.down = false; aiKeyState.set(roomId, k); }
                                }, timeMs);
                                // track the fallback timer so it can be cleared when new plan arrives
                                const arr = aiMovementTimers.get(roomId) ?? [];
                                arr.push(t);
                                aiMovementTimers.set(roomId, arr);
                            } else {
                                // ball is below -> move down
                                keys.up = false;
                                keys.down = true;
                                aiKeyState.set(roomId, keys);
                                const t = setTimeout(() => {
                                    const k = aiKeyState.get(roomId);
                                    if (k) { k.up = false; k.down = false; aiKeyState.set(roomId, k); }
                                }, timeMs);
                                const arr = aiMovementTimers.get(roomId) ?? [];
                                arr.push(t);
                                aiMovementTimers.set(roomId, arr);
                            }
                        }
                    }
                } catch (e) {
                    console.error('[AI] Fallback planning failed:', e);
                }
            }
        }, 1000); // RESTRICTIOM: 1 CALL PER SECOND

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

    fastify.post("/:roomId/stop-ai",{schema: stopAiSchema}, async (req: any, reply: any) => {
        const { roomId } = req.params as { roomId: string };
        stopAi(roomId);
        reply.send({ message: "AI stopped" });
    });
}