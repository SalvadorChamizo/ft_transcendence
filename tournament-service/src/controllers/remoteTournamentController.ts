import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";
import { PlayerRepository } from "../repositories/playerRepository";
import { TournamentRepository } from "../repositories/tournamentRepository";
import jwt from "jsonwebtoken";

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
            // Helper to create a remote room (private if JWT_SECRET available, else public) and persist roomId
            const GATEWAY_URL = process.env.GATEWAY_URL || 'http://gateway:8080';
            const createRoomForMatch = async (matchIdToCreate: number) => {
                try {
                    // Build headers/body depending on JWT secret availability
                    const hasSecret = !!process.env.JWT_SECRET;
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    const body: any = {};
                    if (hasSecret) {
                        const serviceToken = jwt.sign(
                            { id: 'tournament-service', username: 'tournament-service' },
                            process.env.JWT_SECRET as string,
                            { expiresIn: '1h' }
                        );
                        headers['Authorization'] = `Bearer ${serviceToken}`;
                        body.public = false; // request private room when possible
                    } else {
                        // Fallback to public room if we can't sign
                        body.public = true;
                        console.warn('[REMOTE] JWT_SECRET not set. Creating PUBLIC remote room as fallback.');
                    }

                    console.log(`[REMOTE] Creating remote room for match ${matchIdToCreate} via ${GATEWAY_URL}/game/remote-rooms`);
                    const roomResponse = await fetch(`${GATEWAY_URL}/game/remote-rooms`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(body)
                    });

                    if (!roomResponse.ok) {
                        const errorText = await roomResponse.text();
                        console.error(`[REMOTE] Failed to create remote room for match ${matchIdToCreate}:`, roomResponse.status, errorText);
                        return;
                    }

                    const resp = await roomResponse.json();
                    const rid = resp.roomId || resp.id || resp.room_id;
                    if (!rid) {
                        console.error(`[REMOTE] No roomId in response for match ${matchIdToCreate}`);
                        return;
                    }
                    console.log(`[REMOTE] Created remote room ${rid} for match ${matchIdToCreate}`);
                    TournamentRepository.updateMatchRoomId(matchIdToCreate, rid);
                } catch (err) {
                    console.error(`[REMOTE] Error creating remote room for match ${matchIdToCreate}:`, err);
                }
            };

            // Check if next-round matches already exist
            const nextRound = currentRound + 1;
            const nextRoundMatches = allMatches.filter((m: any) => m.round === nextRound);
            const nextRoundExists = nextRoundMatches.length > 0;

            if (!nextRoundExists) {
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

                // Create REMOTE rooms for the new round matches (if any)
                if (nextRoundData.matches && nextRoundData.matches.length > 0) {
                    console.log(`[REMOTE] Creating REMOTE rooms for ${nextRoundData.matches.length} matches in round ${nextRoundData.tournament.current_round}`);
                    for (const newMatch of nextRoundData.matches) {
                        // Skip if room already set (idempotent)
                        if ((newMatch as any).roomId || (newMatch as any).room_id) {
                            console.log(`[REMOTE] Match ${newMatch.id} already has roomId ${(newMatch as any).roomId || (newMatch as any).room_id}, skipping.`);
                            continue;
                        }
                        await createRoomForMatch(newMatch.id);
                    }
                }
            } else {
                // Next round already exists (possibly created by a concurrent request). Ensure rooms exist.
                console.log(`[REMOTE] Next round already exists. Ensuring rooms exist for round ${nextRound} matches.`);
                const missingRoomMatches = nextRoundMatches.filter((m: any) => !m.roomId && !m.room_id);
                for (const m of missingRoomMatches) {
                    await createRoomForMatch(m.id);
                }
            }
        }

        return reply.code(200).send({ message: "Remote match result updated successfully" });
    } catch (error) {
        console.error("[REMOTE] Error in updateRemoteMatchResultController:", error);
        return reply.code(500).send({ error: "Failed to update remote match result" });
    }
}
