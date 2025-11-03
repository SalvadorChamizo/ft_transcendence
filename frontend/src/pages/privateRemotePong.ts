import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken, getUserIdFromToken } from "../state/authState";

import {
    WINNING_SCORE,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BALL_RADIUS,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_OFFSET_X,
} from "../utils/pong-constants";

let socket: Socket | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" | null = null;
let roomId: string | null = null;
let isRoomCreator = false;
let gameInitialized = false;

const apiHost = `http://${window.location.hostname}:8080`;
const wsHost = `ws://${window.location.hostname}:7000`;

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

// Page (no lobby) — direct private remote match
export function privateRemotePongPage(): string {
    return `
    <div class="pong-container">
        <h1>Private Remote Pong</h1>
        <div id="roleInfo">Inicializando...</div>

        <div class="scoreboard-container">
            <div id="scoreboard" class="scoreboard">0 : 0</div>
            <button id="playAgainBtn" class="pong-button hidden">Play Again</button>
        </div>

        <canvas id="pongCanvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
        <div id="countdown" class="countdown hidden"></div>
        <p id="winnerMessage" class="winner-message" style="display:none"></p>
    </div>
    `;
}

// Helpers: API calls with auth + refresh handling (similar to remotePong.ts)
async function postApi(path: string, method: "POST" | "GET" = "POST"): Promise<Response> {
    const makeReq = async () => {
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(`${apiHost}${path}`, { method, headers });
    };
    let res = await makeReq();
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) res = await makeReq();
    }
    return res;
}

async function postApiJson(path: string, data: any): Promise<Response> {
    const makeReq = async () => {
        const token = getAccessToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(`${apiHost}${path}`, { method: "POST", headers, body: JSON.stringify(data) });
    };
    let res = await makeReq();
    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) res = await makeReq();
    }
    return res;
}

function cleanup() {
    if (socket) socket.disconnect();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    isGameRunning = false;
    isRoomCreator = false;
    gameInitialized = false;
    try { document.getElementById("scoreboard")?.classList.add("hidden"); } catch (e) {}
    // Ensure powerup disabled when cleaning up private remote room
    try {
        if (roomId) postApi(`/game/${roomId}/powerup?enabled=false`).catch(() => {});
    } catch (e) { /* ignore */ }
}

const handleKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
    // Disable 'P' pause in remote view
    if (e.key.toLowerCase() === "p") return;
    keysPressed.add(e.key);
};
const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop() {
    if (socket && isGameRunning && roomId && playerRole) {
        if (keysPressed.has("w") || keysPressed.has("ArrowUp")) socket.emit("moveUp", playerRole, roomId);
        if (keysPressed.has("s") || keysPressed.has("ArrowDown")) socket.emit("moveDown", playerRole, roomId);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Public handler to create (or join if ?room=...) a private remote room and start WS flow
export async function privateRemotePongHandlers() {
    cleanup();
    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;

    // If ?room=... present, join that room; otherwise create and register a private room in backend DB
    try {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const inviteRoom = urlParams.get('room');
        if (inviteRoom) {
            roomId = inviteRoom;
            isRoomCreator = false;
            prepareGameUI();
            startGame(inviteRoom);
            return;
        }
        // If no room query param, check pending room in localStorage (set by chat invite flow)
        try {
            const pending = localStorage.getItem('pendingRemoteRoomId');
            if (pending) {
                // consume the pending id so it won't be reused accidentally
                localStorage.removeItem('pendingRemoteRoomId');
                roomId = pending;
                isRoomCreator = false;
                prepareGameUI();
                startGame(pending);
                return;
            }
        } catch (e) {
            // ignore localStorage errors (e.g., privacy modes)
        }
    } catch (err) {
        console.warn('Failed parsing invite room param', err);
    }

    // Create & register private room. Try /game/rooms { private: true } then fallback.
    try {
        let res = await postApiJson("/game/rooms", { private: true });
        if (!res.ok) {
            // fallback endpoint used in remotePong
            res = await postApi("/game/remote-rooms");
        }
        if (!res.ok) throw new Error(`Failed to create private room: ${res.status}`);
        const body = await res.json();
        const newRoomId = body.roomId ?? body.id ?? body.room_id ?? null;
        if (!newRoomId) throw new Error("Server did not return room id");
        roomId = String(newRoomId);
        isRoomCreator = true;

        // Show shareable invite for the creator
        const roleInfo = document.getElementById("roleInfo")!;
        roleInfo.innerHTML = `Sala privada creada: <b>${roomId}</b>. Comparte <code>#/private-remote-pong?room=${roomId}</code> para invitar.`;

        prepareGameUI();
        startGame(roomId);
    } catch (err) {
        console.error("Error creating private room:", err);
        document.getElementById("roleInfo")!.textContent = "No se pudo crear la sala privada.";
    }
}

function prepareGameUI() {
    (document.getElementById("pongCanvas")!).style.display = "block";
    (document.getElementById("winnerMessage")!).style.display = "none";
    (document.getElementById("playAgainBtn")!).classList.add("hidden");
    try { document.getElementById("scoreboard")!.classList.remove("hidden"); } catch (e) {}
}

function startGame(roomIdToJoin: string) {
    socket = io(wsHost);

    document.getElementById("roleInfo")!.textContent = `Joining room ${roomIdToJoin}...`;

    socket.on('connect', () => {
        const userId = getUserIdFromToken() || (() => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return undefined;
            try { const u = JSON.parse(userStr); return u?.id ?? u?.userId; } catch { return undefined; }
        })();
        const payload: any = { roomId: roomIdToJoin };
        if (typeof userId !== 'undefined' && userId !== null) payload.userId = userId;
        socket!.emit("joinRoom", payload);
    });

    socket.on("roomJoined", (data: { roomId: string, role: "left" | "right" }) => {
        roomId = data.roomId;
        playerRole = data.role;
        const roleInfo = document.getElementById("roleInfo")!;
        roleInfo.textContent = `You are: ${playerRole} in ${roomId}. Waiting for opponent...`;
        window.history.replaceState(null, '', `#/private-remote-pong?room=${data.roomId}`);
    });

    socket.on('roomFull', (payload: { roomId:string }) => {
        alert(`Room ${payload.roomId} is full.`);
        cleanup();
    });

    socket.on('roomNotFound', (payload: { roomId:string }) => {
        alert(`Room ${payload.roomId} not found.`);
        cleanup();
    });

    socket.on("gameReady", (data: { roomId: string }) => {
        document.getElementById("roleInfo")!.textContent = `Room ${data.roomId} is ready. Opponent found!`;

        if (!gameInitialized) {
            gameInitialized = true;
            postApi(`/game/${data.roomId}/init`).then(async () => {
                    if (isRoomCreator) {
                        try {
                            // Enable powerup for this private remote room
                            await postApi(`/game/${data.roomId}/powerup?enabled=true`);
                        } catch (e) {
                            console.warn('[PrivateRemotePong] Failed to enable powerup for room', data.roomId, e);
                        }
                        try { await postApi(`/game/${data.roomId}/resume`); } catch (e) { /* ignore */ }
                    }
            });
            isGameRunning = false;
        } else {
            isGameRunning = false;
        }
    });

    socket.on("gameState", (state: GameState) => {
        gameState = state;
        draw();
        if (state.gameEnded) checkWinner();
    });

    socket.on("gamePaused", ({ paused }: { paused: boolean }) => {
        isGameRunning = !paused;
    });

    socket.on("gameStarting", () => {
        import("../utils/countdown").then(mod => {
            mod.runCountdown('countdown', 1).then(() => {});
        }).catch(()=>{});
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

function startCountdownAndResume(roomToStart: string) {
    const countdownEl = document.getElementById('countdown')!;
    countdownEl.classList.remove('hidden');
    let counter = 3;
    countdownEl.textContent = String(counter);
    const iv = setInterval(() => {
        counter -= 1;
        if (counter === 0) {
            clearInterval(iv);
            countdownEl.classList.add('hidden');
            postApi(`/game/${roomToStart}/resume`).catch(()=>{});
        } else {
            countdownEl.textContent = String(counter);
        }
    }, 1000);
}

function checkWinner() {
    if (!gameState.gameEnded || !isGameRunning) return;

    const winnerMsg = document.getElementById("winnerMessage")!;
    const winning = (gameState as any).winningScore ?? WINNING_SCORE;
    const winner = gameState.scores.left >= winning ? "left" : "right";
    winnerMsg.textContent = (playerRole === winner) ? "You Win!" : "You Lose!";
    winnerMsg.style.display = "block";

    const winnerSide = winner;
    if (playerRole === winnerSide) {
        sendVictoryToUserManagement().catch(err => console.error('Failed to send victory:', err));
    }
    endGame();
}

async function sendVictoryToUserManagement() {
    try {
        let userId = getUserIdFromToken();
        if (!userId) {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;
            const user = JSON.parse(userStr);
            userId = user?.id ?? user?.userId ?? null;
        }
        if (!userId) return;
        const res = await postApiJson(`/users/addVictory`, { userId });
        if (!res.ok) {
            console.error("Failed to post victory:", res.status, await res.text());
        }
    } catch (err) {
        console.error("Error sending victory:", err);
    }
}

function endGame() {
    isGameRunning = false;
    (document.getElementById("playAgainBtn")!).classList.remove("hidden");
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
    try { document.getElementById("scoreboard")!.textContent = `${gameState.scores.left} : ${gameState.scores.right}`; } catch {}
}