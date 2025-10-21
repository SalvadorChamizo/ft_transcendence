import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken } from "../../state/authState";

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
} from "../../utils/pong-constants";

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

export function localTournamentPongPage(): string {
    return `
    <div class="pong-container">
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
        socket.off("gameState");
        socket.off("disconnect");
        socket.off("roomFull");
        socket.off("roomNotFound");
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

function prepareGameUI(isAiMode: boolean) {
    (document.getElementById("winnerMessage")!).style.display = "none";
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

function endGame() {
    isGameRunning = false;
    cancelAnimationFrame(animationFrameId);

    endGameTimeoutId = window.setTimeout(() => {
        // Don't call cleanup() here, as it will interfere with a new game
        // if started within the 5-second window.
        // cleanup() is called at the beginning of startGame().
        
        // Reset UI to initial state
        (document.getElementById("gameInfo")!).style.display = "none";
        (document.getElementById("winnerMessage")!).style.display = "none";
        (document.getElementById("scoreboard")!).classList.add("hidden");
        (document.getElementById("extraInfo")!).classList.add("hidden");
        (document.getElementById("roleInfo")!).textContent = "";
    }, 5000);
}

function checkWinner() {
    if (!gameState.gameEnded) return;

    const winnerMsg = document.getElementById("winnerMessage");
    if (!winnerMsg) return;

    let winner: string | null = null;

    const leftP = document.querySelector(".left-controls p") as HTMLElement | null;
    const rightP = document.querySelector(".right-controls p") as HTMLElement | null;

    if (!leftP || !rightP) {
        console.warn("Controls not ready yet");
        return;
    }

    if (gameState.scores.left >= WINNING_SCORE) {
        winner = leftP.textContent?.replace("Left Player: ", "") ?? null;
    } else if (gameState.scores.right >= WINNING_SCORE) {
        winner = rightP.textContent?.replace("Right Player: ", "") ?? null;
    }

    if (winner) {
        winnerMsg.textContent = `${winner} Wins!`;
        winnerMsg.style.display = "block";

        if ((window as any).onMatchFinished) {
            (window as any).onMatchFinished(winner);
        }
    }

    //endGame();
}

export async function playTournamentMatch(match: {
    id: number;
    player1: string;
    player2: string;
    onFinish: (winner: string) => void;
}) {
    // Prepare the UI for the match
    prepareGameUI(false);

    // Set a global match ID so startTournamentGame can reference it if needed
    (window as any)._tournamentMatchId = match.id;

    // Override the global onMatchFinished temporarily
    (window as any).onMatchFinished = (winnerName: string) => {
        console.log(`[Tournament] Match ${match.id} finished. Winner: ${winnerName}`);

        // Call the match's onFinish callback with just the username
        match.onFinish(winnerName);

        // Clean up global flags to avoid conflicts with next matches
        delete (window as any)._tournamentMatchId;
        delete (window as any).onMatchFinished;
    };

    // Start the game with the given players
    await startTournamentGame(false, match.player1, match.player2);
}

async function startTournamentGame(isAiMode: boolean, playerLeft: string, playerRight: string) {
    // Ensure everything is clean before starting
    cleanup();

    // Wait for DOM to update (1 frame)
    await new Promise(requestAnimationFrame);

    const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement | null;
    if (!canvas) {
        console.error("[LocalPong] Canvas not found in DOM!");
        return;
    }

    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("[LocalPong] Failed to get 2D context");
        return;
    }

    document.querySelector(".left-controls p")!.textContent = `Left Player: ${playerLeft} -> "W / S"`;
    document.querySelector(".right-controls p")!.textContent = `Right Player: ${playerRight} -> "↑ / ↓"`;

    const wsHost = `ws://${window.location.hostname}:7000`;
    if (socket) cleanup();

    socket = io(wsHost, { 
        transports: ['websocket'],
        auth: { token: "local" }
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    socket!.on('connect', async () => {
        console.log(`[LocalPong] Socket connected, joining room '${roomId}'`);
        socket!.emit("joinRoom", { roomId });

        try {
            await postGame(`/game/${roomId}/stop-ai`);
            const initResponse = await postGame(`/game/${roomId}/init`);
            if (!initResponse.ok) throw new Error(`init failed (${initResponse.status})`);

            if (isAiMode) {
                const startAiResponse = await postGame(`/game/${roomId}/start-ai`);
                if (!startAiResponse.ok) throw new Error(`start-ai failed (${startAiResponse.status})`);
            }

            const resumeResponse = await postGame(`/game/${roomId}/resume`);
            if (!resumeResponse.ok) throw new Error(`resume failed (${resumeResponse.status})`);

            isGameRunning = true;
            console.log("[LocalPong] Game started and resumed.");
            gameLoop(isAiMode);

        } catch (error: any) {
            console.error("[LocalPong] Failed to start game:", error);
            const errorMsg = document.getElementById("errorMessage");
            if (errorMsg) {
                errorMsg.textContent = error?.message || "Error al iniciar la partida";
                errorMsg.style.display = "block";
            }
        }
    });

    socket!.on("gameState", (state: GameState) => {
        gameState = state;
        draw();
        if (state.gameEnded) checkWinner();
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