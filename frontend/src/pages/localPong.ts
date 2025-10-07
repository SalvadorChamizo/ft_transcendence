/**
 * @file localPong.ts
 * @brief Frontend logic for Local Pong game (1v1 and 1vAI)
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../state/authState";

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
const roomId = "local"; // Always local for this mode

const apiHost = `http://${window.location.hostname}:8080`;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET_X = 30;
const BALL_RADIUS = 10;
const WINNING_SCORE = 10;

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
 * HTML for the router
 */
export function localPongPage(): string {
    return `
    <div class="pong-container">
      <h1>Pong - Local Game</h1>
      <div id="modeSelection">
        <button id="1v1Btn" class="pong-button">1 vs 1</button>
        <button id="1vAIBtn" class="pong-button">1 vs AI</button>
      </div>
      <div id="roleInfo"></div>

      <div class="scoreboard-container">
        <button id="startGameBtn" class="pong-button hidden">Start Game</button>
        <div id="scoreboard" class="scoreboard">0 : 0</div>
        <button id="playAgainBtn" class="pong-button hidden">Play Again</button>
      </div>

      <p id="winnerMessage" class="winner-message" style="display: none;"></p>

      <div id="gameInfo" class="game-info" style="display:none;">
        <div class="controls left-controls">
          <p>Left Player: W / S</p>
        </div>

        <canvas id="pongCanvas" width="800" height="600"></canvas>

        <div class="controls right-controls">
          <p>Right Player: ↑ / ↓</p>
        </div>
      </div>

      <div id="extraInfo" class="extra-info">
        <p>Press 'P' to Pause/Resume</p>
      </div>
    </div>
  `;
}

function cleanup() {
    if (socket) socket.disconnect();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    isGameRunning = false;
}

const handleKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
    if (e.key.toLowerCase() === "p") {
        fetch(`${apiHost}/game/${roomId}/toggle-pause`, { method: "POST" });
    } else {
        keysPressed.add(e.key);
    }
};

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop() {
    if (socket && isGameRunning) {
        if (keysPressed.has("w")) socket.emit("moveUp", "left", "local");
        if (keysPressed.has("s")) socket.emit("moveDown", "left", "local");
        if (keysPressed.has("ArrowUp")) socket.emit("moveUp", "right", "local");
        if (keysPressed.has("ArrowDown")) socket.emit("moveDown", "right", "local");
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

export function localPongHandlers() {
    cleanup();
    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
    
    document.getElementById("1v1Btn")!.addEventListener("click", () => {
        prepareGameUI();
        document.getElementById("roleInfo")!.textContent = "Local mode: Two players, one keyboard";
        startGame();
    });

    document.getElementById("1vAIBtn")!.addEventListener("click", () => {
        alert("1 vs AI mode is not implemented yet.");
    });

    document.getElementById("startGameBtn")!.addEventListener("click", () => {
        const token = getAccessToken();
        fetch(`${apiHost}/game/${roomId}/resume`, { 
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        (document.getElementById("startGameBtn")!).classList.add("hidden");
        isGameRunning = true;
    });

    document.getElementById("playAgainBtn")!.addEventListener("click", () => {
        document.getElementById("winnerMessage")!.style.display = "none";
        document.getElementById("playAgainBtn")!.classList.add("hidden");
        const token = getAccessToken();
        fetch(`${apiHost}/game/${roomId}/init`, { 
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }).then(() => {
            (document.getElementById("startGameBtn")!).classList.remove("hidden");
        });
        isGameRunning = false;
    });
}

function prepareGameUI() {
    (document.getElementById("modeSelection")!).style.display = "none";
    (document.getElementById("pongCanvas")!).style.display = "block";
    (document.getElementById("gameInfo")!).style.display = "flex";
}

function startGame() {
    const wsHost = `ws://${window.location.hostname}:7000`;
    socket = io(wsHost);

    const token = getAccessToken();
    fetch(`${apiHost}/game/${roomId}/init`, { 
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    isGameRunning = false;
    (document.getElementById("startGameBtn")!).classList.remove("hidden");;

    socket.on("gameState", (state: GameState) => {
        gameState = state;
        draw();
        if (state.gameEnded) {
            checkWinner();
        }
    });

    socket.on("gamePaused", ({ paused }: { paused: boolean }) => {
        isGameRunning = !paused;
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    gameLoop();
}

function checkWinner() {
    if (!gameState.gameEnded || !isGameRunning) return;

    const winnerMsg = document.getElementById("winnerMessage")!;
    if (gameState.scores.left >= WINNING_SCORE) {
        winnerMsg.textContent = "Player 1 Wins!";
    } else if (gameState.scores.right >= WINNING_SCORE) {
        winnerMsg.textContent = "Player 2 Wins!";
    }
    winnerMsg.style.display = "block";
    endGame();
}

function endGame() {
    isGameRunning = false;
    document.getElementById("playAgainBtn")!.classList.remove("hidden");;
    (document.getElementById("startGameBtn")!).classList.add("hidden");;
}

function draw() {
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

    ctx.shadowColor = "#42F3FA";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#42F3FA";
    ctx.fillRect(PADDLE_OFFSET_X, gameState.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.shadowColor = "#FE92FD";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#FE92FD";
    ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, gameState.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    ctx.shadowBlur = 0;
    
    if (!gameState.gameEnded) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    document.getElementById("scoreboard")!.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
}