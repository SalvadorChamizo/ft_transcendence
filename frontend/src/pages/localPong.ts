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
let aiStarted = false;
let handleVisibility: () => void = () => {};
let beforeUnloadHandler: () => void = () => {};
// Unique room id for multiple concurrent local games
function simpleUUID() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 10)
    );
}

async function startLocalCountdownAndStart(roomToStart: string, isAiMode: boolean, btn1v1?: HTMLButtonElement | null, btn1vAI?: HTMLButtonElement | null) {
    const countdownEl = document.getElementById('countdown')!;
    countdownEl.classList.remove('hidden');
    let counter = 3;
    countdownEl.textContent = String(counter);
    await new Promise<void>((resolve) => {
        const iv = setInterval(() => {
            counter -= 1;
            if (counter === 0) {
                clearInterval(iv);
                countdownEl.classList.add('hidden');
                resolve();
            } else {
                countdownEl.textContent = String(counter);
            }
        }, 1000);
    });

    // resume and start
    const resumeResponse = await postGame(`/game/${roomToStart}/resume`);
    if (!resumeResponse.ok) throw new Error(`resume failed (${resumeResponse.status})`);
    isGameRunning = true;
    console.log("[LocalPong] Game started and resumed after countdown.");

    // Re-enable buttons after starting
    if (btn1v1) btn1v1.disabled = false;
    if (btn1vAI) btn1vAI.disabled = false;

    // Start the animation loop
    gameLoop(isAiMode);
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
    PADDLE_SPEED,
    BALL_SPEED_X,
    BALL_SPEED_Y,
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
    winningScore?: number;
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
                                <div class="speed-controls">
                                        <label>Difficulty:
                                            <select id="difficultySelect">
                                                <option value="">Default</option>
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </label>
                                        <label>Game Length:
                                            <select id="gameLengthSelect">
                                                <option value="">Default</option>
                                                <option value="short">Short (5)</option>
                                                <option value="long">Long (10)</option>
                                            </select>
                                        </label>
                                </div>
                <button id="1v1Btn" class="pong-button">1 vs 1</button>
                <button id="1vAIBtn" class="pong-button">1 vs AI</button>
            </div>
      <div id="roleInfo"></div>
      <div class="scoreboard-container">
            <div id="scoreboard" class="scoreboard hidden">0 : 0</div>
      </div>

      <p id="winnerMessage" class="winner-message" style="display: none;"></p>
      <div id="errorMessage" class="error-message" style="display: none; color: red; text-align: center;"></div>

      <div id="gameInfo" class="game-info" style="display:none;">
        <div class="controls left-controls">
          <p>Left Player: W / S</p>
        </div>

    <canvas id="pongCanvas" width="800" height="600"></canvas>
    <div id="countdown" class="countdown hidden"></div>

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
    // Ensure powerup is disabled when cleaning up a local room
    try {
        postGame(`/game/${roomId}/powerup?enabled=false`).catch(() => {});
    } catch (e) {
        /* ignore */
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('beforeunload', beforeUnloadHandler as EventListener);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    isGameRunning = false;
    aiStarted = false;
    keysPressed.clear();
    ctx = null;
    // Hide winner and error messages immediately
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

// POST JSON body helper
async function postGameJson(path: string, data: any): Promise<Response> {
    const token = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${apiHost}${path}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return fetch(`${apiHost}${path}`, { method: 'POST', headers, body: JSON.stringify(data) });
        }
    }
    return res;
}

async function applySpeedsToRoom(roomIdToSet: string) {
    const difficulty = (document.getElementById('difficultySelect') as HTMLSelectElement)?.value;
    const gameLength = (document.getElementById('gameLengthSelect') as HTMLSelectElement)?.value;
    const body: any = {};
    if (difficulty && difficulty.trim() !== '') body.difficulty = difficulty;
    if (gameLength && gameLength.trim() !== '') body.gameLength = gameLength;
    // Only post if body has at least one property
    if (Object.keys(body).length === 0) return;
    try {
        await postGameJson(`/game/${roomIdToSet}/speeds`, body);
    } catch (e) {
        console.warn('Failed to set speeds for room', roomIdToSet, e);
    }
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

    // Disable buttons to prevent double start
    const btn1v1 = document.getElementById("1v1Btn") as HTMLButtonElement;
    const btn1vAI = document.getElementById("1vAIBtn") as HTMLButtonElement;
    if (btn1v1) btn1v1.disabled = true;
    if (btn1vAI) btn1vAI.disabled = true;

    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;
    if (socket) {
        // If there’s a previous socket, clean it up
        cleanup();
    }
    socket = io(apiHost, { 
        path: "/socket.io",
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
            // (no AI start/stop here for local UI behavior)
            const initResponse = await postGame(`/game/${roomId}/init`);
            if (!initResponse.ok) {
                throw new Error(`init failed (${initResponse.status})`);
            }
            // Apply any custom speeds from UI after init (init resets state)
            await applySpeedsToRoom(roomId);

            // Enable powerup for this local room (speed increases on paddle hit)
            try {
                await postGame(`/game/${roomId}/powerup?enabled=true`);
            } catch (e) {
                console.warn('[LocalPong] Failed to enable powerup for room', roomId, e);
            }

            // The game starts paused by default after init. Use a 3-2-1 countdown then resume.
            import("../utils/countdown").then(mod => {
                mod.runCountdown('countdown', 3).then(async () => {
                    const resumeResponse = await postGame(`/game/${roomId}/resume`);
                    if (!resumeResponse.ok) throw new Error(`resume failed (${resumeResponse.status})`);
                    isGameRunning = true;
                    console.log("[LocalPong] Game started and resumed after countdown.");

                    // Pause on tab visibility change (do not auto-resume)
                    handleVisibility = () => {
                        if (document.hidden) {
                            if (isGameRunning) {
                                // Pause locally and inform server
                                postGame(`/game/${roomId}/pause`).catch(() => {});
                            }
                        }
                    };
                    document.addEventListener('visibilitychange', handleVisibility);

                    // Ensure we disable powerup when leaving the page and disconnect cleanly
                    beforeUnloadHandler = () => {
                        try {
                            if (aiStarted) {
                                navigator.sendBeacon(`${apiHost}/game/${roomId}/stop-ai`);
                            }
                            navigator.sendBeacon(`${apiHost}/game/${roomId}/powerup?enabled=false`);
                        } catch (e) {}
                        if (socket) socket.disconnect();
                    };
                    window.addEventListener('beforeunload', beforeUnloadHandler);

                    // If playing vs AI, request the backend to start the AI opponent
                    if (isAiMode) {
                        try {
                            const startAiResponse = await postGame(`/game/${roomId}/start-ai`);
                            if (startAiResponse.ok) {
                                aiStarted = true;
                            } else {
                                console.warn(`[LocalPong] start-ai failed (${startAiResponse.status})`);
                            }
                        } catch (e) {
                            console.warn('[LocalPong] Failed to start AI for room', roomId, e);
                        }
                    }

                    // Habilita los botones de nuevo tras iniciar
                    if (btn1v1) btn1v1.disabled = false;
                    if (btn1vAI) btn1vAI.disabled = false;

                    // Start the animation loop
                    gameLoop(isAiMode);
                });
            });

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
            errorMsg.textContent = 'The local room is full. Try again later or use remote mode.';
            errorMsg.style.display = "block";
        }
        console.warn('Attempted to join full local room', payload);
        cleanup();
    });

    socket!.on('roomNotFound', (payload: { roomId: string }) => {
        const errorMsg = document.getElementById("errorMessage");
        if (errorMsg) {
            errorMsg.textContent = 'The game room no longer exists or has been deleted. The match will restart.';
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
            errorMsg.textContent = 'Connection lost to the server. The match will restart.';
            errorMsg.style.display = "block";
        }
        cleanup();
        setTimeout(() => window.location.reload(), 2000);
    });

    // Auto-reconnection handling: reset UI if socket.io reconnects
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            if (socket) {
                socket.on('reconnect', () => {
                    const errorMsg = document.getElementById("errorMessage");
                    if (errorMsg) {
                        errorMsg.textContent = 'Reconnecting to the server. The match will restart.';
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

    const winning = gameState.winningScore ?? WINNING_SCORE;
    if (gameState.scores.left >= winning) {
        winnerMsg.textContent = "Player 1 Wins!";
    } else if (gameState.scores.right >= winning) {
        winnerMsg.textContent = isAiMode ? "AI Wins!" : "Player 2 Wins!";
    }
    winnerMsg.style.display = "block";
    endGame();
}

function endGame() {
    isGameRunning = false;
    cancelAnimationFrame(animationFrameId);

    endGameTimeoutId = window.setTimeout(() => {
        // On match end, clean up and leave the room, then reload to return to lobby
        cleanup();
        try { window.location.reload(); } catch (e) { /* ignore */ }
    }, 5000);
}

function draw() {
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center line
    ctx.strokeStyle = "#FFF";
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Left paddle
    ctx.shadowColor = "#42F3FA";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#42F3FA";
    ctx.fillRect(PADDLE_OFFSET_X, gameState.paddles.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Right paddle
    ctx.shadowColor = "#FE92FD";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#FE92FD";
    ctx.fillRect(CANVAS_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, gameState.paddles.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    ctx.shadowBlur = 0;
    
    // Ball
    if (!gameState.gameEnded) {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Score
    ctx.shadowBlur = 0;
    const scoreboard = document.getElementById("scoreboard");
    if (scoreboard) {
        scoreboard.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
    }
}