/**
 * @file gameServices.ts
 * @brief Core game logic for Pong (supports Local + Online rooms)
 */

export interface Paddle { y: number; }
export interface Ball { x: number; y: number; dx: number; dy: number; }
export interface Scores { left: number; right: number; }

export interface GameState {
	paddles: { left: Paddle; right: Paddle };
	ball: Ball;
	scores: Scores;
	gameEnded: boolean;
}

const WINNING_SCORE = 10;

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

export function getGameState(roomId?: string): GameState
{
	if (roomId && roomId !== "local") return roomStates.get(roomId) ?? resetGame(roomId);
	return localState;
}

export function moveUp(side: "left" | "right", roomId?: string): GameState
{
	const state = getGameState(roomId);
	state.paddles[side].y = Math.max(0, state.paddles[side].y - 10);
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;
	return state;
}

export function moveDown(side: "left" | "right", roomId?: string): GameState
{
	const state = getGameState(roomId);
	state.paddles[side].y = Math.min(500, state.paddles[side].y + 10);
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
	else localState = state;
	return state;
}

export function updateGame(roomId?: string): GameState
{
	const state = getGameState(roomId);
	if (state.gameEnded) return state;

	const ball = state.ball;
	ball.x += ball.dx;
	ball.y += ball.dy;

	if (ball.y <= 0 || ball.y >= 600) ball.dy *= -1;

	// left paddle
	if (ball.x <= 50 && ball.y >= state.paddles.left.y && ball.y <= state.paddles.left.y + 100)
	{
		ball.dx *= -1;
	}
  	
	// right paddle
	if (ball.x >= 750 && ball.y >= state.paddles.right.y && ball.y <= state.paddles.right.y + 100)
	{
		ball.dx *= -1;
	}

	// Point for the right player
	if (ball.x < 0)
	{
		state.scores.right++;
		resetBall(state, "left", roomId);
  	}

	// Point for the left player
  	if (ball.x > 800)
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

	if (!state.gameEnded)
	{
		setTimeout(() => {
	  		startBallMovement(roomId);
		}, 1000); // 1 second delay
  }
}

export function startBallMovement(roomId?: string)
{
	const state = getGameState(roomId);
	if (state.ball.dx === 0 && state.ball.dy === 0)
	{
		const serveDirection = (state.ball as any).serveDirection || (Math.random() > 0.5 ? "left" : "right");
	
		state.ball.dx = serveDirection === "left" ? -5 : 5;
		state.ball.dy = Math.random() > 0.5 ? 5 : -5;
	
		delete (state.ball as any).serveDirection; // cleaning
  	}
	if (roomId && roomId !== "local") roomStates.set(roomId, state);
  	else localState = state;
}