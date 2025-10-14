import Database from "better-sqlite3"

const db: any = new Database("tournament.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    mode TEXT CHECK(mode IN ('local', 'remote')) NOT NULL DEFAULT 'local',
    creator_id INTEGER,
    status TEXT DEFAULT 'pending',
    winner_id INTEGER,
    max_players INTEGER,
    current_round INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (winner_id) REFERENCES players(id)
    );
    `).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        tournament_id INTEGER NOT NULL,
        seed INTEGER,
        score INTEGER DEFAULT 0,
        eliminated BOOLEAN DEFAULT 0,
        is_ai BOOLEAN DEFAULT 0,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    );
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        round INTEGER,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER,
        score_player1 INTEGER,
        score_player2 INTEGER,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (player1_id) REFERENCES players(id),
        FOREIGN KEY (player2_id) REFERENCES players(id),
        FOREIGN KEY (winner_id) REFERENCES players(id)
    );
    `)

export default db;