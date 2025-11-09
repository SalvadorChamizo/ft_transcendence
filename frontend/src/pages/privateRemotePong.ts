import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken, getUserIdFromToken, isLoggedIn } from "../state/authState";

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

let matchRecorded = false; // ensure we only register a finished match once per room
let resultRecorded = false; // ensure we only send victory/defeat once

// Page (no lobby) — direct private remote match
export function privateRemotePongPage(): string {
    return `
    <div class="pong-container">
        <h1>Private Remote Pong</h1>
        <div id="roleInfo">Inicializando...</div>

        <div class="scoreboard-container">
            <div id="scoreboard" class="scoreboard">0 : 0</div>
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
    resultRecorded = false;
        matchRecorded = false; // Reset matchRecorded during cleanup
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
        // Robustly extract room id from hash. Support multiple param names (room, room_id, roomId, id)
        function extractRoomFromHash(): string | null {
            try {
                const query = window.location.hash.split('?')[1] || '';
                const params = new URLSearchParams(query);
                const cand = params.get('room') || params.get('room_id') || params.get('roomId') || params.get('id');
                if (cand) return cand;
                // fallback: regex search anywhere in hash
                const m = window.location.hash.match(/[?&](?:room|room_id|roomId|id)=([^&]+)/);
                if (m && m[1]) return decodeURIComponent(m[1]);
            } catch (e) {
                // ignore
            }
            return null;
        }

        const inviteRoom = extractRoomFromHash();
        if (inviteRoom && inviteRoom !== 'undefined' && inviteRoom !== 'null') {
            roomId = inviteRoom;
            isRoomCreator = false;
            prepareGameUI();
            startGame(inviteRoom);
            return;
        }
        // If no room query param, check pending room in localStorage (set by chat invite flow)
        try {
            // support a couple of pending keys as some clients might use different names
            const pending = localStorage.getItem('pendingRemoteRoomId') || localStorage.getItem('pendingRoomId') || localStorage.getItem('pendingRemoteRoom');
            if (pending && pending !== 'undefined' && pending !== 'null') {
                // consume the pending id so it won't be reused accidentally
                try { localStorage.removeItem('pendingRemoteRoomId'); } catch {};
                try { localStorage.removeItem('pendingRoomId'); } catch {};
                try { localStorage.removeItem('pendingRemoteRoom'); } catch {};
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
        // Try to create a persistent remote room (room_...)
        let res = await postApiJson("/game/remote-rooms", { public: false });
        if (!res.ok) {
            // fallback to local room creation if remote endpoint not available
            res = await postApiJson("/game/rooms", { private: true });
        }
        if (!res.ok) throw new Error(`Failed to create private room: ${res.status}`);
        const body = await res.json();
        const newRoomId = body.roomId ?? body.id ?? body.room_id ?? null;
        if (!newRoomId) throw new Error("Server did not return room id");
        roomId = String(newRoomId);
        isRoomCreator = true;
        try {
            const userId = getUserIdFromToken() || (() => {
                const userStr = localStorage.getItem('user');
                if (!userStr) return undefined;
                try { const u = JSON.parse(userStr); return u?.id ?? u?.userId; } catch { return undefined; }
            })();
            if (userId) {
                await postApiJson(`/game/rooms/${roomId}/add-player`, { playerId: String(userId) });
            }
        } catch (e) {
            console.warn('[PrivateRemotePong] Failed to persist creator in room', e);
        }

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
    try { document.getElementById("scoreboard")!.classList.remove("hidden"); } catch (e) {}
}

// Register finished match into server-side-pong so it appears in match history
async function registerMatchToPongService(winnerSide: "left" | "right", score: { left: number; right: number }) {
    try {
        // Prevent concurrent duplicate registrations by marking early.
        if (matchRecorded) return null;
        matchRecorded = true;
        if (!roomId) return null;

        // Try to fetch room info to obtain player ids
        const roomRes = await postApi(`/game/rooms/${roomId}`, "GET");
        let players: string[] = [];
        if (roomRes.ok) {
            const room = await roomRes.json();
            players = Array.isArray(room.players) ? room.players : [];
        }

        // Determine winner id when possible (players stored in order: left=0,right=1)
        let winner: string | null = null;
        if (players.length >= 2) {
            winner = (winnerSide === "left") ? players[0] : players[1];
        } else {
            // fallback to store symbolic winner
            winner = winnerSide;
        }

        // If this is a local_* room or room info couldn't be fetched, do not send the local room id
        // because it may not exist in the persistent rooms DB and would trigger a FK error.
        const postRoomId = (roomId && roomRes && roomRes.ok) ? roomId : null;
        const body: any = {
            roomId: postRoomId,
            players: players,
            winner: winner,
            score: score,
            endedAt: Date.now(),
        };

        console.log('[PrivateRemotePong] Enviando /game/matches payload:', JSON.stringify(body, null, 2));

        const res = await postApiJson(`/game/matches`, body);
        if (!res.ok) {
            console.error('[PrivateRemotePong] Failed to register match:', res.status, await res.text());
            return null;
        }
        const data = await res.json();
        matchRecorded = true;
        console.log('[PrivateRemotePong] Match registered, id=', data.matchId);
        return data.matchId || null;
    } catch (err) {
        console.error('[PrivateRemotePong] Error registering match:', err);
        return null;
    }
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

    socket.on("roomJoined", async (data: { roomId: string, role: "left" | "right" }) => {
        roomId = data.roomId;
        playerRole = data.role;
        const roleInfo = document.getElementById("roleInfo")!;
        roleInfo.textContent = `You are: ${playerRole} in ${roomId}. Waiting for opponent...`;

        window.history.replaceState(null, '', `#/private-remote-pong?room=${data.roomId}`);
        
        try {
            const userId = getUserIdFromToken() || (() => {
                const userStr = localStorage.getItem('user');
                if (!userStr) return undefined;
                try { const u = JSON.parse(userStr); return u?.id ?? u?.userId; } catch { return undefined; }
            })();
            if (userId && roomId) {
                await postApiJson(`/game/rooms/${roomId}/add-player`, { playerId: String(userId) });
            }
        } catch (e) {
            console.warn('[PrivateRemotePong] Failed to persist player in room', e);
        }
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
                    // Ensure powerup is enabled for private matches (increase ball speed on paddle hit)
                    try {
                        await postApi(`/game/${data.roomId}/powerup?enabled=true`);
                    } catch (e) {
                        console.warn('[PrivateRemotePong] Failed to enable powerup for room', data.roomId, e);
                    }
                    // Only the room creator should call resume to actually start the match
                    if (isRoomCreator) {
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
        if (!isGameRunning && !state.gameEnded) {
            isGameRunning = true;
        }
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
        
        try { (gameState as any).gameEnded = true; } catch {}

        if (!resultRecorded){
            resultRecorded = true;
            try{
                registerMatchToPongService(playerRole || "left",{
                    left: gameState.scores.left,
                    right: gameState.scores.right
                }).catch(() => {});
            } 
            catch {}
            try { sendVictoryToUserManagement().catch(() => {}); } catch {}
        }



        endGame();
    });

    // Server may request clients to leave the room (e.g. admin/cleanup). Handle gracefully.
    socket.on('forceLeaveRoom', (payload: any) => {
        try {
            cleanup();
            const targetHash = (typeof isLoggedIn === 'function' && isLoggedIn()) ? '#/chat' : '#/';
            window.location.hash = targetHash;
        } catch (e) { /* ignore */ }
    });

    socket.on('matchEnded', (payload: any) => {
        try {
            const roleInfo = document.getElementById('roleInfo');
            if (roleInfo) roleInfo.textContent = payload?.message || 'Match ended';
            cleanup();
            const targetHash = (typeof isLoggedIn === 'function' && isLoggedIn()) ? '#/chat' : '#/';
            window.location.hash = targetHash;
        } catch (e) { /* ignore */ }
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
    // Trigger winner handling when server indicates game ended. Don't rely on
    // local `isGameRunning` because the server may set gameEnded while the
    // local flag is false; registerMatchToPongService uses `matchRecorded` to
    // avoid duplicate registrations.
    if (!gameState.gameEnded) return;

    const winnerMsg = document.getElementById("winnerMessage")!;
    const winning = (gameState as any).winningScore ?? WINNING_SCORE;
    const winner = gameState.scores.left >= winning ? "left" : "right";
    winnerMsg.textContent = (playerRole === winner) ? "You Win!" : "You Lose!";
    winnerMsg.style.display = "block";

    const winnerSide = winner;
    // Register match and send victory/defeat similar to remotePong
    if (!resultRecorded) {
        resultRecorded = true;
        if (playerRole === winnerSide) {
            registerMatchToPongService(winnerSide, { left: gameState.scores.left, right: gameState.scores.right })
                .then((matchId) => {
                    if (matchId) console.log('[PrivateRemotePong] Match saved with id', matchId);
                }).catch((e) => console.warn('Failed to register match', e));

            sendVictoryToUserManagement().catch(err => console.error('Failed to send victory:', err));
        } else {
            sendDefeatToUserManagement().catch(err => console.error('Failed to send defeat:', err));
        }
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
        } else {
            console.log(`Victory recorded for user ${userId}`);
        }
    } catch (err) {
        console.error("Error sending victory:", err);
    }
}

async function sendDefeatToUserManagement() {
    try {
        let userId = getUserIdFromToken();
        if (!userId) {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);
            userId = user?.id ?? user?.userId ?? null;
        }
        if (!userId) return;
        const res = await postApiJson(`/users/addDefeat`, { userId });
        if (!res.ok) {
            console.error("Failed to post defeat:", res.status, await res.text());
        } else {
            console.log(`Defeat recorded for user ${userId}`);
        }
    } catch (err) {
        console.error("Error sending defeat:", err);
    }
}

function endGame() {
    isGameRunning = false;
    // Hide any leftover global "Play Again" button that might be present from other pages
    try {
        const pb = document.getElementById('playAgainBtn');
        if (pb) (pb as HTMLElement).style.display = 'none';
    } catch (e) { /* ignore */ }
    // After a short delay, leave the room and reload to return to the private-pong entry
    setTimeout(() => {
        // Inform server explicitly we are leaving so it can remove the player immediately
        try {
            if (socket && roomId) {
                const userId = getUserIdFromToken() || (() => {
                    const userStr = localStorage.getItem('user');
                    if (!userStr) return undefined;
                    try { const u = JSON.parse(userStr); return u?.id ?? u?.userId; } catch { return undefined; }
                })();
                try {
                    socket.emit('leaveRoom', { roomId, userId });
                } catch (e) { /* ignore */ }
            }
        } catch (e) { /* ignore */ }

        // Disconnect and cleanup local resources
        cleanup();

        // Navigate to chat or home via hash change (router listens to hash changes)
        try {
            const targetHash = (typeof isLoggedIn === 'function' && isLoggedIn()) ? '#/chat' : '#/';
            window.location.hash = targetHash;
        } catch (e) { /* ignore */ }

    }, 3000);
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