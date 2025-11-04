
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

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  players TEXT NOT NULL,
  winner TEXT,
  score TEXT NOT NULL,
  ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);
 
CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT,
  player_id TEXT,
  PRIMARY KEY (match_id, player_id),
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
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

export function saveMatch(match: { id?: string; roomId?: string | null; players: string[]; winner?: string | null; score: any; endedAt?: number }): string {
  const id = match.id || `match_${Math.random().toString(36).substring(2, 10)}`;
  const stmt = db.prepare('INSERT OR REPLACE INTO matches (id, room_id, players, winner, score, ended_at) VALUES (?, ?, ?, ?, ?, ?)');
  const endedAt = match.endedAt ? new Date(match.endedAt).toISOString() : new Date().toISOString();
  stmt.run(id, match.roomId || null, JSON.stringify(match.players), match.winner || null, JSON.stringify(match.score), endedAt);
  // keep a normalized list of players for exact queries by user id
  try {
    const deletePlayers = db.prepare('DELETE FROM match_players WHERE match_id = ?');
    deletePlayers.run(id);
    const insertPlayer = db.prepare('INSERT OR REPLACE INTO match_players (match_id, player_id) VALUES (?, ?)');
    for (const playerId of match.players) {
      insertPlayer.run(id, playerId);
    }
  } catch (err: any) {
    // If match_players table doesn't exist for some reason, log and continue (backwards compatibility)
    console.warn('Could not maintain match_players entries:', err && err.message ? err.message : err);
  }
  return id;
}

export function getMatchesByPlayer(playerId: string) {
  // players stored as JSON array; use a LIKE query to match the serialized player id
  const pattern = `%"${playerId}"%`;
  const stmt = db.prepare('SELECT id, room_id, players, winner, score, ended_at FROM matches WHERE players LIKE ? ORDER BY ended_at DESC');
  const rows = stmt.all(pattern);
  return rows.map((r: any) => ({
    id: r.id,
    roomId: r.room_id,
    players: JSON.parse(r.players),
    winner: r.winner,
    score: JSON.parse(r.score),
    endedAt: r.ended_at,
  }));
  // Prefer exact match via the normalized match_players table (stores user ids)
  try {
    const stmt = db.prepare(`
      SELECT m.id, m.room_id, m.players, m.winner, m.score, m.ended_at
      FROM matches m
      JOIN match_players mp ON mp.match_id = m.id
      WHERE mp.player_id = ?
      ORDER BY m.ended_at DESC
    `);
    const rows = stmt.all(playerId);
    return rows.map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      players: JSON.parse(r.players),
      winner: r.winner,
      score: JSON.parse(r.score),
      endedAt: r.ended_at,
    }));
  } catch (err: any) {
    // Fallback for older DBs where match_players doesn't exist: use JSON LIKE search
    const pattern = `%"${playerId}"%`;
    const stmt = db.prepare('SELECT id, room_id, players, winner, score, ended_at FROM matches WHERE players LIKE ? ORDER BY ended_at DESC');
    const rows = stmt.all(pattern);
    return rows.map((r: any) => ({
      id: r.id,
      roomId: r.room_id,
      players: JSON.parse(r.players),
      winner: r.winner,
      score: JSON.parse(r.score),
      endedAt: r.ended_at,
    }));
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
