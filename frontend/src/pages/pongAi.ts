/**
 * @file pongAi.ts
 * @brief Frontend logic for Pong game vs. an AI opponent.
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken } from "../state/authState";

// COPIADO DE PONG.TS (con pequeñas modificaciones)

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" = "left"; // El jugador siempre es 'left'
let roomId = "";
let aiStarted = false;
let handleVisibility: () => void = () => {};
let beforeUnloadHandler: () => void = () => {};
let clientUsername = "";

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

export function pongAiPage(): string {
  return `
    <div class="pong-container">
      <h1>Pong: Player vs. AI</h1>
      <div id="modeSelection">
        <button id="playAiBtn" class="pong-button">Play vs. AI</button>
      </div>
      <div id="roleInfo"></div>
      <div id="scoreboard" class="scoreboard">0 : 0</div>
      <canvas id="pongCanvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" style="display:none;"></canvas>
      <div id="gameInfo" class="game-info" style="display:none;">
        <p id="controlsInfo">Controls: W/S or ↑/↓</p>
        <p>Press 'P' to Pause/Resume</p>
        <p id="winnerMessage" class="winner-message" style="display: none;"></p>
        <button id="startGameBtn" class="pong-button" style="display: none;">Start Game</button>
        <button id="playAgainBtn" class="pong-button" style="display: none;">Play Again</button>
      </div>
    </div>
  `;
}

function cleanup() {
    if (socket) socket.disconnect();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('beforeunload', beforeUnloadHandler as EventListener);
    isGameRunning = false;
}

// Helper: POST with Authorization header and one retry after token refresh
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
    if (e.key.toLowerCase() === "p") {
        postGame(`/game/${roomId}/toggle-pause`);
        return;
    } else {
        keysPressed.add(e.key);
    }
};

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop() {
    if (socket && isGameRunning) {
        // El jugador siempre controla la pala izquierda
        if (keysPressed.has("w") || keysPressed.has("ArrowUp")) {
            socket.emit("moveUp", "left", roomId);
        }
        if (keysPressed.has("s") || keysPressed.has("ArrowDown")) {
            socket.emit("moveDown", "left", roomId);
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

export function pongAiHandlers() {
    cleanup();
    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
    
    document.getElementById("playAiBtn")!.addEventListener("click", () => {
        prepareGameUI();
        startGameVsAI();
    });

    document.getElementById("startGameBtn")!.addEventListener("click", () => {
        postGame(`/game/${roomId}/resume`);
        (document.getElementById("startGameBtn")!).style.display = "none";
        // Wait for server event to set isGameRunning
    });

    document.getElementById("playAgainBtn")!.addEventListener("click", () => {
        document.getElementById("winnerMessage")!.style.display = "none";
        document.getElementById("playAgainBtn")!.style.display = "none";
        postGame(`/game/${roomId}/init`).then(() => {
            (document.getElementById("startGameBtn")!).style.display = "block";
        });
        isGameRunning = false;
    });
}

function prepareGameUI() {
    (document.getElementById("modeSelection")!).style.display = "none";
    (document.getElementById("pongCanvas")!).style.display = "block";
    (document.getElementById("gameInfo")!).style.display = "flex";
    document.getElementById("roleInfo")!.textContent = "You are Player 1 (Left). Good luck!";
}

function startGameVsAI() {
    const wsHost = `ws://${window.location.hostname}:7000`;
    socket = io(wsHost);
    roomId = "ai-room-" + Math.random().toString(36).substring(2, 8);

    socket.on('connect', () => {
        // Join the dedicated AI room on the Pong server
        // Send username so server can map socket.id -> username
        let username = clientUsername || (document.querySelector('#username') as HTMLElement)?.textContent?.replace('Username: ', '') || '';
        if (!username) {
            // generate a simple guest username
            username = 'guest_' + Math.random().toString(36).substring(2, 8);
            clientUsername = username;
        }
        socket.emit("joinRoom", { roomId, username });

    // Do not display username in the UI (we still send it to the server for mapping)

        // Start AI on the backend game controller (guard against double start)
        if (!aiStarted) {
            postGame(`/game/${roomId}/start-ai`).then(() => { aiStarted = true; }).catch(() => { aiStarted = false; });
        }
    });

    const initGame = (currentRoomId: string) => {
        postGame(`/game/${currentRoomId}/init`);
        isGameRunning = false;
    };

    // doenst works
    socket.on("gameReady", () => {
        initGame(roomId);
        (document.getElementById("startGameBtn")!).style.display = "block";
    });

    socket.on("gameState", (state: GameState) => {
        gameState = state;
        draw();
        if (state.gameEnded) {
            checkWinner();
        }
        // Always send the latest gameState to the server so the AI can observe
        // the game state even when the game is paused locally.
        try {
            if (socket && socket.connected) {
                socket.emit("clientGameState", { roomId, state });
            }
        } catch (e) {
            // ignore emission errors
        }
    });

    // Pause the game when the tab becomes hidden to avoid timing issues.
    // We only pause on hide and DO NOT auto-resume when visible to avoid race conditions
    let visibilityPaused = false;
    handleVisibility = () => {
        if (document.hidden) {
            if (isGameRunning) {
                visibilityPaused = true;
                // Pause locally and inform server
                postGame(`/game/${roomId}/pause`).catch(() => {});
            }
        } else {
            // Do NOT auto-resume. Leave the resume action to the user (start button)
            // This avoids race conditions and broken websocket/state when returning to tab.
        }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Ensure we stop the AI and disconnect cleanly when leaving the page
    beforeUnloadHandler = () => {
        if (aiStarted) {
            // Best-effort notify server to stop AI
            try {
                navigator.sendBeacon(`${apiHost}/game/${roomId}/stop-ai`);
            } catch (e) {
                // ignore
            }
        }
        if (socket) socket.disconnect();
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

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
        winnerMsg.textContent = "You Win!";
    } else if (gameState.scores.right >= WINNING_SCORE) {
        winnerMsg.textContent = "AI Wins!";
    }
    winnerMsg.style.display = "block";
    endGame();
}

function endGame() {
    isGameRunning = false;
    document.getElementById("playAgainBtn")!.style.display = "block";
    (document.getElementById("startGameBtn")!).style.display = "none";
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
    ctx.fillStyle = "#FFF";
    ctx.fillRect(PADDLE_OFFSET_X, gameState.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, gameState.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    if (!gameState.gameEnded) {
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
    document.getElementById("scoreboard")!.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
}