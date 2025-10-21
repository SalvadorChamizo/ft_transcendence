import type { FastifyInstance } from "fastify"
import { 
    advanceTournamentController,
    createLocalTournamentController,
    startTournamentController,
    /*createRemoteTournamentController,
    getTournamentsController,
    getTournamentByIdController,
    joinTournamentController,
    leaveTournamentController,*/
    /*finishTournamentController,
    updateMatchResultController,
    getTournamentMatchesController,
    getTournamentPlayersController,
    deleteTournamentController,*/
 } from "./../controllers/tournamentController"


export default async function tournamentRoutes(app: FastifyInstance) {

    /*app.get("/tournaments", getTournamentsController);
    app.get("/tournament/:id", getTournamentByIdController);*/
    app.post("/tournaments/local", createLocalTournamentController);
    app.post("/tournaments/:id/start", startTournamentController);
    app.post("/tournaments/:id/advance", advanceTournamentController);
    /*app.post("/tournaments/remote", createRemoteTournamentController);
    app.delete("/tournament/:id", deleteTournamentController);

    app.post("/tournaments/:id/join", joinTournamentController);
    app.post("/tournaments/:id/leave", leaveTournamentController);

    app.post("/tournaments/:id/finish", finishTournamentController)

    app.post("/tournaments/:id/matches", getTournamentMatchesController);
    app.patch("/matches/:matchId/result", updateMatchResultController);

    app.get("/tournaments/:id/players", getTournamentPlayersController);*/
}