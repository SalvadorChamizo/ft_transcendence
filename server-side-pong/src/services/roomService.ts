import { GameState } from "../utils/types";

export const roomStates = new Map<string, GameState>();

export function createInitialState(): GameState {
  return {
    paddles: { left: { y: 250 }, right: { y: 250 } },
    ball: { x: 400, y: 300, dx: 0, dy: 0 },
    scores: { left: 0, right: 0 },
    gameEnded: false,
  };
}

export function createRoom(): string {
  const roomId = generateUniqueId();
  roomStates.set(roomId, createInitialState());
  console.log(`Room ${roomId} created with initial state.`);
  return roomId;
}

export function getRooms(): string[] {
  return Array.from(roomStates.keys());
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9);
}
