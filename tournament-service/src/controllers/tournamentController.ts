import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";
import { PlayerRepository } from "../repositories/playerRepository";

export async function getTournamentsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const tournaments = await TournamentService.getAllTournaments();
        return reply.send(tournaments);
    } catch (err: any) {
        return reply.code(500).send({ error: "Failed to get all tournaments"})
    }
}

export async function getTournamentByIdController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const tournament = await TournamentService.getTournamentById(Number(id));
        return reply.send(tournament);
        
    }   catch (err: any) {
        return reply.code(404).send({ error: "Tournament not found" });
    }
}

export async function createLocalTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { tournamentName, tournamentPlayers, playerOne, playerTwo, playerThree, playerFour } = req.body as any;

        const newTournament = await TournamentService.createLocalTournament({
            name: tournamentName,
            maxPlayers: tournamentPlayers,
            players: [playerOne, playerTwo, playerThree, playerFour].filter(Boolean),
        });
        
        return reply.code(201).send(newTournament);
    } catch (err) {
        console.error(err);
        return reply.code(500).send({ error: "Failed to create local tournament" });
    }
}

export async function startTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const tournamentData = await TournamentService.startTournament(Number(id));
        return reply.code(200).send(tournamentData);
        
    } catch (err: any) {
        return reply.code(400).send({ error: "Failed to start tournament" });
    }
}

export async function startRemoteTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const tournamentData = await TournamentService.startRemoteTournament(Number(id));
        return reply.code(200).send(tournamentData);
        
    } catch (err: any) {
        return reply.code(400).send({ error: "Failed to start remote tournament" });
    }
}

export async function advanceTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const { winners } = req.body as { winners: { id: number; username: string }[] };
        const data = await TournamentService.advanceTournamentRound(Number(id), winners);
        return reply.code(200).send(data);
    } catch (err: any) {
        return reply.code(400).send({ error: "Failed to advance tournament" });
    }
}

export async function createRemoteTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {

    	const userId = req.headers["x-user-id"];
        const username = req.headers["x-username"];

        if (!userId || !username) {
	        console.log("❌ Missing user headers, not authenticated");
	        return reply.code(401).send({ error: "Not authenticated" });
        }

        const { tournamentName, tournamentPlayers } = req.body as any;

        const newTournament = await TournamentService.createRemoteTournament({
            name: tournamentName,
            maxPlayers: tournamentPlayers,
            creatorId: Number(userId),
        });
        
        return reply.code(201).send(newTournament);
    } catch (err) {
        console.error(err);
        return reply.code(500).send({ error: "Failed to create local tournament" });
    }
}

export async function joinTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
    	const userId = req.headers["x-user-id"];
        const username = req.headers["x-username"];
    
        const joined = await TournamentService.joinTournament(Number(id), userId, username);
            
        return reply.code(200).send({ message: "Tournament joined" });
    } catch (err: any) {
        return reply.code(400).send({ error: "Failed to join tournament" });
    }
}

export async function leaveTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
    	const userId = req.headers["x-user-id"];
        const username = req.headers["x-username"];
    
        const leaved = await TournamentService.leaveTournament(Number(id), userId, username);
            
        return reply.code(200).send({ message: "Tournament leaved" });
    } catch (err: any) {
        console.log(err);
        return reply.code(400).send({ error: "Failed to leave tournament" });
    }
}

/*export async function deleteTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const isDeleted = await TournamentService.deleteTournament(id);
    if (!isDeleted)
        return reply.code(400).send({ error: "Failed to delete Tournament"});
    return reply.code(200).send({ message: "Tournament deleted" });
}

export async function finishTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const finished = await TournamentService.finishTournament(id);
    if (!finished)
        return reply.code(400).send({ error: "Failed to finish tournament" });
    return reply.code(200).send({ message: "Tournament finished" });
}

export async function getTournamentMatchesController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id:string };

        const matches = await TournamentService.getTournamentMatches(Number(id));
        
        if (!matches || matches.length === 0) {
            return reply.code(404).send({ message: "No matches found for this tournament" });
        }
        
        return reply.code(200).send(matches);
    } catch (error) {
        console.error("Error in getTournamentMatchesController:", error);
        return reply.code(500).send({ error: "Failed to fetch tournament matches" });
    }
}

export async function updateMatchResultController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { matchId } = req.params as { matchId: string };
        const { winnerId } = req.body as { winnerId: number };

        if (!winnerId) {
            return reply.code(400).send({ error: "winnerId is required" });
        }

        const updated = await TournamentService.updateMatchResult(Number(matchId), winnerId);

        if (!updated) {
            return reply.code(404).send({ message: "Match not found or could not be updated" });
        }

        return reply.code(200).send({ message: "Match result updated successfully" });
    } catch (error) {
        console.error("Error in updateMatchResultController:", error);
        return reply.code(500).send({ error: "Failed to update match result" });
    }
}*/

export async function getTournamentPlayersController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const tournamentId = Number(id);

        const players = PlayerRepository.getByTournamentId(tournamentId);
        return reply.send(players);
    } catch (error) {
        console.error("Error fetching tournament players:", error);
        return reply.status(500).send({ error: "Internal server error" });
    }
}