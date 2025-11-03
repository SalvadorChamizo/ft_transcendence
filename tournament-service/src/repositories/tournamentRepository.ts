import db from "../db/sqlite"
export interface TournamentCreateDTO {
    name: string;
    mode: "local" | "remote";
    creator_id?: number | null;
    max_players: number;
    players: {
        username: string;
        user_id: number | null;
        is_ai?: boolean;
    }[];
}

export interface RemoteTournamentCreateDTO {
    name: string;
    mode: "remote";
    creator_id?: number | null;
    max_players: number;
}

export class TournamentRepository {
    static getAll() {
        const stmt = db.prepare(`
            SELECT * FROM tournaments
            WHERE mode = ?
            ORDER BY created_at DESC
        `);
        const result = stmt.all("remote");
        return result;
    }

    static getById(tournamentId: number) {
        const tournamentStmt = db.prepare(`SELECT * FROM tournaments WHERE id = ?`);
        const tournament = tournamentStmt.get(tournamentId);
        
        if (!tournament)
            return null;

        const playersStmt = db.prepare(` SELECT * from players WHERE tournament_id = ? ORDER BY seed ASC`);

        const matchesStmt = db.prepare(`SELECT * from matches WHERE tournament_id = ? ORDER BY round ASC`);

        return {...tournament, players: playersStmt.all(tournamentId), matches: matchesStmt.all(tournamentId),};
    }


    static createRemoteTournament(data: RemoteTournamentCreateDTO) {
        const insertTournament = db.prepare(`
            INSERT INTO tournaments (name, mode, creator_id, max_players)
            VALUES (?, ?, ?, ?)`);

        const result = insertTournament.run(
            data.name,
            data.mode,
            data.creator_id || null,
            data.max_players
        );

        const tournamentId = result.lastInsertRowid as number;

        return this.getById(tournamentId);
    }

    static createTournament(data: TournamentCreateDTO) {
        const insertTournament = db.prepare(`
            INSERT INTO tournaments (name, mode, creator_id, max_players)
            VALUES (?, ?, ?, ?)`);

        const result = insertTournament.run(
            data.name,
            data.mode,
            data.creator_id || null,
            data.max_players
        );

        const tournamentId = result.lastInsertRowid as number;

        const shuffled = [...data.players].sort(() => Math.random() - 0.5);

        const insertPlayer = db.prepare(`
            INSERT INTO players (username, user_id, tournament_id, seed, is_ai) 
            VALUES (?, ?, ?, ?, ?)
            `);

        const insertMany = db.transaction((players) => {
            players.forEach((p, index) => {
                insertPlayer.run(p.username, p.user_id, tournamentId, index + 1, p.is_ai ? 1 : 0);
            });
        });
        insertMany(shuffled);

        return this.getById(tournamentId);
    }

    static updateStatus(tournamentId: number, status: string) {
        const stmt = db.prepare(`UPDATE tournaments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(status, tournamentId);
    }

    static updateCurrentTournamentPlayers(tournamentId: number, currentPlayers: number) {
        const stmt = db.prepare(`UPDATE tournaments SET current_players = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(currentPlayers, tournamentId);
    }

    static addMatch(tournamentId: number, round: number, player1_id: number, player2_id: number) {
        const stmt = db.prepare(`INSERT INTO matches (tournament_id, round, player1_id, player2_id) 
            VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(tournamentId, round, player1_id, player2_id);
        return result.lastInsertRowid as number;
    }

    static addRemoteMatch(tournamentId: number, round: number, player1_id: number, player2_id: number, roomId: string | null) {
        const stmt = db.prepare(`INSERT INTO matches (tournament_id, round, player1_id, player2_id, roomId) 
            VALUES (?, ?, ?, ?, ?)`
        );
        const result = stmt.run(tournamentId, round, player1_id, player2_id, roomId);
        return result.lastInsertRowid as number;
    }

    static updateMatchRoomId(matchId: number, roomId: string) {
        const stmt = db.prepare(`
            UPDATE matches
            SET roomId = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        stmt.run(roomId, matchId);
    }

    static updateMatchResult(matchId: number, winnerId: number): boolean {
        const stmt = db.prepare(`
            UPDATE matches
            SET winner_id = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND (status IS NULL OR status != 'completed')
        `);
        const result = stmt.run(winnerId, matchId);
        return result.changes > 0;
    }

    static deleteTournament(id: number) {
        db.prepare("DELETE FROM tournaments WHERE id = ?").run(id);
    }

    static updateRound(tournamentId: number, round: number) {
        const stmt = db.prepare(`
            UPDATE tournaments
            SET current_round = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `);
            stmt.run(round, tournamentId);
    }

    static getMatchesByTournamentId(tournamentId: number) {
        const stmt = db.prepare(`
            SELECT m.*, p1.username as player1_username, p2.username as player2_username
            FROM matches m
            LEFT JOIN players p1 ON m.player1_id = p1.id
            LEFT JOIN players p2 ON m.player2_id = p2.id
            WHERE m.tournament_id = ?
            ORDER BY m.round ASC, m.id ASC
        `);
        return stmt.all(tournamentId);
    }

    static getMatchById(matchId: number) {
        const stmt = db.prepare(`
            SELECT m.*, p1.username as player1_username, p2.username as player2_username
            FROM matches m
            LEFT JOIN players p1 ON m.player1_id = p1.id
            LEFT JOIN players p2 ON m.player2_id = p2.id
            WHERE m.id = ?
        `);
        return stmt.get(matchId);
    }
}