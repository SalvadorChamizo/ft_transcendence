/**
 * @file gameControllers.ts
 * @brief REST API for controlling the Pong game
 */
import { FastifyInstance } from "fastify";
import { getGameState, resetGame, isGameEnded, startBallMovement } from "../services/gameServices";
import { Server } from "socket.io";


/**
 * runtime flag to pause the game 
 */
let isPaused = true;

export const getIsPaused = () => isPaused;
export const setIsPaused = (value: boolean) => {
  isPaused = value;
};

export async function gameController(fastify: FastifyInstance, io: Server)
{
  /**
   * POST /game/init
   * Reset and initialize the game
   */
	fastify.post("/game/init", async () =>
	{
		const state = resetGame();
		setIsPaused(true);
		io.emit("gameState", state);
		return { message: "Game initialized", state };
	});

	/**
	 * GET /game/state
	 * Fetch the current full game state (paddles + ball + scores)
	 */
	fastify.get("/game/state", async () =>
	{
        return { paused: getIsPaused(), state: getGameState() };
	});

	/**
	 * POST /game/pause
	 * Pause the game loop (ball stops moving, players frozen)
	 */
	fastify.post("/game/pause", async () =>
	{
        if (isGameEnded) return { message: "Game has ended" };
        setIsPaused(true);
        io.emit("gamePaused", { paused: true });
        return { message: "Game paused" };
	});

	/**
	 * POST /game/resume
	 * Resume the game loop
	 */
	fastify.post("/game/resume", async () =>
	{
        console.log("Server: /game/resume called, current isPaused =", getIsPaused());
        if (isGameEnded) return { message: "Game has ended" };
        if (getIsPaused())
        {
            console.log("Server: Starting ball movement");
            startBallMovement();
        }
        setIsPaused(false);
        console.log("Server: Setting isPaused to false, emitting gamePaused: false");
        io.emit("gamePaused", { paused: false });
        return { message: "Game resumed" };
	});

	/**
	 * POST /game/toggle-pause
	 * Toggle the pause state of the game
	 */
	fastify.post("/game/toggle-pause", async () =>
    {
        if (isGameEnded) return { message: "Game has ended" };
        if (getIsPaused()) // If it was paused, we are resuming
        {
            startBallMovement();
        }
        setIsPaused(!getIsPaused());
        io.emit("gamePaused", { paused: getIsPaused() });
        return { message: `Game ${getIsPaused() ? "paused" : "resumed"}` };
    });


	/**
	 * POST /game/reset-score
	 * Reset only the scores, leave paddles and ball as-is
	 */
	fastify.post("/game/reset-score", async () =>
	{
		const state = getGameState();
		state.scores.left = 0;
		state.scores.right = 0;
		io.emit("gameState", state);
		return { message: "Scores reset", state };
	});

	/**
	 * Helper for other services to check pause state
	 */
	fastify.decorate("isGamePaused", () => getIsPaused());
}
