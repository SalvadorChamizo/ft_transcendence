import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";
import { PlayerRepository } from "../repositories/playerRepository";
import { TournamentRepository } from "../repositories/tournamentRepository";

export async function updateRemoteMatchResultController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { matchId } = req.params as { matchId: string };
        const { winnerId } = req.body as { winnerId: number };

        if (!winnerId) {
            return reply.code(400).send({ error: "winnerId is required" });
        }

        // Update the match result
        TournamentRepository.updateMatchResult(Number(matchId), winnerId);

        // Get the match to find the tournament
        const match = TournamentRepository.getMatchById(Number(matchId));
        if (!match) {
            return reply.code(404).send({ error: "Match not found" });
        }

        const tournamentId = match.tournament_id;
        const tournament = TournamentRepository.getById(tournamentId);
        if (!tournament) {
            return reply.code(404).send({ error: "Tournament not found" });
        }

        // Verify this is a remote tournament
        if (tournament.mode !== 'remote') {
            return reply.code(400).send({ error: "This controller is only for remote tournaments" });
        }

        console.log(`[REMOTE] Processing match result for remote tournament ${tournamentId}`);

        // Check if all matches in the current round are completed
        const allMatches = TournamentRepository.getMatchesByTournamentId(tournamentId);
        const currentRound = match.round;
        const roundMatches = allMatches.filter((m: any) => m.round === currentRound);
        const completedMatches = roundMatches.filter((m: any) => m.status === 'completed');

        console.log(`[REMOTE] Round ${currentRound}: ${completedMatches.length}/${roundMatches.length} matches completed`);

        if (completedMatches.length === roundMatches.length) {
            // All matches in the round are completed, advance to next round
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

            // Advance the tournament
            const nextRoundData = await TournamentService.advanceTournamentRound(tournamentId, winners);
            console.log('[REMOTE] Next round created:', nextRoundData);

            // Create REMOTE rooms for the new round matches
            if (nextRoundData.matches && nextRoundData.matches.length > 0) {
                console.log(`[REMOTE] Creating REMOTE rooms for ${nextRoundData.matches.length} matches in round ${nextRoundData.tournament.current_round}`);

                for (const match of nextRoundData.matches) {
                    try {
                        console.log(`[REMOTE] Creating remote room for match ${match.id}...`);
                        // Make request to gateway to create REMOTE room
                        const roomResponse = await fetch('http://gateway:8080/game/remote-rooms', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (roomResponse.ok) {
                            const { roomId } = await roomResponse.json();
                            console.log(`[REMOTE] Created remote room ${roomId} for match ${match.id}`);

                            // Update the match with the roomId
                            TournamentRepository.updateMatchRoomId(match.id, roomId);
                        } else {
                            const errorText = await roomResponse.text();
                            console.error(`[REMOTE] Failed to create remote room for match ${match.id}:`, roomResponse.status, errorText);
                        }
                    } catch (error) {
                        console.error(`[REMOTE] Error creating remote room for match ${match.id}:`, error);
                    }
                }
            }
        }

        return reply.code(200).send({ message: "Remote match result updated successfully" });
    } catch (error) {
        console.error("[REMOTE] Error in updateRemoteMatchResultController:", error);
        return reply.code(500).send({ error: "Failed to update remote match result" });
    }
}