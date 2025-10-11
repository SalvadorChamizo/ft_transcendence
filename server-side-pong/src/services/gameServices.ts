/**
 * @file gameServices.ts
 * @brief Core game logic for Pong (supports Local + Online rooms)
 */

import {
	WINNING_SCORE,
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	BALL_RADIUS,
	PADDLE_HEIGHT,
	PADDLE_SPEED,
	PADDLE_OFFSET_X,
	PADDLE_WIDTH,
	BALL_SPEED_X,
	BALL_SPEED_Y,
} from "../utils/pong-constants";

// Map to keep pending serve timers per room (including 'local') so we can clear them
const serveTimers = new Map<string, NodeJS.Timeout>();

export interface Paddle { y: number; }
export interface Ball { x: number; y: number; dx: number; dy: number; }
export interface Scores { left: number; right: number; }

export interface GameState {
	paddles: { left: Paddle; right: Paddle };
	ball: Ball;
	scores: Scores;
	gameEnded: boolean;
}

/**
 * State for local game mode
 */
let localState: GameState = createInitialState();

/**
* Map for the state in each room 
*/
export const roomStates = new Map<string, GameState>();

export const isGameEnded = (roomId?: string) =>
{
	const state = getGameState(roomId);
	return state.gameEnded;
};

/**
 * HELPERS
 */
function createInitialState(): GameState
{
	return {
		paddles: { left: { y: 250 }, right: { y: 250 } },
		ball: { x: 400, y: 300, dx: 0, dy: 0 },
		scores: { left: 0, right: 0 },
		gameEnded: false,
  	};
}

export function resetGame(roomId?: string): GameState
{
	const state = createInitialState();
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;
	return state;
}

export function deleteRoom(roomId: string)
{
	// Clear any pending serve timer
	const timer = serveTimers.get(roomId);
	if (timer) {
		clearTimeout(timer);
		serveTimers.delete(roomId);
	}
	// Remove stored state
	roomStates.delete(roomId);
}

export function getGameState(roomId?: string): GameState
{
	if (roomId && roomId !== "local") return roomStates.get(roomId) ?? resetGame(roomId);
	return localState;
}


/**
 * Paddle speed is 10px for the y axis
 */
export function moveUp(side: "left" | "right", roomId?: string): GameState
{
	const state = getGameState(roomId);
	state.paddles[side].y = Math.max(0, state.paddles[side].y - PADDLE_SPEED);
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;
	return state;
}

export function moveDown(side: "left" | "right", roomId?: string): GameState
{
	const state = getGameState(roomId);
	state.paddles[side].y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.paddles[side].y + PADDLE_SPEED);
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;
	return state;
}

function handlePaddleCollision(ball: Ball, paddle: Paddle, side: 'left' | 'right') {
	const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
	const impactPoint = ball.y - paddleCenter;
	const normalizedImpact = impactPoint / (PADDLE_HEIGHT / 2);
	const bounceAngle = normalizedImpact * (Math.PI / 4); // Max bounce angle: 45 degrees

	const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
	
	ball.dx = speed * Math.cos(bounceAngle);
	if (side === 'right')
	{
		ball.dx = -ball.dx;
	}
	
	ball.dy = speed * Math.sin(bounceAngle);

	// Prevent ball from getting stuck inside paddle
	if (side === 'left')
	{
		ball.x = PADDLE_OFFSET_X + PADDLE_WIDTH + BALL_RADIUS;
	}
	else
	{
		ball.x = CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH - BALL_RADIUS;
	}
}

export function updateGame(roomId?: string): GameState
{
	const state = getGameState(roomId);
	if (state.gameEnded) return state;

	const ball = state.ball;
	ball.x += ball.dx;
	ball.y += ball.dy;

	// Vertical wall collision using ball radius and clamp to bounds
	if (ball.y - BALL_RADIUS <= 0)
	{
		ball.y = BALL_RADIUS;
		ball.dy *= -1;
	}
	else if (ball.y + BALL_RADIUS >= CANVAS_HEIGHT)
	{
		ball.y = CANVAS_HEIGHT - BALL_RADIUS;
		ball.dy *= -1;
	}

	// Paddle collision logic
	const paddles = [
		{ side: "left" as const, paddle: state.paddles.left },
		{ side: "right" as const, paddle: state.paddles.right }
	];

	for (const { side, paddle } of paddles) {
		const paddleX = (side === 'left') ? PADDLE_OFFSET_X : CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH;
		const paddleY = paddle.y;

		// Broad phase collision check
		if (ball.x + BALL_RADIUS > paddleX && ball.x - BALL_RADIUS < paddleX + PADDLE_WIDTH &&
			ball.y + BALL_RADIUS > paddleY && ball.y - BALL_RADIUS < paddleY + PADDLE_HEIGHT)
			{
			// Narrow phase collision check
			const isFrontCollision = (side === 'left' && ball.dx < 0) || (side === 'right' && ball.dx > 0);

			if (isFrontCollision)
			{
				// Check if the collision is primarily horizontal (front face)
				const paddleCenterY = paddleY + PADDLE_HEIGHT / 2;
				const distY = Math.abs(ball.y - paddleCenterY);
				
				// Simple check: if ball is not near the top/bottom edges, treat as front collision
				if (distY < PADDLE_HEIGHT / 2)
				{
					handlePaddleCollision(ball, paddle, side);
				}
				else
				{
					// It's a corner/edge case, treat as vertical collision
					ball.dy *= -1;
				}
			}
			else
			{
				// If not moving towards paddle front, must be a top/bottom collision
				ball.dy *= -1;
				// prevent sticking
				if (ball.y < paddleY)
				{
					ball.y = paddleY - BALL_RADIUS;
				} 
				else
				{
					ball.y = paddleY + PADDLE_HEIGHT + BALL_RADIUS;
				}
			}
		}
	}

	// Point for the right player
	if (ball.x < 0)
	{
		state.scores.right++;
		resetBall(state, "left", roomId);
  	}

	// Point for the left player
  	if (ball.x > CANVAS_WIDTH)
	{
		state.scores.left++;
		resetBall(state, "right", roomId);
	}

	if (state.scores.left >= WINNING_SCORE || state.scores.right >= WINNING_SCORE)
	{
		state.gameEnded = true;
		state.ball.dx = 0;
		state.ball.dy = 0;
	}

	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;

	return state;
}

function resetBall(state: GameState, serveTo: "left" | "right", roomId?: string)
{
	state.ball.x = 400;
	state.ball.y = 300;
  
	state.ball.dx = 0;
	state.ball.dy = 0;

	(state.ball as any).serveDirection = serveTo;

	// Clear any pending serve timer for this room to avoid multiple timers
	const key = roomId ?? 'local';
	const existing = serveTimers.get(key);
	if (existing)
	{
		clearTimeout(existing);
		serveTimers.delete(key);
	}

	if (!state.gameEnded)
	{
		const t = setTimeout(() => {
			serveTimers.delete(key);
			startBallMovement(roomId);
		}, 1000); // 1 second delay
		serveTimers.set(key, t);
	}
}


/**
 * Starts the ball movement if it's stationary
 * The ball speed is 5px for both x and y
 */
export function startBallMovement(roomId?: string)
{
	const state = getGameState(roomId);
	if (state.ball.dx === 0 && state.ball.dy === 0)
	{
		const serveDirection = (state.ball as any).serveDirection || (Math.random() > 0.5 ? "left" : "right");

		state.ball.dx = serveDirection === "left" ? -BALL_SPEED_X : BALL_SPEED_X;
		// Ensure dy respects ball radius and is not zero
		state.ball.dy = (Math.random() > 0.5 ? BALL_SPEED_Y : -BALL_SPEED_Y) || BALL_SPEED_Y;

		delete (state.ball as any).serveDirection; // cleaning
  	}
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
  	else localState = state;
}