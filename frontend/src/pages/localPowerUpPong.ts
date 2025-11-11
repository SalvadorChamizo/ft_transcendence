/**
 * @file localPowerUpPong.ts
 * @brief Local Pong with Power-up enabled (ball speeds up on paddle hits)
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

    // Re-enable buttons after starting
    if (btn1v1) btn1v1.disabled = false;
    if (btn1vAI) btn1vAI.disabled = false;

    // Start the animation loop
    gameLoop(isAiMode);
}
const roomId = `local_${simpleUUID()}`;

const apiHost = `https://${window.location.hostname}:8443/api`;

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
    lastPowerUpMultiplier?: number;
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
export function localPowerUpPongPage(): string {
    return `
    <div class="pong-container">
      <h1>Pong - Local Power-Up</h1>
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
    // Hide winner and error
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
    const paddleInput = (document.getElementById('paddleSpeedInput') as HTMLInputElement);
    const ballXInput = (document.getElementById('ballSpeedXInput') as HTMLInputElement);
    const ballYInput = (document.getElementById('ballSpeedYInput') as HTMLInputElement);
    const body: any = {};
    if (difficulty && difficulty.trim() !== '') body.difficulty = difficulty;
    if (gameLength && gameLength.trim() !== '') body.gameLength = gameLength;
    if (paddleInput && paddleInput.value.trim() !== '') {
        const n = Number(paddleInput.value);
        if (Number.isFinite(n)) body.paddleSpeed = n;
    }
    if (ballXInput && ballXInput.value.trim() !== '') {
        const n = Number(ballXInput.value);
        if (Number.isFinite(n)) body.ballSpeedX = n;
    }
    if (ballYInput && ballYInput.value.trim() !== '') {
        const n = Number(ballYInput.value);
        if (Number.isFinite(n)) body.ballSpeedY = n;
    }
    // Only post if body has at least one property
    if (Object.keys(body).length === 0) return;
    try {
        await postGameJson(`/game/${roomIdToSet}/speeds`, body);
    } catch (e) {
        console.warn('Failed to set speeds for room', roomIdToSet, e);
    }
}

// (helpers already defined above)

const handleKeyDown = (e: KeyboardEvent) => {
    try {
        if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
    
        if (e.key.toLowerCase() === "p")
        {
            togglePause();
            return;
        }
    
        keysPressed.add(e.key);
    } catch {
        
    }
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

export function localPowerUpPongHandlers() {
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
    const wsHost = apiHost.replace(/\/api\/?$/i, '');
    socket = io(wsHost, {
        path: "/socket.io",
        transports: ['websocket'],
        auth: {
            token: "local"
        }
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    socket!.on('connect', async () => {
        socket!.emit("joinRoom", { roomId });

        try {
            // Always stop AI first to ensure a clean state
            await postGame(`/game/${roomId}/stop-ai`);

            const initResponse = await postGame(`/game/${roomId}/init`);
            if (!initResponse.ok) {
                throw new Error(`init failed (${initResponse.status})`);
            }
            // Apply speeds (if any) after initializing the game for this room (init resets state)
            await applySpeedsToRoom(roomId);

            // Enable powerup for this local room (speed increases on paddle hit)
            try {
                await postGame(`/game/${roomId}/powerup?enabled=true&random=true`);
            } catch (e) {
                console.warn('[LocalPowerUpPong] Failed to enable powerup for room', roomId, e);
            }

            // If playing vs AI, request the backend to start the AI opponent
            if (isAiMode) {
                const startAiResponse = await postGame(`/game/${roomId}/start-ai`);
                if (!startAiResponse.ok) {
                    throw new Error(`start-ai failed (${startAiResponse.status})`);
                }
            }
            // The game starts paused by default after init. Use a 3-2-1 countdown then resume.
            await startLocalCountdownAndStart(roomId, isAiMode, btn1v1, btn1vAI);

        } catch (error: any) {
            console.error("[LocalPowerUpPong] Failed to start game:", error);
            const errorMsg = document.getElementById("errorMessage");
            if (errorMsg) {
                errorMsg.textContent = error?.message || "Error starting the game";
                errorMsg.style.display = "block";
            }
            // Re-enable buttons to retry
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
            errorMsg.textContent = 'The game room no longer exists or has been removed. The game will restart.';
            errorMsg.style.display = "block";
        }
        cleanup();
        setTimeout(() => window.location.reload(), 2000);
    });

    socket!.on("disconnect", (reason: string) => {
        isGameRunning = false;
        const errorMsg = document.getElementById("errorMessage");
        if (errorMsg) {
            errorMsg.textContent = 'Lost connection to the server. The game will restart.';
            errorMsg.style.display = "block";
        }
        cleanup();
        setTimeout(() => window.location.reload(), 2000);
    });

    // Automatic reconnection handling: reset the UI if socket.io reconnects
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            if (socket) {
                socket.on('reconnect', () => {
                    const errorMsg = document.getElementById("errorMessage");
                    if (errorMsg) {
                        errorMsg.textContent = 'Reconnecting to the server. The game will restart.';
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
    const winning = (gameState as any).winningScore ?? WINNING_SCORE;

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

    // Show last power-up multiplier (if present) as a small overlay for debugging/visibility
    if (typeof gameState.lastPowerUpMultiplier === 'number') {
        const m = gameState.lastPowerUpMultiplier;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(8, 8, 160, 28);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`multiplier: ${m.toFixed(2)}`, 16, 28);
        ctx.restore();
    }
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
