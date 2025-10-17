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

export class TournamentRepository {
    static getAll() {
        const stmt = db.prepare(`SELECT * FROM tournaments ORDER BY created_at DESC
            `);
        return stmt.all();    
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

    static addMatch(tournamentId: number, round: number, player1_id: number, player2_id: number) {
        const stmt = db.prepare(`INSERT INTO matches (tournament_id, round, player1_id, player2_id) 
            VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(tournamentId, round, player1_id, player2_id);
        return result.lastInsertRowid as number;
    }

    static updateMatchResult(matchId: number, winner_id: number, score1: number, score2: number) {
        const stmt = db.prepare(`
            UPDATE matches
            SET winner_id = ?, score_player1 = ?, score_player2 = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`);
            stmt.run(winner_id, score1, score2, matchId);
    }

    static deleteTournament(id: number) {
        db.prepare("DELETE FROM tournaments WHERE id = ?").run(id);
    }
}