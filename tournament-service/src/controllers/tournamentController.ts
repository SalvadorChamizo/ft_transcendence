import type { FastifyRequest, FastifyReply } from "fastify"
import * as TournamentService from "../services/tournamentService";
import { PlayerRepository } from "../repositories/playerRepository";
import { TournamentRepository } from "../repositories/tournamentRepository";
import jwt from 'jsonwebtoken';

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
        // If tournament is remote, use remote-specific advance which creates remote matches
        const tournament = TournamentRepository.getById(Number(id));
        let data;
        if (tournament && tournament.mode === 'remote') {
            data = await TournamentService.advanceRemoteTournamentRound(Number(id), winners);
        } else {
            data = await TournamentService.advanceTournamentRound(Number(id), winners);
        }
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
	        console.log("Missing user headers, not authenticated");
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
    	const userId = req.headers["x-user-id"] as string;
        const username = req.headers["x-username"] as string;

        if (!userId || !username) {
            console.log("❌ Missing user headers, not authenticated");
            return reply.code(401).send({ error: "Not authenticated" });
        }
    
        const joined = await TournamentService.joinTournament(Number(id), Number(userId), username);
            
        return reply.code(200).send({ message: "Tournament joined" });
    } catch (err: any) {
        return reply.code(400).send({ error: "Failed to join tournament" });
    }
}

export async function leaveTournamentController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
    	const userId = req.headers["x-user-id"] as string;
        const username = req.headers["x-username"] as string;

        if (!userId || !username) {
            console.log("Missing user headers, not authenticated");
            return reply.code(401).send({ error: "Not authenticated" });
        }
    
        const leaved = await TournamentService.leaveTournament(Number(id), Number(userId), username);
            
        return reply.code(200).send({ message: "Tournament leaved" });
    } catch (err: any) {
        console.log(err);
        return reply.code(400).send({ error: "Failed to leave tournament" });
    }
}

export async function updateMatchResultController(req: FastifyRequest, reply: FastifyReply) {
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

        console.log(`Processing match result for tournament ${tournamentId}, mode: ${tournament.mode}`);

        // Check if all matches in the current round are completed
        const allMatches = TournamentRepository.getMatchesByTournamentId(tournamentId);
        const currentRound = match.round;
        const roundMatches = allMatches.filter((m: any) => m.round === currentRound);
        const completedMatches = roundMatches.filter((m: any) => m.status === 'completed');

        console.log(`Round ${currentRound}: ${completedMatches.length}/${roundMatches.length} matches completed`);

        if (completedMatches.length === roundMatches.length) {
            // All matches in the round are completed, advance to next round
            console.log(`All matches in round ${currentRound} completed, advancing tournament`);

            // Collect winners
            const winners = completedMatches.map((m: any) => {
                const winnerUsername = m.winner_id === m.player1_id ? m.player1_username : m.player2_username;
                return {
                    id: m.winner_id,
                    username: winnerUsername
                };
            });

            console.log('Round winners:', winners);

            // Advance the tournament
            const nextRoundData = await TournamentService.advanceTournamentRound(tournamentId, winners);
            console.log('Next round created:', nextRoundData);

            // Create rooms for the new round matches
            if (nextRoundData.matches && nextRoundData.matches.length > 0) {
                console.log(`Creating rooms for ${nextRoundData.matches.length} matches in round ${nextRoundData.tournament.current_round}`);
                
                // Determine room endpoint based on tournament mode
                const roomEndpoint = tournament.mode === 'local' ? '/game/rooms' : '/game/remote-rooms';
                console.log(`Using ${roomEndpoint} for ${tournament.mode} tournament`);
                
                for (const match of nextRoundData.matches) {
                    try {
                        console.log(`Creating room for match ${match.id}...`);
                        // Make request to gateway to create room (local or remote based on tournament mode)
                        // If remote tournament, create private remote rooms and sign a service token
                        let fetchOptions: any = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
                        if (tournament.mode === 'remote') {
                            const serviceToken = jwt.sign({ id: 'tournament-service', username: 'tournament-service' }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
                            fetchOptions = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceToken}` }, body: JSON.stringify({ public: false }) };
                        }
                        const roomResponse = await fetch(`http://gateway:8080${roomEndpoint}`, fetchOptions);
                        
                        if (roomResponse.ok) {
                            const { roomId } = await roomResponse.json();
                            console.log(`Created ${tournament.mode} room ${roomId} for match ${match.id}`);
                            
                            // Update the match with the roomId
                            TournamentRepository.updateMatchRoomId(match.id, roomId);
                        } else {
                            console.error(`Failed to create ${tournament.mode} room for match ${match.id}:`, roomResponse.status, await roomResponse.text());
                        }
                    } catch (error) {
                        console.error(`Error creating ${tournament.mode} room for match ${match.id}:`, error);
                    }
                }
            }
        }

        return reply.code(200).send({ message: "Match result updated successfully" });
    } catch (error) {
        console.error("Error in updateMatchResultController:", error);
        return reply.code(500).send({ error: "Failed to update match result" });
    }
}

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

export async function getTournamentMatchesWithRoomsController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = req.params as { id: string };
        const matches = await TournamentService.getTournamentMatchesWithRooms(Number(id));
        
        if (!matches || matches.length === 0) {
            return reply.code(404).send({ message: "No matches found for this tournament" });
        }
        
        return reply.code(200).send(matches);
    } catch (error) {
        console.error("Error in getTournamentMatchesWithRoomsController:", error);
        return reply.code(500).send({ error: "Failed to fetch tournament matches with rooms" });
    }
}

export async function getMatchByIdController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { matchId } = req.params as { matchId: string };
        const match = TournamentRepository.getMatchById(Number(matchId));
        
        if (!match) {
            return reply.code(404).send({ message: "Match not found" });
        }
        
        return reply.code(200).send(match);
    } catch (error) {
        console.error("Error in getMatchByIdController:", error);
        return reply.code(500).send({ error: "Failed to fetch match" });
    }
}

export async function updateMatchRoomController(req: FastifyRequest, reply: FastifyReply) {
    try {
        const { matchId } = req.params as { matchId: string };
        const { roomId } = req.body as { roomId: string };

        if (!roomId) {
            return reply.code(400).send({ error: "roomId is required" });
        }

        TournamentRepository.updateMatchRoomId(Number(matchId), roomId);

        return reply.code(200).send({ message: "Match room updated successfully" });
    } catch (error) {
        console.error("Error in updateMatchRoomController:", error);
        return reply.code(500).send({ error: "Failed to update match room" });
    }
}