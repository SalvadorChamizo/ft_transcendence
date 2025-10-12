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
}