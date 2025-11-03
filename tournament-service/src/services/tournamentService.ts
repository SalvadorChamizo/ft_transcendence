import { TournamentRepository } from "../repositories/tournamentRepository";
import { PlayerRepository } from "../repositories/playerRepository";

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function getAllTournaments() {
  const tournaments = TournamentRepository.getAll();
  return tournaments;
}

export async function createLocalTournament(data: {
  name: string;
  maxPlayers: number;
  players: string[];
}): Promise<{ tournament: any; shuffledPlayers: string[] }> {
  const shuffledPlayers = shuffleArray([...data.players]);

  const tournament = TournamentRepository.createTournament({
    name: data.name,
    mode: "local",
    creator_id: null,
    max_players: data.maxPlayers,
    players: shuffledPlayers.map((username) => ({ username, user_id: null })),
  });

  return { tournament, shuffledPlayers };
}

export async function createRemoteTournament(data: {
  name: string;
  maxPlayers: number;
  creatorId: number;
}): Promise<{ tournament: any }> {
  const tournament = TournamentRepository.createRemoteTournament({
    name: data.name,
    mode: "remote",
    creator_id: data.creatorId,
    max_players: data.maxPlayers,
  });

  return { tournament };
}

export async function startTournament(tournamentId: number) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const players = tournament.players;
  if (!players || players.length % 2 !== 0) throw new Error("Odd number of players");

  const matches: { id: number; player1_id: number; player2_id: number; round: number; status: string }[] = [];

  for (let i = 0; i < players.length; i += 2) {
    const player1 = players[i];
    const player2 = players[i + 1];

    const matchId = TournamentRepository.addMatch(tournamentId, 1, player1.id, player2.id);

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
    players: players.map((p: any) => ({ id: p.id, username: p.username })),
    matches,
  };
}

export async function startRemoteTournament(tournamentId: number) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "pending") throw new Error("Tournament already started");

  const players = PlayerRepository.getByTournamentId(tournamentId);
  if (!players || players.length % 2 !== 0) throw new Error("Odd number of players");

  const matches: { id: number; player1_id: number; player2_id: number; round: number; status: string }[] = [];

  for (let i = 0; i < players.length; i += 2) {
    const player1 = players[i];
    const player2 = players[i + 1];

    const matchId = TournamentRepository.addRemoteMatch(tournamentId, 1, player1.id, player2.id, null);

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
    players: players.map((p: any) => ({ id: p.id, username: p.username })),
    matches,
  };
}

export async function advanceTournamentRound(tournamentId: number, winners: { id: number; username: string }[]) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  // If only one winner -> finish tournament
  if (winners.length === 1) {
    TournamentRepository.updateStatus(tournamentId, "completed");
    TournamentRepository.setWinner && (await (TournamentRepository as any).setWinner(tournamentId, winners[0].id));

    return {
      tournament: { ...tournament, status: "completed", winner_id: winners[0].id },
      matches: [],
    };
  }

  const nextRound = (tournament.current_round || 1) + 1;
  const matches: { id: number; player1_id: number; player2_id: number; round: number; status: string }[] = [];

  for (let i = 0; i < winners.length; i += 2) {
    const player1 = winners[i];
    const player2 = winners[i + 1];
    if (!player2) break;

    const matchId = TournamentRepository.addMatch(tournamentId, nextRound, player1.id, player2.id);

    matches.push({
      id: matchId,
      player1_id: player1.id,
      player2_id: player2.id,
      round: nextRound,
      status: "pending",
    });
  }

  TournamentRepository.updateRound(tournamentId, nextRound);

  return {
    tournament: { ...tournament, current_round: nextRound },
    matches,
  };
}

export async function advanceRemoteTournamentRound(tournamentId: number, winners: { id: number; username: string }[]) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  // If only one winner -> finish tournament
  if (winners.length === 1) {
    TournamentRepository.updateStatus(tournamentId, "completed");
    TournamentRepository.setWinner && (await (TournamentRepository as any).setWinner(tournamentId, winners[0].id));

    return {
      tournament: { ...tournament, status: "completed", winner_id: winners[0].id },
      matches: [],
    };
  }

  const nextRound = (tournament.current_round || 1) + 1;
  const matches: { id: number; player1_id: number; player2_id: number; round: number; status: string }[] = [];

  for (let i = 0; i < winners.length; i += 2) {
    const player1 = winners[i];
    const player2 = winners[i + 1];
    if (!player2) break;

    // create remote match placeholder with null roomId
    const matchId = TournamentRepository.addRemoteMatch(tournamentId, nextRound, player1.id, player2.id, null);

    matches.push({
      id: matchId,
      player1_id: player1.id,
      player2_id: player2.id,
      round: nextRound,
      status: "pending",
    });
  }

  TournamentRepository.updateRound(tournamentId, nextRound);

  return {
    tournament: { ...tournament, current_round: nextRound },
    matches,
  };
}

export async function joinTournament(tournamentId: number, userId: number | null, username: string) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const playerCount = PlayerRepository.countByTournamentId(tournamentId);
  if (playerCount >= tournament.max_players) throw new Error("Tournament full");

  if (userId) {
    const exists = PlayerRepository.getByUserAndTournament(Number(userId), tournamentId);
    if (exists) return TournamentRepository.getById(tournamentId);
  }

  PlayerRepository.create({
    username,
    user_id: userId,
    tournament_id: tournamentId,
  });

  TournamentRepository.updateCurrentTournamentPlayers(tournamentId, playerCount + 1);

  return TournamentRepository.getById(tournamentId);
}

export async function leaveTournament(tournamentId: number, userId: number | null, username: string) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  if (userId) {
    PlayerRepository.removeByUserAndTournament(Number(userId), tournamentId);
    const playerCount = PlayerRepository.countByTournamentId(tournamentId);
    TournamentRepository.updateCurrentTournamentPlayers(tournamentId, playerCount);
  } else {
    // fallback: remove by username if provided repository supports it
    const fn = (PlayerRepository as any).removeByUsernameAndTournament;
    if (typeof fn === "function") {
      fn(username, tournamentId);
    }
  }

  return TournamentRepository.getById(tournamentId);
}

export async function getTournamentById(tournamentId: number) {
  const tournament = TournamentRepository.getById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");
  return tournament;
}

export async function getTournamentMatchesWithRooms(tournamentId: number) {
  const matches = TournamentRepository.getMatchesByTournamentId(tournamentId);
  if (!matches || matches.length === 0) return [];
  return matches.map((match: any) => ({
    id: match.id,
    player1: { id: match.player1_id, username: match.player1_username },
    player2: { id: match.player2_id, username: match.player2_username },
    round: match.round,
    status: match.status,
    roomId: match.roomId,
  }));
}