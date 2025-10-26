import type { FastifyInstance } from "fastify"
import {
    advanceTournamentController,
    createLocalTournamentController,
    startTournamentController,
    startRemoteTournamentController,
    createRemoteTournamentController,
    getTournamentsController,
    joinTournamentController,
    getTournamentPlayersController,
    leaveTournamentController,
    getTournamentByIdController,
    updateMatchRoomController,
    getTournamentMatchesWithRoomsController,
    getMatchByIdController,
    updateMatchResultController
    /*finishTournamentController,
    getTournamentMatchesController,
    deleteTournamentController,*/
 } from "./../controllers/tournamentController"
import { updateRemoteMatchResultController } from "./../controllers/remoteTournamentController"


export default async function tournamentRoutes(app: FastifyInstance) {

    app.get("/tournaments", getTournamentsController);
    app.get("/tournaments/:id", getTournamentByIdController);
    app.post("/tournaments/local", createLocalTournamentController);
    app.post("/tournaments/:id/start", startTournamentController);
    app.post("/tournaments/:id/start-remote", startRemoteTournamentController);
    app.post("/tournaments/:id/advance", advanceTournamentController);
    app.post("/tournaments/remote", createRemoteTournamentController);
    app.get("/tournaments/:id/join", joinTournamentController);
    app.get("/tournaments/:id/leave", leaveTournamentController);
    app.get("/tournaments/:id/players", getTournamentPlayersController);
    app.put("/tournaments/matches/:matchId/room", updateMatchRoomController);
    app.get("/tournaments/:id/matches", getTournamentMatchesWithRoomsController);
    app.get("/tournaments/matches/:matchId", getMatchByIdController);

    // Use remote controller for remote tournaments, regular controller for local
    app.patch("/tournaments/matches/:matchId/result", async (req, reply) => {
        const { matchId } = req.params as { matchId: string };
        const match = await import("../repositories/tournamentRepository").then(repo => repo.TournamentRepository.getMatchById(Number(matchId)));

        if (match) {
            const tournament = await import("../repositories/tournamentRepository").then(repo => repo.TournamentRepository.getById(match.tournament_id));
            if (tournament && tournament.mode === 'remote') {
                return updateRemoteMatchResultController(req, reply);
            }
        }

        // Default to regular controller (for local tournaments or fallback)
        return updateMatchResultController(req, reply);
    });

}