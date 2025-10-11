/**
 * @file remotePong.ts
 * @brief Frontend logic for Online Pong game (Random and Rooms)
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken } from "../state/authState";

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" | "spectator" = "spectator";
let roomId: string | null = null;

const apiHost = `http://${window.location.hostname}:8080`;

import {
	WINNING_SCORE,
	CANVAS_WIDTH,
	CANVAS_HEIGHT,
	BALL_RADIUS,
	PADDLE_HEIGHT,
	PADDLE_WIDTH,
	PADDLE_OFFSET_X,
} from "../utils/pong-constants";

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
export function remotePongPage(): string {
    return `
    <div class="pong-container">
      <h1>Pong - Remote Game</h1>
      <div id="modeSelection">
        <button id="randomBtn" class="pong-button">Random Matchmaking</button>
        <button id="roomBtn" class="pong-button">Create/Join Room</button>
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

// Helper: POST with Authorization header and retry after refresh on 401
async function postGame(path: string): Promise<Response> {
    const makeReq = async () => {
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(`${apiHost}${path}`, { method: "POST", headers });
    };
    let res = await makeReq();
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await makeReq();
        }
    }
    return res;
}

const handleKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
    if (e.key.toLowerCase() === "p" && roomId) {
        postGame(`/game/${roomId}/toggle-pause`);
    } else {
        keysPressed.add(e.key);
    }
};

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop() {
    if (socket && isGameRunning && roomId && playerRole !== "spectator") {
        if (keysPressed.has("w") || keysPressed.has("ArrowUp"))
            socket.emit("moveUp", playerRole, roomId);
        if (keysPressed.has("s") || keysPressed.has("ArrowDown"))
            socket.emit("moveDown", playerRole, roomId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

export function remotePongHandlers() {
    cleanup();
    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
    
    document.getElementById("randomBtn")!.addEventListener("click", () => {
        prepareGameUI();
        startGame();
    });

    document.getElementById("roomBtn")!.addEventListener("click", () => {
        alert("Create/Join Room is not implemented yet.");
    });

    document.getElementById("startGameBtn")!.addEventListener("click", () => {
        if (!roomId) return;
        postGame(`/game/${roomId}/resume`);
        (document.getElementById("startGameBtn")!).classList.add("hidden");
        // Do NOT set isGameRunning here. Wait for server 'gamePaused' event with paused=false.
    });

    document.getElementById("playAgainBtn")!.addEventListener("click", () => {
        if (!roomId) return;
        document.getElementById("winnerMessage")!.style.display = "none";
        document.getElementById("playAgainBtn")!.classList.add("hidden");
        postGame(`/game/${roomId}/init`).then(() => {
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

    document.getElementById("roleInfo")!.textContent = "Waiting for an opponent...";
    // Wait for the socket to be connected before emitting joinRoom
    socket.on('connect', () => {
        socket.emit("joinRoom");
    });

    socket.on("roomJoined", (data: { roomId: string, role: "left" | "right" }) => {
        roomId = data.roomId;
        // If the server returns no valid role, treat as spectator
        playerRole = (data && (data as any).role) ? (data as any).role : "spectator";

        const roleInfo = document.getElementById("roleInfo")!;
        if (playerRole === 'spectator') {
            roleInfo.textContent = `You are a spectator in room ${roomId}. Waiting for players...`;
            // hide start button for spectators
            (document.getElementById("startGameBtn")!).classList.add("hidden");
        } else {
            roleInfo.textContent = `You are: ${playerRole} in room ${roomId}. Waiting for opponent...`;
        }
    });

    socket.on('roomFull', (payload: { roomId: string }) => {
        alert('Room is full. Try again later.');
        console.warn('Attempted to join full room', payload);
    });

    socket.on("gameReady", (data: { roomId: string }) => {
        document.getElementById("roleInfo")!.textContent = `Room ${data.roomId} is ready. Opponent found!`;
        postGame(`/game/${data.roomId}/init`);
        isGameRunning = false;
        // Only show start button to actual players
        if (playerRole === 'left' || playerRole === 'right') {
            (document.getElementById("startGameBtn")!).classList.remove("hidden");
        } else {
            (document.getElementById("startGameBtn")!).classList.add("hidden");
        }
    });

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

    socket.on("opponentDisconnected", () => {
        const winnerMsg = document.getElementById("winnerMessage")!;
        winnerMsg.textContent = "Opponent disconnected. You win!";
        winnerMsg.style.display = "block";
        endGame();
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    gameLoop();
}

function checkWinner() {
    if (!gameState.gameEnded || !isGameRunning) return;

    const winnerMsg = document.getElementById("winnerMessage")!;
    const winner = gameState.scores.left >= WINNING_SCORE ? "left" : "right";
    winnerMsg.textContent = (playerRole === winner) ? "You Win!" : "You Lose!";
    
    winnerMsg.style.display = "block";
    endGame();
}

function endGame() {
    isGameRunning = false;
    document.getElementById("playAgainBtn")!.classList.remove("hidden");
    (document.getElementById("startGameBtn")!).classList.add("hidden");
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