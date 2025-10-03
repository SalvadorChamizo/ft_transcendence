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
	vx: number;
	vy: number;
}

export interface GameState
{
	paddles:
	{
		left: Paddle;
		right: Paddle;
	};
	ball: Ball;
	scores:
	{
		left: number;
		right: number;
	};
}