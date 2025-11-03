/**
 * @file pong-constants.ts
 * @brief Shared constants for the Pong game.
 */

export const WINNING_SCORE = 5;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const BALL_RADIUS = 10;
export const PADDLE_HEIGHT = 100;
export const PADDLE_SPEED = 6;
export const PADDLE_OFFSET_X = 30;
export const PADDLE_WIDTH = 20;
export const BALL_SPEED_X = 5;
export const BALL_SPEED_Y = 5;
// Power-up settings: when enabled, ball speed multiplies by this factor on every paddle hit
export const POWERUP_SPEED_MULTIPLIER = 1.1;
// When powerup is enabled, choose a random multiplier in this range per-paddle-hit
// Adjusted defaults so random multipliers generally increase speed (>= 1)
export const POWERUP_RANDOM_MIN = 1.05;
export const POWERUP_RANDOM_MAX = 1.4;
