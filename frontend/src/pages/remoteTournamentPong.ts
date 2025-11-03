/**
 * @file remoteTournamentPong.ts
 * @brief Frontend logic for Online Pong game in Tournament mode
 */
import { io, Socket } from "socket.io-client";
import { getAccessToken, refreshAccessToken, getUserIdFromToken } from "../state/authState";

let socket: Socket;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let isGameRunning = false;
let playerRole: "left" | "right" | null = null;
let roomId: string | null = null;
let gameInitialized = false;
let matchId: number | null = null;
let isPlayer1: boolean = false;
let player1Id: number | null = null;
let player2Id: number | null = null;

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
export function remoteTournamentPongPage(): string {
    return `
    <div class="pong-container">
      <h1>Pong - Tournament Match</h1>
      <div id="roleInfo"></div>

      <div class="scoreboard-container">
        <div id="scoreboard" class="scoreboard">0 : 0</div>
      </div>

      <p id="winnerMessage" class="winner-message" style="display: none;"></p>

      <div id="gameInfo" class="game-info" style="display:flex;">
        <div class="controls left-controls">
          <p>Left Player</p>
        </div>

    <canvas id="pongCanvas" width="800" height="600"></canvas>
    <div id="countdown" class="countdown hidden"></div>

        <div class="controls right-controls">
          <p>Right Player</p>
        </div>
      </div>

      <div id="extraInfo" class="extra-info">
        <p>Tournament match in progress</p>
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
    gameInitialized = false;
    // Ensure powerup disabled when cleaning up tournament room
    try {
        if (roomId) postApi(`/game/${roomId}/powerup?enabled=false`).catch(() => {});
    } catch (e) { /* ignore */ }
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

export function remoteTournamentPongHandlers() {
    cleanup();
    ctx = (document.getElementById("pongCanvas") as HTMLCanvasElement).getContext("2d")!;

    // Detect matchId in the URL
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const matchId = urlParams.get('matchId');
    if (matchId) {
        loadMatchInfo(Number(matchId));
    } else {
        // No matchId, should not happen for tournament
        alert("No match specified for tournament match");
    }
}

async function loadMatchInfo(matchIdParam: number) {
    try {
        const token = getAccessToken();
        const response = await fetch(`http://${window.location.hostname}:8080/tournaments/matches/${matchIdParam}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load match info");
        const match = await response.json();
        
        // Get current user
        const currentUserId = getUserIdFromToken();
        isPlayer1 = match.player1_id === currentUserId;
        player1Id = match.player1_id;
        player2Id = match.player2_id;
        const opponent = isPlayer1 ? match.player2_username : match.player1_username;
        
        // Set matchId and roomId
        matchId = matchIdParam;
        roomId = match.roomId;
        prepareGameUI();
        
        // Start game directly
        startGame(match.roomId);
    } catch (error) {
        console.error("Error loading match info:", error);
        alert("Failed to load match information");
    }
}

function prepareGameUI() {
    // For tournament, show game directly (no lobby)
    (document.getElementById("pongCanvas")!).style.display = "block";
    (document.getElementById("gameInfo")!).style.display = "flex";
    (document.getElementById("winnerMessage")!).style.display = "none";
}

function startGame(roomIdToJoin: string) {
    const wsHost = `ws://${window.location.hostname}:7000`;
    socket = io(wsHost);

    document.getElementById("roleInfo")!.textContent = `Joining tournament room ${roomIdToJoin}...`;
    
    socket.on('connect', () => {
        const userId = getUserIdFromToken() || (() => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return undefined;
            try { const u = JSON.parse(userStr); return u?.id ?? u?.userId; } catch { return undefined; }
        })();
        const payload: any = { roomId: roomIdToJoin };
        if (typeof userId !== 'undefined' && userId !== null) payload.userId = userId;
        socket.emit("joinRoom", payload);
    });

    socket.on("roomJoined", (data: { roomId: string, role: "left" | "right" }) => {
        roomId = data.roomId;
        playerRole = data.role;

        const roleInfo = document.getElementById("roleInfo")!;
        roleInfo.textContent = `You are: ${playerRole} in tournament room ${roomId}. Waiting for opponent...`;
        // Keep matchId in URL
    });

    socket.on('roomFull', (payload: { roomId:string }) => {
        alert(`Tournament room ${payload.roomId} is full.`);
        cleanup();
    });

    socket.on('roomNotFound', (payload: { roomId: string }) => {
        alert(`Tournament room ${payload.roomId} not found.`);
        cleanup();
    });

    socket.on("gameReady", (data: { roomId: string }) => {
        document.getElementById("roleInfo")!.textContent = `Tournament room ${data.roomId} is ready. Opponent found!`;
        
        // Game is already visible, just ensure it's ready
        if (!gameInitialized) {
            gameInitialized = true;
            postApi(`/game/${data.roomId}/init`).then(async () => {
                // Apply default settings or none for tournament
                isGameRunning = false;
                try {
                    // Enable powerup for this tournament room
                    await postApi(`/game/${data.roomId}/powerup?enabled=true`);
                } catch (e) {
                    console.warn('[RemoteTournamentPong] Failed to enable powerup for room', data.roomId, e);
                }
                setTimeout(() => {
                    postApi(`/game/${data.roomId}/resume`);
                }, 500);
            });
        } else {
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
        import("../utils/countdown").then(mod => {
            mod.runCountdown('countdown', 1).then(() => {
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

    // Report match result - only the winner client should report to reduce duplicate reports
    if (matchId && playerRole === winnerSide) {
        const winnerPlayerId = (isPlayer1 ? player1Id : player2Id);
        if (winnerPlayerId !== null && winnerPlayerId !== undefined) {
            const winnerIdNum: number = winnerPlayerId!;
            reportMatchResult(matchId, winnerIdNum);

            // Handle tournament flow after 3 seconds (only winner handles navigation/flow)
            setTimeout(async () => {
                await handleTournamentMatchEnd(matchId, winnerIdNum, true);
            }, 3000);
        }
    } else if (matchId && playerRole !== winnerSide) {
        // Loser: still run local cleanup and let server-driven flow decide; handleTournamentMatchEnd will be called by winner's navigation
        setTimeout(() => {
            cleanup();
            window.location.hash = `#/tournament`;
        }, 3000);
    }

    endGame();
}

async function sendVictoryToUserManagement() {
    try {
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
}

async function reportMatchResult(matchId: number, winnerId: number) {
    try {
        const token = getAccessToken();
        const response = await fetch(`http://${window.location.hostname}:8080/tournaments/matches/${matchId}/result`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ winnerId }),
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to report match result");
        console.log("Match result reported successfully");
    } catch (error) {
        console.error("Error reporting match result:", error);
    }
}

async function handleTournamentMatchEnd(matchId: number, winnerId: number, isWinner: boolean) {
    if (!winnerId) {
        console.error("Winner ID is null, cannot handle tournament end");
        return;
    }
    try {
        // Get match details to find tournament ID
        const token = getAccessToken();
        const matchResponse = await fetch(`http://${window.location.hostname}:8080/tournaments/matches/${matchId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });
        
        if (!matchResponse.ok) {
            console.error("Failed to get match details");
            return;
        }
        
        const match = await matchResponse.json();
        const tournamentId = match.tournament_id;
        
        if (isWinner) {
            // Winner: go back to tournament lobby
            console.log("Player won the match, returning to tournament lobby");
            window.location.hash = `#/tournament`;
            
            // After navigation, we need to load the tournament lobby
            // This will be handled by the tournament router
        } else {
            // Loser: leave the tournament
            console.log("Player lost the match, leaving tournament");
            const leaveResponse = await fetch(`http://${window.location.hostname}:8080/tournaments/${tournamentId}/leave`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
            });
            
            if (leaveResponse.ok) {
                console.log("Successfully left tournament");
                // Go back to tournament list
                window.location.hash = `#/tournament`;
            } else {
                console.error("Failed to leave tournament");
                window.location.hash = `#/tournament`;
            }
        }
        
        // Clean up game state
        cleanup();
        
    } catch (error) {
        console.error("Error handling tournament match end:", error);
        // Fallback: go back to tournament page
        window.location.hash = `#/tournament`;
        cleanup();
    }
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