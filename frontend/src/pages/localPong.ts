/**
 * @file localPong.ts
 * @brief Frontend logic for Local Pong game (1v1 and 1vAI)
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken } from "../state/authState";

let socket: Socket | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let endGameTimeoutId: number | undefined;
let isGameRunning = false;
// Unique room id for multiple concurrent local games
function simpleUUID() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 10)
    );
}
const roomId = `local_${simpleUUID()}`;

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
        <div id="scoreboard" class="scoreboard hidden">0 : 0</div>
      </div>

      <p id="winnerMessage" class="winner-message" style="display: none;"></p>
      <div id="errorMessage" class="error-message" style="display: none; color: red; text-align: center;"></div>

      <div id="gameInfo" class="game-info" style="display:none;">
        <div class="controls left-controls">
          <p>Left Player: W / S</p>
        </div>

        <canvas id="pongCanvas" width="800" height="600"></canvas>

        <div class="controls right-controls">
          <p>Right Player: ↑ / ↓</p>
        </div>
      </div>

      <div id="extraInfo" class="extra-info hidden">
        <p>Press 'P' to Pause/Resume</p>
      </div>
    </div>
  `;
}

function cleanup() {
    console.log("[LocalPong] Cleaning up previous game...");
    if (endGameTimeoutId) {
        clearTimeout(endGameTimeoutId);
        endGameTimeoutId = undefined;
    }
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    isGameRunning = false;
    keysPressed.clear();
    ctx = null;
    // Oculta el mensaje de victoria y error inmediatamente
    const winnerMsg = document.getElementById("winnerMessage");
    if (winnerMsg) winnerMsg.style.display = "none";
    const errorMsg = document.getElementById("errorMessage");
    if (errorMsg) errorMsg.style.display = "none";
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

    if (e.key.toLowerCase() === "p")
    {
        togglePause();
        return;
    }

    keysPressed.add(e.key);
};

function togglePause() {
    postGame(`/game/${roomId}/toggle-pause`);
}

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop(isAiMode: boolean) {
    if (isGameRunning && socket) {
        if (keysPressed.has("w")) socket.emit("moveUp", "left", roomId);
        if (keysPressed.has("s")) socket.emit("moveDown", "left", roomId);

        if (!isAiMode) {
            if (keysPressed.has("ArrowUp")) socket.emit("moveUp", "right", roomId);
            if (keysPressed.has("ArrowDown")) socket.emit("moveDown", "right", roomId);
        }
    }
    animationFrameId = requestAnimationFrame(() => gameLoop(isAiMode));
}

export function localPongHandlers() {
    document.getElementById("1v1Btn")!.addEventListener("click", () => {
        prepareGameUI(false);
        startGame(false);
    });

    document.getElementById("1vAIBtn")!.addEventListener("click", () => {
        prepareGameUI(true);
        startGame(true);
    });

    // Initial cleanup in case of hot-reloading or re-navigation
    cleanup();
}

function prepareGameUI(isAiMode: boolean) {
    (document.getElementById("winnerMessage")!).style.display = "none";
    (document.getElementById("modeSelection")!).style.display = "none";
    (document.getElementById("gameInfo")!).style.display = "flex";
    (document.getElementById("scoreboard")!).classList.remove("hidden");
    (document.getElementById("extraInfo")!).classList.remove("hidden");

    if (isAiMode) {
        (document.querySelector(".right-controls p") as HTMLElement).textContent = "Right Player: AI";
        document.getElementById("roleInfo")!.textContent = "Local mode: Player vs. AI";
    } else {
        (document.querySelector(".right-controls p") as HTMLElement).textContent = "Right Player: ↑ / ↓";
        document.getElementById("roleInfo")!.textContent = "Local mode: Two players, one keyboard";
    }
}

async function startGame(isAiMode: boolean) {
    // Ensure everything is clean before starting
    cleanup();

    // Deshabilita los botones para evitar doble inicio
    const btn1v1 = document.getElementById("1v1Btn") as HTMLButtonElement;
    const btn1vAI = document.getElementById("1vAIBtn") as HTMLButtonElement;
    if (btn1v1) btn1v1.disabled = true;
    if (btn1vAI) btn1vAI.disabled = true;

    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
    const wsHost = `ws://${window.location.hostname}:7000`;
    if (socket) {
        // Si por alguna razón hay un socket anterior, límpialo
        cleanup();
    }
    socket = io(wsHost, { 
        transports: ['websocket'],
        auth: {
            token: "local"
        }
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    socket!.on('connect', async () => {
        console.log(`[LocalPong] Socket connected, joining room '${roomId}'`);
        socket!.emit("joinRoom", { roomId });

        try {
            // Always stop AI first to ensure a clean state
            await postGame(`/game/${roomId}/stop-ai`);

            const initResponse = await postGame(`/game/${roomId}/init`);
            if (!initResponse.ok) {
                throw new Error(`init failed (${initResponse.status})`);
            }

            if (isAiMode) {
                const startAiResponse = await postGame(`/game/${roomId}/start-ai`);
                if (!startAiResponse.ok) {
                    throw new Error(`start-ai failed (${startAiResponse.status})`);
                }
            }
            // The game starts paused by default after init, so we resume it.
            const resumeResponse = await postGame(`/game/${roomId}/resume`);
            if (!resumeResponse.ok) {
                throw new Error(`resume failed (${resumeResponse.status})`);
            }
            isGameRunning = true;
            console.log("[LocalPong] Game started and resumed.");

            // Habilita los botones de nuevo tras iniciar
            if (btn1v1) btn1v1.disabled = false;
            if (btn1vAI) btn1vAI.disabled = false;

            // Start the animation loop
            gameLoop(isAiMode);

        } catch (error: any) {
            console.error("[LocalPong] Failed to start game:", error);
            const errorMsg = document.getElementById("errorMessage");
            if (errorMsg) {
                errorMsg.textContent = error?.message || "Error al iniciar la partida";
                errorMsg.style.display = "block";
            }
            // Habilita los botones para reintentar
            if (btn1v1) btn1v1.disabled = false;
            if (btn1vAI) btn1vAI.disabled = false;
        }
    });

    socket!.on("gameState", (state: GameState) => {
        gameState = state;
        draw();
        if (state.gameEnded) {
            checkWinner();
        }
    });

    socket!.on('roomFull', (payload: { roomId: string }) => {
        const errorMsg = document.getElementById("errorMessage");
        if (errorMsg) {
            errorMsg.textContent = 'La sala local está llena. Intenta más tarde o usa el modo remoto.';
            errorMsg.style.display = "block";
        }
        console.warn('Attempted to join full local room', payload);
        cleanup();
    });

    socket!.on('roomNotFound', (payload: { roomId: string }) => {
        const errorMsg = document.getElementById("errorMessage");
        if (errorMsg) {
            errorMsg.textContent = 'La sala de juego ya no existe o ha sido eliminada. Se reiniciará la partida.';
            errorMsg.style.display = "block";
        }
        cleanup();
        setTimeout(() => window.location.reload(), 2000);
    });

    socket!.on("disconnect", (reason: string) => {
        console.log("[LocalPong] Socket disconnected.", reason);
        isGameRunning = false;
        const errorMsg = document.getElementById("errorMessage");
        if (errorMsg) {
            errorMsg.textContent = 'Conexión perdida con el servidor. La partida se reiniciará.';
            errorMsg.style.display = "block";
        }
        cleanup();
        setTimeout(() => window.location.reload(), 2000);
    });

    // Manejo de reconexión automática: reinicia la UI si socket.io reconecta
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            if (socket) {
                socket.on('reconnect', () => {
                    const errorMsg = document.getElementById("errorMessage");
                    if (errorMsg) {
                        errorMsg.textContent = 'Reconectando con el servidor. La partida se reiniciará.';
                        errorMsg.style.display = "block";
                    }
                    cleanup();
                    setTimeout(() => window.location.reload(), 2000);
                });
            }
        });
    }
}

function checkWinner() {
    if (!gameState.gameEnded) return;

    const winnerMsg = document.getElementById("winnerMessage")!;
    const isAiMode = (document.querySelector(".right-controls p") as HTMLElement).textContent === "Right Player: AI";

    if (gameState.scores.left >= WINNING_SCORE) {
        winnerMsg.textContent = "Player 1 Wins!";
    } else if (gameState.scores.right >= WINNING_SCORE) {
        winnerMsg.textContent = isAiMode ? "AI Wins!" : "Player 2 Wins!";
    }
    winnerMsg.style.display = "block";
    endGame();
}

function endGame() {
    isGameRunning = false;
    cancelAnimationFrame(animationFrameId);

    endGameTimeoutId = window.setTimeout(() => {
        // Don't call cleanup() here, as it will interfere with a new game
        // if started within the 5-second window.
        // cleanup() is called at the beginning of startGame().
        
        // Reset UI to initial state
        (document.getElementById("modeSelection")!).style.display = "flex";
        (document.getElementById("gameInfo")!).style.display = "none";
        (document.getElementById("winnerMessage")!).style.display = "none";
        (document.getElementById("scoreboard")!).classList.add("hidden");
        (document.getElementById("extraInfo")!).classList.add("hidden");
        (document.getElementById("roleInfo")!).textContent = "";
    }, 5000);
}

function draw() {
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Línea central
    ctx.strokeStyle = "#FFF";
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pala izquierda
    ctx.shadowColor = "#42F3FA";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#42F3FA";
    ctx.fillRect(PADDLE_OFFSET_X, gameState.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Pala derecha
    ctx.shadowColor = "#FE92FD";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#FE92FD";
    ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, gameState.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    ctx.shadowBlur = 0;
    
    // Bola
    if (!gameState.gameEnded) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Puntuación
    ctx.shadowBlur = 0;
    const scoreboard = document.getElementById("scoreboard");
    if (scoreboard) {
        scoreboard.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
    }
}