/**
 * @file remotePong.ts
 * @brief Frontend logic for Online Pong game (Random and Rooms)
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken, getUserIdFromToken } from "../state/authState";

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" | null = null;
let roomId: string | null = null;
let isRoomCreator = false;
let gameInitialized = false;

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
export function remotePongPage(): string {
    return `
    <div class="pong-container">
      <h1>Pong - Remote Game</h1>
            <div id="pong-lobby">
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
                <div class="lobby-actions">
                    <button id="createRoomBtn" class="lobby-button">Create Public Room</button> <!-- create public room -->
                </div>

                <!-- NEW: public rooms list -->
                <div class="rooms-list" id="roomsListContainer">
                    <h3>Public Rooms</h3>
                    <ul id="roomsList"></ul>
                </div>
            </div>
      <div id="roleInfo"></div>

            <div class="scoreboard-container">
                <button id="startGameBtn" class="pong-button hidden">Start Game</button>
                <!-- hide scoreboard while in lobby -->
                <div id="scoreboard" class="scoreboard hidden">0 : 0</div>
				<button id="playAgainBtn" class="pong-button hidden">Play Again</button>
            </div>

      <p id="winnerMessage" class="winner-message" style="display: none;"></p>

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

            <div id="extraInfo" class="extra-info">
                <p>Pause key disabled in remote matches</p>
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
    isRoomCreator = false;
    gameInitialized = false;
    try { document.getElementById("scoreboard")?.classList.add("hidden"); } catch (e) {}
}

// Helper: POST with Authorization header and retry after refresh on 401
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
        if (refreshed) {
            res = await makeReq();
        }
    }
    return res;
}

// Helper: POST JSON body with Authorization header and retry after refresh on 401
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
        if (refreshed) {
            res = await makeReq();
        }
    }
    return res;
}

const handleKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();
    // Disable 'P' pause in remote pong view
    if (e.key.toLowerCase() === "p") return;
    keysPressed.add(e.key);
};

const handleKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);

function gameLoop() {
    if (socket && isGameRunning && roomId && playerRole) {
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

    // Load public rooms on open
    loadPublicRooms().catch(err => console.warn("Failed loading rooms", err));

    // If URL contains ?room=<id> (from invitation link), auto-join that room
    try {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const inviteRoom = urlParams.get('room');
        if (inviteRoom) {
            // auto-join invited room
            roomId = inviteRoom;
            isRoomCreator = false;
            prepareGameUI();
            startGame(inviteRoom);
            return; // skip adding manual create/join listeners duplication
        }
    } catch (err) {
        console.warn('Failed parsing invite room param', err);
    }

    // Only add lobby event listeners for manual games
    document.getElementById("createRoomBtn")!.addEventListener("click", async () => {
        try {
            const response = await postApi("/game/remote-rooms");
            if (!response.ok) throw new Error("Failed to create room");
            const { roomId: newRoomId } = await response.json();
            roomId = newRoomId;
            isRoomCreator = true;
            prepareGameUI();
            startGame(newRoomId);
        } catch (error) {
            console.error("Error creating room:", error);
            alert("Could not create room. Please try again.");
        }
    });

    document.getElementById("joinRoomBtn")!.addEventListener("click", () => {
        const input = document.getElementById("roomIdInput") as HTMLInputElement;
        const roomIdToJoin = input.value.trim();
        if (roomIdToJoin) {
            roomId = roomIdToJoin;
            isRoomCreator = false;
            prepareGameUI();
            startGame(roomIdToJoin);
        } else {
            alert("Please enter a Room ID.");
        }
    });

    document.getElementById("startGameBtn")!.addEventListener("click", () => {
        if (!roomId) return;
        postApi(`/game/${roomId}/resume`);
        (document.getElementById("startGameBtn")!).classList.add("hidden");
    });

    document.getElementById("playAgainBtn")!.addEventListener("click", () => {
        if (!roomId) return;
        document.getElementById("winnerMessage")!.style.display = "none";
        document.getElementById("playAgainBtn")!.classList.add("hidden");
        postApi(`/game/${roomId}/init`).then(() => {
            (document.getElementById("startGameBtn")!).classList.remove("hidden");
        });
        isGameRunning = false;
    });
}

function prepareGameUI() {
    (document.getElementById("pong-lobby")!).style.display = "none";
    (document.getElementById("pongCanvas")!).style.display = "block";
    (document.getElementById("gameInfo")!).style.display = "flex";
    (document.getElementById("winnerMessage")!).style.display = "none";
    (document.getElementById("playAgainBtn")!).classList.add("hidden");
    
    // For manual games, start button will be shown after init
    (document.getElementById("startGameBtn")!).classList.add("hidden");
	try { document.getElementById("scoreboard")!.classList.remove("hidden"); } catch(e) {}

}

// New helper to fetch and render only public rooms
async function loadPublicRooms() {
    try {
        // GET /game/rooms?public=true via gateway
        const res = await postApi("/game/rooms?public=true", "GET");
        if (!res.ok) {
            console.warn("Failed fetching rooms:", res.status);
            return;
        }
        const rooms = await res.json();
        const ul = document.getElementById("roomsList") as HTMLUListElement;
        if (!ul) return;
        ul.innerHTML = "";
        if (!Array.isArray(rooms) || rooms.length === 0) {
            ul.innerHTML = "<li>No public rooms available</li>";
            return;
        }
        rooms.forEach((r: any) => {
            const li = document.createElement("li");
            // server room object shape: { id, state, players }
            const id = r.id ?? r.roomId ?? r.id;
            const playersCount = (r.players || []).length;
            li.textContent = `${id} (${playersCount} players) `;
            const btn = document.createElement("button");
            btn.textContent = "Join";
            btn.addEventListener("click", () => {
                roomId = id;
                isRoomCreator = false;
                prepareGameUI();
                startGame(id);
            });
            li.appendChild(btn);
            ul.appendChild(li);
        });
    } catch (err: any) {
        console.error("Error loading public rooms:", err);
    }
}

function startGame(roomIdToJoin: string) {
    const wsHost = `ws://${window.location.hostname}:7000`;
    socket = io(wsHost);

    document.getElementById("roleInfo")!.textContent = `Joining room ${roomIdToJoin}...`;
    
    socket.on('connect', () => {
        socket.emit("joinRoom", { roomId: roomIdToJoin });
    });

    socket.on("roomJoined", (data: { roomId: string, role: "left" | "right" }) => {
        roomId = data.roomId;
        playerRole = data.role;

        const roleInfo = document.getElementById("roleInfo")!;
        roleInfo.textContent = `You are: ${playerRole} in room ${roomId}. Waiting for opponent...`;
        window.history.replaceState(null, '', `#/remote-pong?room=${data.roomId}`);
    });

    socket.on('roomFull', (payload: { roomId:string }) => {
        alert(`Room ${payload.roomId} is full. Try another room or create a new one.`);
        // Optionally, reset the UI
        (document.getElementById("pong-lobby")!).style.display = "block";
        (document.getElementById("gameInfo")!).style.display = "none";
        cleanup();
    });

    socket.on('roomNotFound', (payload: { roomId: string }) => {
        alert(`Room ${payload.roomId} not found. Please check the ID and try again.`);
        // Optionally, reset the UI
        (document.getElementById("pong-lobby")!).style.display = "block";
        (document.getElementById("gameInfo")!).style.display = "none";
        cleanup();
    });

    socket.on("gameReady", (data: { roomId: string }) => {
        document.getElementById("roleInfo")!.textContent = `Room ${data.roomId} is ready. Opponent found!`;
        
        // Only initialize the game once per room to avoid conflicts
        if (!gameInitialized) {
            gameInitialized = true;
            // Initialize the game state on the server and then apply custom options
            postApi(`/game/${data.roomId}/init`).then(async () => {
                // Only the player who created the room may apply the difficulty/length settings
                if (isRoomCreator) {
                    try {
                        const difficulty = (document.getElementById('difficultySelect') as HTMLSelectElement)?.value;
                        const gameLength = (document.getElementById('gameLengthSelect') as HTMLSelectElement)?.value;
                        const body: any = {};
                        if (difficulty && difficulty.trim() !== '') body.difficulty = difficulty;
                        if (gameLength && gameLength.trim() !== '') body.gameLength = gameLength;
                        if (Object.keys(body).length > 0) {
                            console.log('[RemotePong] Applying room options', body);
                            const resp = await postApiJson(`/game/${data.roomId}/speeds`, body);
                            console.log('[RemotePong] Speeds POST status', resp.status);
                        }
                    } catch (e) {
                        console.warn('Failed to apply room options for', data.roomId, e);
                    }
                    // After initializing and applying options, the room creator will automatically resume the game
                    // so the match actually starts when both players are present.
                    try {
                        await postApi(`/game/${data.roomId}/resume`);
                    } catch (e) {
                        console.warn('Failed to auto-resume room', data.roomId, e);
                    }
                }

                isGameRunning = false;
                // Don't start countdown here, wait for server "gameStarting" event
                // The resume will be called after init, and server will emit gameStarting
            });
        } else {
            // For the second player, just wait for the game to start
            isGameRunning = false;
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

    socket.on("gameStarting", () => {
        // Start countdown for all players when game is about to start
        import("../utils/countdown").then(mod => {
            mod.runCountdown('countdown', 1).then(() => {
                // Game will start automatically after countdown
            });
        });
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
            // resume game
            postApi(`/game/${roomToStart}/resume`).catch(() => {});
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
    // If the local player won, send a victory to the user-management service
    const winnerSide = winner;
    if (playerRole === winnerSide) {
        sendVictoryToUserManagement().catch(err => console.error('Failed to send victory:', err));
    }
    endGame();
}

async function sendVictoryToUserManagement() {
    try {
        // Prefer extracting user id from the access token (more reliable), fallback to localStorage
        let userId = getUserIdFromToken();
        if (!userId) {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                console.warn("No user id available (token/localStorage); cannot send victory.");
                return;
            }
            const user = JSON.parse(userStr);
            userId = user?.id ?? user?.userId ?? null;
        }
        if (!userId) {
            console.warn("Unable to resolve userId for victory.");
            return;
        }

        // Gateway exposes user-management under /users (proxied to user-management service)
        const res = await postApiJson(`/users/addVictory`, { userId });
        if (!res.ok) {
            const text = await res.text();
            console.error("Failed to post victory:", res.status, text);
        } else {
            console.log(`Victory recorded for user ${userId}`);
        }
    } catch (err) {
        console.error("Error sending victory:", err);
    }
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