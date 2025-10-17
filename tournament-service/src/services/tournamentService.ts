import { TournamentRepository } from "../repositories/tournamentRepository";
import { Tournament } from "../models/tournamentModel";

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function createLocalTournament(data: {
    name: string;
    maxPlayers: number;
    players: string[];
    }): Promise<{ tournament: Tournament; shuffledPlayers: string[] }> {
        const shuffledPlayers = shuffleArray([...data.players]);

        const tournament = await TournamentRepository.createTournament({
            name: data.name,
            mode: "local",
            creator_id: null,
            max_players: data.maxPlayers,
            players: shuffledPlayers.map(username => ({ username, user_id: null })),
        });

    return { tournament, shuffledPlayers };
}

export async function startTournament(tournamentId: number) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament)
    throw new Error("Tournament not found");

  const players = tournament.players;

  if (players.length % 2 !== 0)
    throw new Error("Odd number of players");

  const matches: { id: number; player1_id: number; player2_id: number; round: number; status: string }[] = [];

  for (let i = 0; i < players.length; i += 2) {
    const player1 = players[i];
    const player2 = players[i + 1];
    
 const matchId = TournamentRepository.addMatch(
      tournamentId,
      1, // round 1
      player1.id,
      player2.id
    );

    matches.push({
      id: matchId,
      player1_id: player1.id,
      player2_id: player2.id,
      round: 1,
      status: "pending",
    });
  }

  TournamentRepository.updateStatus(tournamentId, "in_progress");

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      max_players: tournament.max_players,
      status: "in_progress",
      current_round: 1,
    },
    players: players.map(p => ({ id: p.id, username: p.username })),
    matches,
  };
}