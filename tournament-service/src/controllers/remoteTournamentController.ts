import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";
import { PlayerRepository } from "../repositories/playerRepository";
import { TournamentRepository } from "../repositories/tournamentRepository";
import jwt from 'jsonwebtoken';

export async function updateRemoteMatchResultController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { matchId } = req.params as { matchId: string };
        const { winnerId } = req.body as { winnerId: number };

        if (!winnerId) {
            return reply.code(400).send({ error: "winnerId is required" });
        }

        // Read existing match to enforce only one name
        const existingMatch = TournamentRepository.getMatchById(Number(matchId));
        if (!existingMatch) {
            return reply.code(404).send({ error: "Match not found" });
        }
        if (existingMatch.status === 'completed') {
            console.log(`[REMOTE] Match ${matchId} already completed, ignoring duplicate report`);
            return reply.code(200).send({ message: "Match already reported" });
        }

        // Update match result (first writer wins). Repository currently updates directly.
        TournamentRepository.updateMatchResult(Number(matchId), winnerId);

        // Re-read match and tournament
        const match = TournamentRepository.getMatchById(Number(matchId));
        if (!match) {
            return reply.code(404).send({ error: "Match not found after update" });
        }

        const tournamentId = match.tournament_id;
        const tournament = TournamentRepository.getById(tournamentId);
        if (!tournament) {
            return reply.code(404).send({ error: "Tournament not found" });
        }

        if (tournament.mode !== 'remote') {
            return reply.code(400).send({ error: "This controller is only for remote tournaments" });
        }

        console.log(`[REMOTE] Processing match result for remote tournament ${tournamentId}`);

        // Check round completion
        const allMatches = TournamentRepository.getMatchesByTournamentId(tournamentId);
        const currentRound = match.round;
        const roundMatches = allMatches.filter((m: any) => m.round === currentRound);
        const completedMatches = roundMatches.filter((m: any) => m.status === 'completed');

        console.log(`[REMOTE] Round ${currentRound}: ${completedMatches.length}/${roundMatches.length} matches completed`);

        if (completedMatches.length === roundMatches.length) {
            // Prevent double-advancing: if next-round matches already exist, skip advance
            const nextRoundExists = allMatches.some((m: any) => m.round === currentRound + 1);
            if (nextRoundExists) {
                console.log(`[REMOTE] Next round already created for tournament ${tournamentId}, skipping advance`);
            } else {
                console.log(`[REMOTE] All matches in round ${currentRound} completed, advancing remote tournament`);

                // Collect winners
                const winners = completedMatches.map((m: any) => {
                    const winnerUsername = m.winner_id === m.player1_id ? m.player1_username : m.player2_username;
                    return {
                        id: m.winner_id,
                        username: winnerUsername
                    };
                });

                console.log('[REMOTE] Round winners:', winners);

                // Advance the tournament (create next round matches for remote tournaments)
                const nextRoundData = await TournamentService.advanceRemoteTournamentRound(tournamentId, winners);
                console.log('[REMOTE] Next round created:', nextRoundData);

                // Create REMOTE rooms for the new round matches (if any) using the gateway
                const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';
                if (nextRoundData.matches && nextRoundData.matches.length > 0) {
                    console.log(`[REMOTE] Creating REMOTE rooms for ${nextRoundData.matches.length} matches in round ${nextRoundData.tournament.current_round}`);

                    // prepare a service-signed token so gateway/server accept private room creation
                    const serviceToken = jwt.sign({ id: 'tournament-service', username: 'tournament-service' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

                    for (const newMatch of nextRoundData.matches) {
                        try {
                            // Skip if repository already set a roomId (idempotent)
                            if (newMatch.roomId || newMatch.room_id) {
                                console.log(`[REMOTE] Match ${newMatch.id} already has roomId ${newMatch.roomId || newMatch.room_id}, skipping.`);
                                continue;
                            }

                            console.log(`[REMOTE] Creating remote room (private) for match ${newMatch.id} via ${GATEWAY_URL}/game/remote-rooms`);
                            const roomResponse = await fetch(`${GATEWAY_URL}/game/remote-rooms`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceToken}` },
                                body: JSON.stringify({ public: false }) // request private room for tournament matches
                            });

                            if (roomResponse.ok) {
                                const body = await roomResponse.json();
                                const roomId = body.roomId || body.id || body.room_id;
                                if (!roomId) {
                                    console.error(`[REMOTE] No roomId in response for match ${newMatch.id}`);
                                    continue;
                                }
                                console.log(`[REMOTE] Created remote room ${roomId} for match ${newMatch.id}`);
                                TournamentRepository.updateMatchRoomId(newMatch.id, roomId);
                            } else {
                                const errorText = await roomResponse.text();
                                console.error(`[REMOTE] Failed to create remote room for match ${newMatch.id}:`, roomResponse.status, errorText);
                            }
                        } catch (error) {
                            console.error(`[REMOTE] Error creating remote room for match ${newMatch.id}:`, error);
                        }
                    }
                } // end create rooms
            } // end else nextRound not exists
        } // end if round completed

        return reply.code(200).send({ message: "Remote match result updated successfully" });
    } catch (error) {
        console.error("[REMOTE] Error in updateRemoteMatchResultController:", error);
        return reply.code(500).send({ error: "Failed to update remote match result" });
    }
}
