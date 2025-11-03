/**
 * @file types.ts
 * @brief Shared type definitions for the Pong game.
 */

export interface Paddle
{
	y: number;
}

export interface Ball
{
	x: number;
	y: number;
	dx: number;
	dy: number;
}

export interface Scores
{
	left: number;
	right: number;
}

export interface GameState
{
	paddles:
	{
		left: Paddle;
		right: Paddle;
	};
	ball: Ball;
	scores: Scores;
	gameEnded: boolean;
	gameEndedTimestamp?: number; // Add this line
	// Multiplier applied to ball speed on every paddle hit (default 1 = no change)
	powerUpMultiplier?: number;
	// If true, pick a random multiplier per paddle hit within POWERUP_RANDOM_MIN/MAX
	// When false (default) the multiplier is deterministic (POWERUP_SPEED_MULTIPLIER)
	powerUpRandom?: boolean;
	// Optional per-room speed overrides. If undefined, server constants are used.
	paddleSpeed?: number;
	ballSpeedX?: number;
	ballSpeedY?: number;
	// Optional per-room winning score override. If undefined, server default is used.
	winningScore?: number;
	// Last multiplier applied on the most recent paddle collision (for debugging/UI)
	lastPowerUpMultiplier?: number;
}