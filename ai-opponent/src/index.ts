/**
 * Simple AI Opponent Microservice for Pong
 * @brief Listens for game state and returns updated paddle position
 * @details This microservice receives the current game state and the side of the paddle (left or right),
 * then computes and returns the new Y position for the paddle to follow the ball.
 * It works like a virtual opponent
 */

import express from 'express';
import cors from 'cors';
import { GameState, Side } from './types';
import { computeAIPaddleY, topToCenterY, centerToTopY } from './ai';


/**
 * AI Opponent Microservice for Pong
 */
const PORT = Number(process.env.PORT || 3000);
const FIELD_HEIGHT = Number(process.env.FIELD_HEIGHT || 600);
const PADDLE_HEIGHT = Number(process.env.PADDLE_HEIGHT || 100);
const PADDLE_SPEED = Number(process.env.PADDLE_SPEED || 220); // px/s
const PADDLE_X_LEFT = Number(process.env.PADDLE_X_LEFT || 10);
const PADDLE_X_RIGHT = Number(process.env.PADDLE_X_RIGHT || 790);
const AIM_BIAS = Number(process.env.AIM_BIAS || 0);
const PADDLE_Y_IS_CENTER = (process.env.PADDLE_Y_IS_CENTER || 'true') === 'true';


const app = express();
app.use(cors());
app.use(express.json());


app.get('/health', (_req, res) => res.json({ status: 'ok' }));


/**
* POST /ai/update
* body: { state: GameState, side: 'left'|'right', dt?: number }
* devuelve: { y: number } --> la nueva Y de la paleta (misma convención que acepta el servicio: center o top según env)
*/
app.post('/ai/update', (req, res) => {
try {
const { state, side, dt } = req.body as { state: GameState; side: Side; dt?: number };
if (!state || !side) return res.status(400).json({ error: 'missing state or side' });


const paddle = side === 'left' ? state.paddles.left : state.paddles.right;
const targetX = side === 'left' ? PADDLE_X_LEFT : PADDLE_X_RIGHT;
const dtSeconds = typeof dt === 'number' && dt > 0 ? dt : 1.0; // por defecto 1s como pediste


const incomingPaddleY = paddle.y;
const centerY = PADDLE_Y_IS_CENTER ? incomingPaddleY : topToCenterY(incomingPaddleY, PADDLE_HEIGHT);


const newCenter = computeAIPaddleY(
centerY,
PADDLE_HEIGHT,
state.ball,
FIELD_HEIGHT,
targetX,
PADDLE_SPEED,
dtSeconds,
AIM_BIAS,
true
);


const outY = PADDLE_Y_IS_CENTER ? newCenter : centerToTopY(newCenter, PADDLE_HEIGHT);


return res.json({ y: outY });
} catch (err) {
console.error(err);
return res.status(500).json({ error: 'internal error' });
}
});


app.listen(PORT, () => {
console.log(`Pong AI microservice listening on port ${PORT}`);
console.log(`FIELD_HEIGHT=${FIELD_HEIGHT} PADDLE_HEIGHT=${PADDLE_HEIGHT} PADDLE_SPEED=${PADDLE_SPEED}`);
});