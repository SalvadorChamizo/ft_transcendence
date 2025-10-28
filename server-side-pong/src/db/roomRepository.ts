
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  public INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id TEXT,
  player_id TEXT,
  PRIMARY KEY (room_id, player_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
`);

// Migration: ensure 'public' column exists (safe to run multiple times)
try {
  db.prepare(`ALTER TABLE rooms ADD COLUMN public INTEGER DEFAULT 1`).run();
  console.log('Added public column to rooms table');
} catch (err: any) {
  // ignore if column already exists
  if (!/duplicate column/i.test(String(err.message || err))) {
    console.warn('Could not add public column (it may already exist):', err.message || err);
  }
}

export function saveRoom(roomId: string, state: any, players: string[], isPublic: boolean = true) {
  const insertRoom = db.prepare('INSERT OR REPLACE INTO rooms (id, state, public) VALUES (?, ?, ?)');
  insertRoom.run(roomId, JSON.stringify(state), isPublic ? 1 : 0);

  const deletePlayers = db.prepare('DELETE FROM room_players WHERE room_id = ?');
  deletePlayers.run(roomId);

  const insertPlayer = db.prepare('INSERT INTO room_players (room_id, player_id) VALUES (?, ?)');
  for (const playerId of players) {
    insertPlayer.run(roomId, playerId);
  }
}

export function getRoom(roomId: string): { id: string, state: any, players: string[] } | null {
  const roomStmt = db.prepare('SELECT id, state, public FROM rooms WHERE id = ?');
  const room = roomStmt.get(roomId);
  if (!room) return null;
  const playersStmt = db.prepare('SELECT player_id FROM room_players WHERE room_id = ? ORDER BY ROWID');
  const players = playersStmt.all(roomId).map((row: any) => row.player_id);
  return { id: room.id, state: JSON.parse(room.state), players, public: !!room.public } as any;
}

export function getAllRooms(): { id: string, state: any, players: string[] }[] {
  const roomsStmt = db.prepare('SELECT id, state, public FROM rooms');
  const rooms = roomsStmt.all();
  const playersStmt = db.prepare('SELECT room_id, player_id FROM room_players ORDER BY room_id, ROWID');
  const playersRows = playersStmt.all();
  const playersMap: Record<string, string[]> = {};
  for (const row of playersRows) {
    if (!playersMap[row.room_id]) playersMap[row.room_id] = [];
    playersMap[row.room_id].push(row.player_id);
  }
  return rooms.map((room: any) => ({
    id: room.id,
    state: JSON.parse(room.state),
    players: playersMap[room.id] || [],
    public: room.public === 1
  }));
}

export function deleteRoom(roomId: string) {
  const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
  stmt.run(roomId);
}

export function addPlayerToRoom(roomId: string, playerId: string) {
  // Insert player atomically to avoid race conditions
  const insertPlayer = db.prepare(`
    INSERT OR IGNORE INTO room_players (room_id, player_id) 
    SELECT ?, ? WHERE NOT EXISTS (
      SELECT 1 FROM room_players WHERE room_id = ? AND player_id = ?
    )
  `);
  insertPlayer.run(roomId, playerId, roomId, playerId);
  
  // Ensure room exists
  const insertRoom = db.prepare('INSERT OR IGNORE INTO rooms (id, state, public) VALUES (?, ?, ?)');  
  insertRoom.run(roomId, JSON.stringify({}), 1);
}
