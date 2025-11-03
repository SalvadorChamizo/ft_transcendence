/**
 * Simple AI Opponent Microservice for Pong
 * @brief Listens for game state and returns a sequence of key events.
 */

import express from 'express';
import cors from 'cors';
import { GameState, Side, AIActionResponse } from './utils/types';
import { computeAIKeyEvents } from './services/ai';

// Environment and Game Constants
const PORT = Number(process.env.PORT || 7010);

// Game dimensions and rules
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET_X = 30;
const PADDLE_SPEED = 6 * 60; // Paddle speed in px/second

// Calculated constants
const FIELD_HEIGHT = CANVAS_HEIGHT;
const PADDLE_X_LEFT = PADDLE_OFFSET_X;
const PADDLE_X_RIGHT = CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, reply) => {
  const uptime = process.uptime();

  return reply.status(200).send({
    service: "ai-opponent",
    status: "ok",
    uptime: Math.round(uptime),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
* POST /ai/update
* body: { state: GameState, side: 'left'|'right', dt?: number }
* returns: AIActionResponse -> The sequence of key events for the AI paddle.
*/
app.post('/ai/update', (req, res) => {
    try {
    const { state, side, dt, paddleSpeed } = req.body as { state: GameState; side: Side; dt?: number, paddleSpeed?: number };
        if (!state || !side) {
            return res.status(400).json({ error: 'Missing state or side' });
        }

        const paddle = side === 'left' ? state.paddles.left : state.paddles.right;
        const targetX = side === 'left' ? PADDLE_X_LEFT : PADDLE_X_RIGHT;
    const dtSeconds = typeof dt === 'number' && dt > 0 ? dt : 1.0; // Default to 1 second if dt is not provided

        const currentPaddleTopY = paddle.y;
        const currentCenterY = currentPaddleTopY + (PADDLE_HEIGHT / 2);

        // Call the original function that generates key events
        // Allow AIS caller to override paddle speed (px/sec). Otherwise use local default.
        const paddleSpeedUsed = typeof paddleSpeed === 'number' && paddleSpeed > 0 ? paddleSpeed : PADDLE_SPEED;

        const aiResponse: AIActionResponse = computeAIKeyEvents(
            currentCenterY,
            PADDLE_HEIGHT,
            state.ball,
            FIELD_HEIGHT,
            targetX,
            paddleSpeedUsed,
            dtSeconds
        );

        return res.json(aiResponse);

    } catch (err) {
        console.error("AI Update Error:", err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Pong AI microservice listening on port ${PORT}`);
});