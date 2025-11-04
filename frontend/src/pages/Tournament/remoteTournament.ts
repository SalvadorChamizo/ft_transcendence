import { getAccessToken, getUserIdFromToken } from "../../state/authState";
import { getTournamentLobbyHTML } from "./tournamentTemplate";

const apiHost = `${window.location.hostname}`;

// Global polling management
let pollingInterval: number | null = null;

export function startPolling(tournamentId: number) {
    stopPolling(); // Clear any existing polling
    pollingInterval = setInterval(() => {
        loadTournamentPlayers(tournamentId);
    }, 2000); // 2 seconds for normal polling
}

export function startFastPolling(tournamentId: number) {
    stopPolling(); // Clear any existing polling
    pollingInterval = setInterval(() => {
        loadTournamentPlayers(tournamentId);
    }, 1000); // 0.5 seconds for fast polling when waiting for tournament to start
}

export function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

export async function createRemoteTournament(tournamentName: string, tournamentPlayers: number) {
    const token = getAccessToken();
    
    const tournament = await fetch(`http://${apiHost}:8080/tournaments/remote`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
         },
        body: JSON.stringify({ tournamentName, tournamentPlayers}),
        credentials: "include",
    });

    const tournamentData = await tournament.json();
    console.log("TournamentData:", tournamentData);
    return tournamentData.tournament.id;
}

export async function getRemoteTournamentData(tournamentId: number) {
    const token = getAccessToken();
    
    const tournament = await fetch(`http://${apiHost}:8080/tournaments/${tournamentId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
         },
        credentials: "include",
    });

    const tournamentData = await tournament.json();
    console.log("One tournament Data:", tournamentData);
    return tournamentData;
}

export async function getRemoteTournaments() {
    const token = getAccessToken();
    
    const tournaments = await fetch(`http://${apiHost}:8080/tournaments`, {
        method: "GET",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
         },
        credentials: "include",
    });

    const tournamentList = await tournaments.json();
    console.log("TournamentList:", tournamentList);
    return (tournamentList);
}

export async function loadTournamentPlayers(tournamentId: number) {
    const token = getAccessToken();
    
    try {
        const players = await fetch(`http://${apiHost}:8080/tournaments/${tournamentId}/players`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });

        const tournament = await fetch(`http://${apiHost}:8080/tournaments/${tournamentId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });

        const playersData = await players.json();
        const tournamentData = await tournament.json();
        
        // If tournament is in progress, show matches lobby instead of player lobby
        if (tournamentData.status === "in_progress") {
            // Switch to normal polling speed once tournament is detected as in progress
            startPolling(tournamentId);
            showTournamentMatchesLobbyForPlayers(tournamentId);
            return;
        }
        
        const list = document.getElementById("player-list");
        if (list) {
            list.innerHTML = "";

            if (playersData.length === 0) {
                list.innerHTML = "<li>No players joined yet.</li>";
                return ;
            }

            for (const player of playersData) {
                const li = document.createElement("li");
                li.textContent = player.username;
                list.appendChild(li);
            }

            // Always check if current user is the creator and show/hide start button accordingly
            const currentUserId = getUserIdFromToken();
            const startBtn = document.getElementById("start-btn") as HTMLButtonElement | null;
            if (startBtn) {
                if (currentUserId === tournamentData.creator_id && playersData.length === tournamentData.max_players) {
                    startBtn.style.display = "inline-block";
                    startBtn.disabled = false;
                } else {
                    startBtn.style.display = "none";
                    startBtn.disabled = true;
                }
            }
        }
    } catch (err) {
        console.error("Failed to load players:", err);
    }
}

export async function openTournamentLobby(tournamentId: number) {
    // This function can be used to open the lobby, but currently handled in handlers
}

export async function showTournamentMatchesLobbyForPlayers(tournamentId: number) {
    console.log("showTournamentMatchesLobbyForPlayers called for tournament:", tournamentId);
    const token = getAccessToken();
    
    try {
        // Get tournament data to show the name
        const tournamentResponse = await fetch(`http://${apiHost}:8080/tournaments/${tournamentId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });
        const tournamentData = await tournamentResponse.json();

        const response = await fetch(`http://${apiHost}:8080/tournaments/${tournamentId}/matches`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });

        const matches = await response.json();
        console.log("Matches received:", matches);
        
        if (!matches || matches.length === 0) {
            alert("No matches available.");
            return;
        }

        const matchesHtml = matches.map((match: any) => {
            const player1 = match.player1?.username || 'Player1';
            const player2 = match.player2?.username || 'Player2';
            const roomLink = match.roomId ? `<a href="#/remote-tournament-pong?matchId=${match.id}">Join Room</a>` : 'Room not ready';
            return `<li>${player1} vs ${player2} - ${roomLink}</li>`;
        }).join('');

        const html = `
            <div class="tournament-matches-lobby">
                <h2>🏆 ${tournamentData.name}</h2>
                <p>Tournament started! Click on your match to join the room.</p>
                <ul>
                    ${matchesHtml}
                </ul>
                <button id="back-to-lobby-btn" class="tournament-button">Back to Lobby</button>
            </div>
        `;

        const tournamentContainer = document.getElementById("tournament-container");
        if (tournamentContainer) {
            tournamentContainer.innerHTML = html;

            // Add handler for back button
            document.getElementById("back-to-lobby-btn")?.addEventListener("click", async () => {
                const html = await getTournamentLobbyHTML(tournamentId);
                tournamentContainer.innerHTML = html;
                startPolling(tournamentId);
            });
        }
    } catch (err) {
        console.error("Failed to load tournament matches:", err);
    }
}

