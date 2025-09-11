/**
 * @file pong.ts
 * @brief Frontend logic for the server-side Pong game page.
 */

import { io } from "socket.io-client";

let socket: any;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number; // To manage the game loop

interface Paddle
{
	y: number;
}

interface Ball
{
	x: number;
	y: number;
}

interface Scores
{
	left: number;
	right: number;
}

interface GameState
{
	paddles:
	{
		left: Paddle;
		right: Paddle;
	};
	ball: Ball;
	scores: Scores;
}

/**
 * @brief Holds the current game state received from the server.
 */
let gameState: GameState =
{
	paddles:
	{
		left: { y: 250 },
		right: { y: 250 },
	},
	ball: { x: 400, y: 300 },
	scores: { left: 0, right: 0 },
};

// A Set to store the state of currently pressed keys for simultaneous movement.
const keysPressed = new Set<string>();

/**
 * @brief The main game loop.
 * Continuously sends movement commands to the server based on pressed keys.
 */
function gameLoop()
{
	if (socket)
	{
		if (keysPressed.has("w")) socket.emit("moveUp", "left");
		if (keysPressed.has("s")) socket.emit("moveDown", "left");
		if (keysPressed.has("ArrowUp")) socket.emit("moveUp", "right");
		if (keysPressed.has("ArrowDown")) socket.emit("moveDown", "right");
	}
	animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * @brief Returns the HTML markup for the Pong game page.
 * @returns {string} HTML string for the Pong page.
 */
export function pongPage()
{
	return `
	
	<h1>Server-Side Pong</h1>
	<canvas style="border: 1px solid red" id="pongCanvas" width="800" height="600"></canvas>
	<p>Use W/S to move Left Paddle, ArrowUp/ArrowDown for Right Paddle</p>
	<p id="scoreboard">0 : 0</p>
	<button id="startGameBtn">Start Game</button>
	
	`;
}

/**
 * @brief Sets up event handlers and socket connection for the Pong game.
 * Connect to Pong backend microservice
 * Init REST call (optional)
 * Listen for full game state updates from the server.
 * Handle paddle movement input from the users.
 * Draws in the canvas
 */
export function pongHandlers()
{
	const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
	ctx = canvas.getContext("2d");

	socket = io("http://localhost:3000");
	fetch("http://localhost:3000/game/init", { method: "POST" });

	// Listen for full game state updates from the server.
	socket.on("gameState", (state: GameState) =>
		{
			gameState = state;
			draw();
		});

	// Stop any previous game loop and clear keys
	cancelAnimationFrame(animationFrameId);
	keysPressed.clear();

	// Handle key down events by adding the key to our state.
	window.addEventListener("keydown", (e) =>
		{
			if (["w", "s", "ArrowUp", "ArrowDown"].includes(e.key))
            {
                e.preventDefault();
            }
            keysPressed.add(e.key);
		});

		// Handle key up events by removing the key from our state.
		window.addEventListener("keyup", (e) =>
		{
			keysPressed.delete(e.key);
		});

		// Event listener for the "Start Game" button.
		const startGameBtn = document.getElementById("startGameBtn");
		if (startGameBtn)
		{
			startGameBtn.addEventListener("click", () =>
			{
				// This sends the request to the server to un-pause the game.
				fetch("http://localhost:3000/game/resume", { method: "POST" });
			});
		}

		draw();
		// Start the input loop
		gameLoop();
}

/**
 * @brief Draws the current game state (paddles, ball, scores) on the canvas.
 * Draws paddles in black
 * Draws ball
 * Update the score display
 */
function draw()
{
	if (!ctx) return;
	ctx.clearRect(0, 0, 800, 600);

	ctx.fillStyle = "black";
	ctx.fillRect(30, gameState.paddles.left.y, 20, 100);
	ctx.fillRect(750, gameState.paddles.right.y, 20, 100);

	ctx.beginPath();
	ctx.arc(gameState.ball.x, gameState.ball.y, 10, 0, Math.PI * 2);
	ctx.fill();

	const scoreboard = document.getElementById("scoreboard");
	if (scoreboard)
	{
		scoreboard.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
	}
}
