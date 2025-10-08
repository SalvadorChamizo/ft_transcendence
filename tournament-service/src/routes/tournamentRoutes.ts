import { fastifyInstance } from "fastify"
import { createTournamentController } from "../controllers/tournamentController"


export default async function tournamentRoutes(app: FastifyInstance) {

    app.get("/createTournament", createTournamentController);
}