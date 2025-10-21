import { GameState } from "../utils/types";


// Just for local games
export const roomStates = new Map<string, GameState>();

export function createInitialState(): GameState {
  return {
    paddles: { left: { y: 250 }, right: { y: 250 } },
    ball: { x: 400, y: 300, dx: 0, dy: 0 },
    scores: { left: 0, right: 0 },
    gameEnded: false,
    powerUpMultiplier: 1,
    // speeds left undefined so server uses default constants
    paddleSpeed: undefined,
    ballSpeedX: undefined,
    ballSpeedY: undefined,
    // winning score default: use server constant
    winningScore: undefined,
  };
}


// just for local games
export function createRoom(): string {
  const roomId = `local_${generateUniqueId()}`;
  roomStates.set(roomId, createInitialState());
  console.log(`Room ${roomId} created with initial state.`);
  return roomId;
}


// Just for lcoal games
export function getRooms(): string[] {
  return Array.from(roomStates.keys()).filter(id => id.startsWith('local_'));
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9);
}
