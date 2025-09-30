/**
 * @file gameServices.ts
 * @brief Core game state and logic for Pong
 */
import { GameState, Paddle } from "../utils/types.ts";


/**
 * Constants
 */
const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 20;
const PADDLE_SPEED = 10;
const BALL_SPEED = 7;
const PADDLE_LEFT_X = 30;
const PADDLE_RIGHT_X = 750;
const WINNING_SCORE = 10;


/**
 * Game State setting
 */
let gameState: GameState = createInitialState();

/**
 * runtime flag to know if the game has ended
 */
export let isGameEnded = false;

/**
 * @returns The current game state.
 */
export function getGameState(): GameState
{
    return gameState;
}

/**
 * @returns {GameState} a initial setting gamestate
 */
export function resetGame(): GameState
{
    isGameEnded = false;
    gameState = createInitialState();
    return gameState;
}

/**
 * Creates a fresh game state object.
 * @returns A new GameState object.
 */
function createInitialState(): GameState
{
    return{
        paddles:
        {
            left: { y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
            right: { y: FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
        },
        ball:
        {
            x: FIELD_WIDTH / 2,
            y: FIELD_HEIGHT / 2,
            vx: 0, // Ball starts stationary
            vy: 0, // Ball starts stationary
        },
        scores:
        {
            left: 0,
            right: 0,
        },
    };
}

/**
 * Starts the ball movement if it's currently stationary.
 * Gives it a random initial direction.
 */
export function startBallMovement()
{
    if (gameState.ball.vx === 0 && gameState.ball.vy === 0)
    {
        // Start ball towards a random direction
        const direction = Math.random() > 0.5 ? 1 : -1;
        gameState.ball.vx = BALL_SPEED * direction;
        gameState.ball.vy = (Math.random() - 0.5) * BALL_SPEED; // Give it a random vertical angle
    }
}

export function moveUp(side: "left" | "right"): GameState
{
    gameState.paddles[side].y = Math.max(0,gameState.paddles[side].y - PADDLE_SPEED);
    return gameState;
}

export function moveDown(side: "left" | "right"): GameState
{
    gameState.paddles[side].y = Math.min(FIELD_HEIGHT - PADDLE_HEIGHT,gameState.paddles[side].y + PADDLE_SPEED);
    return gameState;
}

/**
 * Update ball position, handle collisions & scoring
 */
export function updateGame(): GameState
{
    if (isGameEnded) return gameState;

    const ball = gameState.ball;

    /**
     * Move ball
     */
    ball.x += ball.vx;
    ball.y += ball.vy;

    /**
     * Collitions for top and bottom
     */
    if (ball.y <= 0 || ball.y >= FIELD_HEIGHT)
    {
        ball.vy *= -1;
    }

    /**
     * Paddle collitions
     */
    const leftPaddle = gameState.paddles.left;
    const rightPaddle = gameState.paddles.right;

    // Function to calculate bounce angle based on where the ball hits the paddle
    const calculateBounce = (paddle: Paddle) =>
    {
        const relativeIntersectY = (paddle.y + (PADDLE_HEIGHT / 2)) - ball.y;
        const normalizedRelativeIntersectionY = (relativeIntersectY / (PADDLE_HEIGHT / 2));
        const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4); // Max 45 degrees
        
        const newVx = BALL_SPEED * Math.cos(bounceAngle);
        const newVy = BALL_SPEED * -Math.sin(bounceAngle);

        return { newVx, newVy };
    };

    /**
     * Left Paddle Collision
     */
    if (ball.vx < 0 && ball.x <= PADDLE_LEFT_X + PADDLE_WIDTH && ball.x > PADDLE_LEFT_X && ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + PADDLE_HEIGHT)
    {
        const { newVx, newVy } = calculateBounce(leftPaddle);
        ball.vx = newVx;
        ball.vy = newVy;
        ball.x = PADDLE_LEFT_X + PADDLE_WIDTH + 1; // Prevent sticking
    }

    /**
     * Right Paddle Collision
     */
    if (ball.vx > 0 && ball.x >= PADDLE_RIGHT_X && ball.x < PADDLE_RIGHT_X + PADDLE_WIDTH && ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + PADDLE_HEIGHT)
    {
        const { newVx, newVy } = calculateBounce(rightPaddle);
        ball.vx = -newVx; // Invert horizontal direction
        ball.vy = newVy;
        ball.x = PADDLE_RIGHT_X - 1; // Prevent sticking
    }

    /**
     * Scoring
     */
    if (ball.x < 0)
    {
        gameState.scores.right += 1;
        resetBall(-1); // Ball goes towards left player (who just got a point)
    }
    else if (ball.x > FIELD_WIDTH)
    {
        gameState.scores.left += 1;
        resetBall(1); // Ball goes towards right player (who just got a point)
    }

    if (gameState.scores.left >= WINNING_SCORE || gameState.scores.right >= WINNING_SCORE)
    {
        isGameEnded = true;
    }

    return gameState;
}

/**
 * Helper to reset the ball after a point is scored.
 * @param direction -1 for left, 1 for right. Determines ball's initial horizontal direction.
 */
function resetBall(direction: number)
{
    gameState.ball.x = FIELD_WIDTH / 2;
    gameState.ball.y = FIELD_HEIGHT / 2;
    // The direction parameter makes the ball go towards the player who just lost a point
    gameState.ball.vx = BALL_SPEED * direction;
    gameState.ball.vy = (Math.random() - 0.5) * 2; // Randomize vertical angle
}