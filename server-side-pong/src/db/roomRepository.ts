
import Database from 'better-sqlite3';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'rooms.sqlite');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id TEXT,
  player_id TEXT,
  PRIMARY KEY (room_id, player_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
`);

export function saveRoom(roomId: string, state: any, players: string[]) {
  const insertRoom = db.prepare('INSERT OR REPLACE INTO rooms (id, state) VALUES (?, ?)');
  insertRoom.run(roomId, JSON.stringify(state));

  const deletePlayers = db.prepare('DELETE FROM room_players WHERE room_id = ?');
  deletePlayers.run(roomId);

  const insertPlayer = db.prepare('INSERT INTO room_players (room_id, player_id) VALUES (?, ?)');
  for (const playerId of players) {
    insertPlayer.run(roomId, playerId);
  }
}

export function getRoom(roomId: string): { id: string, state: any, players: string[] } | null {
  const roomStmt = db.prepare('SELECT id, state FROM rooms WHERE id = ?');
  const room = roomStmt.get(roomId);
  if (!room) return null;
  const playersStmt = db.prepare('SELECT player_id FROM room_players WHERE room_id = ?');
  const players = playersStmt.all(roomId).map((row: any) => row.player_id);
  return { id: room.id, state: JSON.parse(room.state), players };
}

export function getAllRooms(): { id: string, state: any, players: string[] }[] {
  const roomsStmt = db.prepare('SELECT id, state FROM rooms');
  const rooms = roomsStmt.all();
  const playersStmt = db.prepare('SELECT room_id, player_id FROM room_players');
  const playersRows = playersStmt.all();
  const playersMap: Record<string, string[]> = {};
  for (const row of playersRows) {
    if (!playersMap[row.room_id]) playersMap[row.room_id] = [];
    playersMap[row.room_id].push(row.player_id);
  }
  return rooms.map((room: any) => ({
    id: room.id,
    state: JSON.parse(room.state),
    players: playersMap[room.id] || []
  }));
}

export function deleteRoom(roomId: string) {
  const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
  stmt.run(roomId);
}
