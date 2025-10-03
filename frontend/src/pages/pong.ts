/**
 * @file pong.ts
 * @brief Frontend logic for the server-side Pong game page.
 */

import { io } from "socket.io-client";

let socket: any;
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number; // To manage the game loop
let isGameRunning = false;
const WINNING_SCORE = 10;

interface Paddle {
    y: number;
}

interface Ball {
    x: number;
    y: number;
}

interface Scores {
    left: number;
    right: number;
}

interface GameState {
    paddles: {
        left: Paddle;
        right: Paddle;
    };
    ball: Ball;
    scores: Scores;
}

/**
 * @brief Holds the current game state received from the server.
 */
let gameState: GameState = {
    paddles: {
        left: { y: 250 },
        right: { y: 250 },
    },
    ball: { x: 400, y: 300 },
    scores: { left: 0, right: 0 },
};

// A Set to store the state of currently pressed keys for simultaneous movement.
const keysPressed = new Set<string>();

/**
 * @brief The main game loop.
 * Continuously sends movement commands to the server based on pressed keys.
 */
function gameLoop()
{
    if (socket && isGameRunning)
    {
        if (keysPressed.has("w")) {
            socket.emit("moveUp", "left");
        }
        if (keysPressed.has("s")) {
            socket.emit("moveDown", "left");
        }
        if (keysPressed.has("ArrowUp")) {
            socket.emit("moveUp", "right");
        }
        if (keysPressed.has("ArrowDown")) {
            socket.emit("moveDown", "right");
        }
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * @brief Returns the HTML markup for the Pong game page.
 * @returns {string} HTML string for the Pong page.
 */
export function pongPage() {
    return `
        <div class="pong-container">
            <h1>Local 1 vs 1 Pong</h1>
            <div id="scoreboard" class="scoreboard">0 : 0</div>
            <canvas id="pongCanvas" width="800" height="600"></canvas>
            <div id="gameInfo" class="game-info">
                <p>Use W/S to move Left Paddle, ArrowUp/ArrowDown for Right Paddle</p>
                <p>Press 'P' to Pause/Resume</p>
                <p id="winnerMessage" class="winner-message" style="display: none;"></p>
                <button id="startGameBtn" class="pong-button">Start Game</button>
                <button id="playAgainBtn" class="pong-button" style="display: none;">Play Again</button>
            </div>
        </div>
    `;
}

/**
 * @brief Sets up event handlers and socket connection for the Pong game.
 */
export function pongHandlers() {
    
    if (document.readyState !== 'complete') {
        window.addEventListener('load', pongHandlers);
        return;
    }

    const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
    
    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }
    
    ctx = canvas.getContext("2d");
    socket = io("ws://localhost:3000");

    function initializeGame() {
        fetch("http://localhost:8080/game/init", { method: "POST" });
        isGameRunning = false;
        const winnerMessage = document.getElementById("winnerMessage") as HTMLElement;
        const startGameBtn = document.getElementById("startGameBtn") as HTMLButtonElement;
        const playAgainBtn = document.getElementById("playAgainBtn") as HTMLButtonElement;

        if (winnerMessage) winnerMessage.style.display = "none";
        if (startGameBtn) startGameBtn.style.display = "block";
        if (playAgainBtn) playAgainBtn.style.display = "none";
    }

    // Listen for full game state updates from the server.
    socket.on("gameState", (state: GameState) => {
        gameState = state;
        draw();

        if (!isGameRunning) return;

        const winnerMessage = document.getElementById("winnerMessage") as HTMLElement;
        if (gameState.scores.left >= WINNING_SCORE) {
            winnerMessage.textContent = "Player 1 Wins!";
            winnerMessage.style.display = "block";
            endGame();
        } else if (gameState.scores.right >= WINNING_SCORE) {
            winnerMessage.textContent = "Player 2 Wins!";
            winnerMessage.style.display = "block";
            endGame();
        }
    });

    socket.on("gamePaused", ({ paused }: { paused: boolean }) => {
        isGameRunning = !paused;
    });

    // Stop any previous game loop and clear keys
    cancelAnimationFrame(animationFrameId);
    keysPressed.clear();

    // Handle key down events
    window.addEventListener("keydown", (e) => {
        // Evitar scroll con flechas
        if (["ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key.toLowerCase() === 'p') {
            fetch("http://localhost:8080/game/toggle-pause", { method: "POST" })
                .then(response => response.json())
                .catch(error => console.error("Frontend: Toggle pause error:", error));
        } else {
            keysPressed.add(e.key);
        }
    });

    // Handle key up events
    window.addEventListener("keyup", (e) => {
        keysPressed.delete(e.key);
    });

    // Start Game button
    const startGameBtn = document.getElementById("startGameBtn");
    if (startGameBtn) {
        startGameBtn.addEventListener("click", () => {
            fetch("http://localhost:8080/game/resume", { 
                method: "POST",
                mode: "cors"
            })
                .then(response => {
                    if (!response.ok) {
                        console.error("Frontend: Fetch response not ok", response.status);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error("Frontend: Fetch error", error);
                });
            startGameBtn.style.display = "none";
        });
    }

    // Play Again button
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
            initializeGame();
        });
    }

    initializeGame();
    draw();
    gameLoop();
}

function endGame() {
    isGameRunning = false;
    const playAgainBtn = document.getElementById("playAgainBtn") as HTMLButtonElement;
    if (playAgainBtn) playAgainBtn.style.display = "block";
}

/**
 * @brief Draws the current game state (paddles, ball, scores) on the canvas.
 */
function draw() {
    if (!ctx) return;
    
    // Limpiar el canvas con fondo negro
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 800, 600);

    // Línea central discontinua
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Dibujar paletas en blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(30, gameState.paddles.left.y, 20, 100);
    ctx.fillRect(750, gameState.paddles.right.y, 20, 100);

    // Dibujar pelota en blanco
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Actualizar marcador
    const scoreboard = document.getElementById("scoreboard");
    if (scoreboard) {
        scoreboard.textContent = `${gameState.scores.left} : ${gameState.scores.right}`;
    }
}
