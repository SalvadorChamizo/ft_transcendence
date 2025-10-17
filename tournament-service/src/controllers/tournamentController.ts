import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";

/*export async function getTournamentsController(req: FastifyRequest, reply: FastifyReply) {
    const tournaments = await TournamentService.getAllTournaments();
    return reply.send(tournaments);
}

export async function getTournamentByIdController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const tournament = await TournamentService.getTournamentById(Number(id));
    if (!tournament)
        return reply.code(404).send({ error: "Tournament not found" });
    return reply.send(tournament);
}*/

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

/*export async function createRemoteTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const data = req.body as any;
    const newTournament = await TournamentService.createRemoteTourmanet(data);
    return reply.code(201).send(newTournament);
}

export async function deleteTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const isDeleted = await TournamentService.deleteTournament(id);
    if (!isDeleted)
        return reply.code(400).send({ error: "Failed to delete Tournament"});
    return reply.code(200).send({ message: "Tournament deleted" });
}

export async function joinTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const joined = await TournamentService.joinTournament(id);
    if (!joined)
        return reply.code(400).send({ error: "Failed to join tournament" });
    return reply.code(200).send({ message: "Tournament joined" });
}

export async function leaveTournamentController(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const leaved = await TournamentService.leaveTournament(id);
    if (!leaved)
        return reply.code(400).send({ error: "Failed to leave tournament" });
    return reply.code(200).send({ message: "Tournament leaved" });
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
}

export async function getTournamentPlayersController(req: FastifyRequest, reply: FastifyReply) {

}*/