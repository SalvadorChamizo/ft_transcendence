/**
 * @file pongAiController.ts
 * @brief Manages game logic for Player vs. AI matches.
 */
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { getGameState, moveUp, moveDown } from "../services/gameServices";
import fetch from 'node-fetch'; // Asegúrate de tener node-fetch instalado

// Types
interface AIKeyEvent {
    type: 'keydown' | 'keyup';
    key: 'ArrowUp' | 'ArrowDown';
    atMs: number;
}

interface AIActionResponse {
    events: AIKeyEvent[];
}

// Controler logic

// Add all AI intervals
const aiIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Initiates the ai loop for a specific game room
 *
 */
function startAiOpponent(roomId: string)
{
    console.log(`[AI Controller] Starting AI loop for room: ${roomId}`);

    // Security : Stops any loop in the room 
    if (aiIntervals.has(roomId))
    {
        clearInterval(aiIntervals.get(roomId)!);
    }

    const interval = setInterval(async () =>
    {
        const state = getGameState(roomId);
        if (state.gameEnded)
        {
            console.log(`[AI Controller] Game ended in room ${roomId}. Stopping AI loop.`);
            clearInterval(interval);
            aiIntervals.delete(roomId);
            return;
        }

        try
        {
            // Ask the ai service to decide the next movement
            const response = await fetch('http://ai-service:3010/ai/update',{
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, side: 'right', dt: 1 }), // for now the ai is always right paddle
            });

            if (!response.ok)
            {
                console.error(`[AI Controller] AI service returned an error: ${response.statusText}`);
                return;
            }

            const aiResponse: AIActionResponse = await response.json() as AIActionResponse;

            // Executes the keynote events
            for (const event of aiResponse.events)
            {
                setTimeout(() =>
                {
                    if (event.type === 'keydown')
                    {
                        if (event.key === 'ArrowUp')
                        {
                            moveUp('right', roomId);
                        }
                        else if (event.key === 'ArrowDown')
                        {
                            moveDown('right', roomId);
                        }
                    }
                    // no need for keyup
                }, event.atMs);
            }
        }
        catch (error) {
            console.error('[AI Controller] Failed to fetch AI move:', error);
            // if the ai service falls, clean everything
            clearInterval(interval);
            aiIntervals.delete(roomId);
        }
    }, 1000); // take everydecision each second

    aiIntervals.set(roomId, interval);
}

/**
 * Endpoint to start the game against the ai
 */
export async function pongAiController(fastify: FastifyInstance, io: Server)
{
    fastify.post("/game/:roomId/start-ai", async (req, reply) =>
    {
        const { roomId } = req.params as { roomId: string };
        
        // Initiates the ai loop
        startAiOpponent(roomId);
        io.to(roomId).emit("gameReady", { roomId });

        return { message: "AI opponent activated for room " + roomId };
    });
}