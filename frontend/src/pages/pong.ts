/**
 * @file pong.ts
 * @brief Frontend logic for Pong game supporting Local or Online mode
 */
import { io, Socket } from "socket.io-client";

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" | "spectator" | "local" = "spectator";

const apiHost = `http://${window.location.hostname}:8080`;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET_X = 30;
const BALL_RADIUS = 10;
const WINNING_SCORE = 10;

// Flags y settings
let MULTIPLAYER_MODE = false;
let roomId = "local";
const keysPressed = new Set<string>();

interface Paddle { y: number; }
interface Ball { x: number; y: number; }
interface Scores { left: number; right: number; }

interface GameState {
	paddles: { left: Paddle; right: Paddle; };
	ball: Ball;
	scores: Scores;
	gameEnded: boolean;
}

let gameState: GameState = {
	paddles: { left: { y: 250 }, right: { y: 250 } },
	ball: { x: 400, y: 300 },
	scores: { left: 0, right: 0 },
	gameEnded: false,
};

/**
 * html fgor the router
 */
export function pongPage(): string {
  return `
    <div class="pong-container">
      <h1>Pong Game</h1>
      <div id="modeSelection">
        <button id="localBtn" class="pong-button">Play Local</button>
        <button id="onlineBtn" class="pong-button">Play Online</button>
      </div>
      <div id="roleInfo"></div>
      <div id="scoreboard" class="scoreboard">0 : 0</div>
      <canvas id="pongCanvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" style="display:none;"></canvas>
      <div id="gameInfo" class="game-info" style="display:none;">
        <p id="controlsInfo"></p>
        <p>Press 'P' to Pause/Resume</p>
        <p id="winnerMessage" class="winner-message" style="display: none;"></p>
        <button id="startGameBtn" class="pong-button" style="display: none;">Start Game</button>
        <button id="playAgainBtn" class="pong-button" style="display: none;">Play Again</button>
      </div>
    </div>
  `;
}

/**
 * cleanup to avoid any hanging sockets
 */
function cleanup()
{
	if (socket) socket.disconnect();
	if (animationFrameId) cancelAnimationFrame(animationFrameId);
	window.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("keyup", handleKeyUp);
	isGameRunning = false;
}

/**
 * Keyboard keys handlers
 */
const handleKeyDown = (e: KeyboardEvent) =>
{
	if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
	if (e.key.toLowerCase() === "p") {
        fetch(`${apiHost}/game/${roomId}/toggle-pause`, { method: "POST" });
	}
	else
	{
		keysPressed.add(e.key);
	}
};

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

/**
 * Main function for game loop
 */
function gameLoop()
{
	if (socket && isGameRunning)
	{
		if (!MULTIPLAYER_MODE)
		{
			if (keysPressed.has("w")) socket.emit("moveUp", "left", "local");
			if (keysPressed.has("s")) socket.emit("moveDown", "left", "local");
			if (keysPressed.has("ArrowUp")) socket.emit("moveUp", "right", "local");
			if (keysPressed.has("ArrowDown")) socket.emit("moveDown", "right", "local");
		}
		else
		{
			if (playerRole === "left" || playerRole == "right")
			{
				if (keysPressed.has("w") || keysPressed.has("ArrowUp"))
					socket.emit("moveUp", playerRole, roomId);
				if (keysPressed.has("s") || keysPressed.has("ArrowDown"))
					socket.emit("moveDown", playerRole, roomId);
			}
		}
	}
	animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Main export handle for the router
 */
export function pongHandlers()
{
	cleanup(); // Clean any prevbious state
	
	ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
	
	document.getElementById("localBtn")!.addEventListener("click", () =>
	{
		MULTIPLAYER_MODE = false;
		roomId = "local";
		playerRole = "local";
		prepareGameUI();
		startGame();
	});

	document.getElementById("onlineBtn")!.addEventListener("click", () =>
	{
		MULTIPLAYER_MODE = true;
		prepareGameUI();
		startGame();
	});

	document.getElementById("startGameBtn")!.addEventListener("click", () =>
	{
        fetch(`${apiHost}/game/${roomId}/resume`, { method: "POST" });
		(document.getElementById("startGameBtn")!).style.display = "none";
		isGameRunning = true;
	});

	document.getElementById("playAgainBtn")!.addEventListener("click", () =>
	{
		document.getElementById("winnerMessage")!.style.display = "none";
		document.getElementById("playAgainBtn")!.style.display = "none";
        fetch(`${apiHost}/game/${roomId}/init`, { method: "POST" }).then(() =>
		{
			(document.getElementById("startGameBtn")!).style.display = "block";
		});
		isGameRunning = false;
	});
}

/**
 * Prepares the UI for the game
 */
function prepareGameUI()
{
	(document.getElementById("modeSelection")!).style.display = "none";
	(document.getElementById("pongCanvas")!).style.display = "block";
	(document.getElementById("gameInfo")!).style.display = "flex";
}

/**
 * Function to initiate the game
 */
function startGame()
{
    const wsHost = `ws://${window.location.hostname}:3000`;
    socket = io(wsHost);

	const initGame = (currentRoomId: string) =>
	{
        fetch(`${apiHost}/game/${currentRoomId}/init`, { method: "POST" });
		isGameRunning = false;
	};

	if (MULTIPLAYER_MODE)
	{
		document.getElementById("roleInfo")!.textContent = "Waiting for an opponent...";
		socket.emit("joinRoom");

		socket.on("roomJoined", ({ roomId: newRoomId, role }: { roomId: string, role: string }) =>
		{
			roomId = newRoomId;
			playerRole = role as "left" | "right" | "spectator";
		
			const roleInfo = document.getElementById("roleInfo")!;
			roleInfo.textContent = `You are: ${role} in room ${roomId}. Waiting for opponent...`;

			const controlsInfo = document.getElementById("controlsInfo")!;
			if (role === "left") controlsInfo.textContent = "Controls: W/S";
			else if (role === "right") controlsInfo.textContent = "Controls: ↑/↓";
			else controlsInfo.textContent = "Spectator (no controls)";
		});

		// To confirm both players
		socket.on("gameReady", ({ roomId }: { roomId: string }) =>
		{
			document.getElementById("roleInfo")!.textContent = `You are ${playerRole} in room ${roomId}. Opponent found!`;
			initGame(roomId);
			// Shows the start button
			(document.getElementById("startGameBtn")!).style.display = "block";
		});
	}
	else
	{
		document.getElementById("roleInfo")!.textContent = "Local mode: Two players, one keyboard";
		document.getElementById("controlsInfo")!.textContent = "W/S for Left, ArrowUp/Down for Right";
		initGame("local");
		(document.getElementById("startGameBtn")!).style.display = "block";
	}

	socket.on("gameState", (state: GameState) =>
	{
		gameState = state;
		draw();
		if (state.gameEnded)
		{
			checkWinner();
		}
	});

	socket.on("gamePaused", ({ paused }: { paused: boolean }) =>
	{
		isGameRunning = !paused;
	});

	socket.on("opponentDisconnected", () =>
	{
		if (MULTIPLAYER_MODE)
		{
			const winnerMsg = document.getElementById("winnerMessage")!;
			winnerMsg.textContent = "Opponent disconnected. You win!";
			winnerMsg.style.display = "block";
			endGame();
		}
	});

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);

	gameLoop();
}

/**
 * Checks if there if there is a winner
 */
function checkWinner()
{
	if (!gameState.gameEnded || !isGameRunning) return;

	const winnerMsg = document.getElementById("winnerMessage")!;
	if (gameState.scores.left >= WINNING_SCORE)
	{
		winnerMsg.textContent = "Player 1 Wins!";
	}
	else if (gameState.scores.right >= WINNING_SCORE)
	{
		winnerMsg.textContent = "Player 2 Wins!";
	}
	winnerMsg.style.display = "block";
	endGame();
}

function endGame()
{
	isGameRunning = false;
	document.getElementById("playAgainBtn")!.style.display = "block";
	(document.getElementById("startGameBtn")!).style.display = "none";
}

/**
 * All the canva drawing of the game
 */
function draw()
{
	if (!ctx) return;

	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	ctx.strokeStyle = "#FFF";
	ctx.setLineDash([10, 5]);
	ctx.beginPath();
	ctx.moveTo(CANVAS_WIDTH / 2, 0);
	ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
	ctx.stroke();
	ctx.setLineDash([]);

	ctx.fillStyle = "#FFF";
	ctx.fillRect(PADDLE_OFFSET_X, gameState.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, gameState.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);

	if (!gameState.gameEnded)
	{
		ctx.beginPath();
		ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
		ctx.fill();
	}

	document.getElementById("scoreboard")!.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
}