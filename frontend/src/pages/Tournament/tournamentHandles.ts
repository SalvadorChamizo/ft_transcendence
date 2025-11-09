import { getAccessToken, isLoggedIn } from "../../state/authState";
import { localTournamentPongPage, playTournamentMatch } from "./localTournament";
import { createRemoteTournament, getRemoteTournaments, loadTournamentPlayers, openTournamentLobby, startPolling, stopPolling, showTournamentMatchesLobbyForPlayers, startFastPolling } from "./remoteTournament";
import { getTournamentLobbyHTML, getTournamentListHtml, getTournamentRemoteModeHtml, getTournamentAliasEightHtml, getTournamentCanvasFourHtml, getTournamentAliasFourHtml, getTournamentPlayersHtml } from "./tournamentTemplate";
import { leftPlayerLoses, rightPlayerLoses } from "./tournamentUtils";

const apiHost = `${window.location.hostname}`;

let isOnline = 0;
const tournamentHistory: string[] = [];
let tournamentName = "Default";
let tournamentPlayers = 4;

interface Tournament {
  id: number;
  name: string;
  max_players: number;
  status?: string;
  current_round?: number;
}

let currentTournament: Tournament | null = null;
let currentTournamentId = 0;

let currentPlayers = [];

async function postApi(path: string, method: "POST" | "GET" = "POST"): Promise<Response> {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`http://${apiHost}:8080${path}`, { method, headers });
}

function onTournamentCreated(response: { tournament: Tournament; shuffledPlayers: string[] }) {
    currentTournament = response.tournament;
    currentPlayers = response.shuffledPlayers;
}

function setTournamentContent(html: string) {
  const tournamentContainer = document.getElementById("tournament-container");
  if (!tournamentContainer) return;

  // Save current state before changing
  const currentHTML = tournamentContainer.innerHTML;
  if (currentHTML) tournamentHistory.push(currentHTML);

  // Replace with new view
  tournamentContainer.innerHTML = html;

  // Rebind handlers
  tournamentHandlers();
}

async function startRemoteTournamentFlow(tournamentData: any) {
    let matches = tournamentData.matches;
    const players = tournamentData.players;
    if (!players || players.length === 0)
        return ;

    const playerMap = Object.fromEntries(players.map((p: any) => [p.id, p]));
    let currentMatchIndex = 0;
    let currentRound = tournamentData.tournament.current_round;
    const winners: Record<number, { id: number; username: string }> = {};

    // Render page once
    const tournamentContainer = document.getElementById("tournament-container");
    if (tournamentContainer) tournamentContainer.innerHTML = localTournamentPongPage();

    const playNextMatch = async () => {
        if (currentMatchIndex >= matches.length) {
            console.log("Round winners:", winners);

            const roundWinners = Object.values(winners); // guaranteed to have id + username

            // Tournament finished
            if (roundWinners.length === 1) {
                alert(`Tournament Winner: ${roundWinners[0].username}`);
                console.log("Tournament completed!");
                return;
            }

            // Advance to next round
            console.log("Sending winners to backend:", roundWinners);
            const res = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}/advance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ winners: roundWinners }),
            });

            const nextData = await res.json();
            console.log("nextData:", nextData);

            if (!nextData.matches || nextData.matches.length === 0) {
                alert("Tournament complete! No more matches left.");
                console.log("Final winners:", roundWinners);
                return;
            }

            // Prepare next round
            matches = nextData.matches;
            currentRound = nextData.tournament.current_round;
            currentMatchIndex = 0;
            for (const key in winners) delete winners[key];
            setTimeout(() => playNextMatch(), 2000);
            return;
        }

        const match = matches[currentMatchIndex];
        const player1 = playerMap[match.player1_id];
        const player2 = playerMap[match.player2_id];

        // Update UI
        const leftP = document.querySelector(".left-controls p");
        const rightP = document.querySelector(".right-controls p");
        if (leftP) leftP.textContent = `Left Player: ${player1.username}`;
        if (rightP) rightP.textContent = `Right Player: ${player2.username}`;

        console.log(`Starting match ${currentMatchIndex + 1}: ${player1.username} vs ${player2.username}`);

        await playTournamentMatch({
            id: match.id,
            player1: player1.username,
            player2: player2.username,
            onFinish: async (winnerName: string) => {
                // Match winner to actual player
                const winningPlayer = [player1, player2].find(p => winnerName.includes(p.username));
                if (winningPlayer) {
                    winners[match.id] = { id: winningPlayer.id, username: winningPlayer.username };
                } else {
                    console.warn("Winner not found for match:", match.id, winnerName);
                }

                currentMatchIndex++;
                setTimeout(() => playNextMatch(), 2000);
            },
        });
    };

    playNextMatch();
}

async function startLocalTournamentFlow(tournamentData: any) {
    let matches = tournamentData.matches;
    const players = tournamentData.players;
    if (!players || players.length === 0) return;

    const playerMap = Object.fromEntries(players.map((p: any) => [p.id, p])); // map by id
    let currentMatchIndex = 0;
    let currentRound = tournamentData.tournament.current_round;
    const winners: Record<number, { id: number; username: string }> = {};

    // Render page once
    const tournamentContainer = document.getElementById("tournament-container");
    if (tournamentContainer) tournamentContainer.innerHTML = localTournamentPongPage();

    const playNextMatch = async () => {
        if (currentMatchIndex >= matches.length) {
            console.log("Round winners:", winners);

            const roundWinners = Object.values(winners); // guaranteed to have id + username

            // Tournament finished
            if (roundWinners.length === 1) {
                alert(`Tournament Winner: ${roundWinners[0].username}`);
                console.log("Tournament completed!");
                return;
            }

            // Advance to next round
            console.log("Sending winners to backend:", roundWinners);
            const res = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}/advance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ winners: roundWinners }),
            });

            const nextData = await res.json();
            console.log("nextData:", nextData);

            if (!nextData.matches || nextData.matches.length === 0) {
                alert("Tournament complete! No more matches left.");
                console.log("Final winners:", roundWinners);
                return;
            }

            // Prepare next round
            matches = nextData.matches;
            currentRound = nextData.tournament.current_round;
            currentMatchIndex = 0;
            for (const key in winners) delete winners[key];
            setTimeout(() => playNextMatch(), 2000);
            return;
        }

        const match = matches[currentMatchIndex];
        const player1 = playerMap[match.player1_id];
        const player2 = playerMap[match.player2_id];

        // Update UI
        const leftP = document.querySelector(".left-controls p");
        const rightP = document.querySelector(".right-controls p");
        if (leftP) leftP.textContent = `Left Player: ${player1.username}`;
        if (rightP) rightP.textContent = `Right Player: ${player2.username}`;

        console.log(`Starting match ${currentMatchIndex + 1}: ${player1.username} vs ${player2.username}`);

        await playTournamentMatch({
            id: match.id,
            player1: player1.username,
            player2: player2.username,
            onFinish: async (winnerName: string) => {
                // Match winner to actual player
                const winningPlayer = [player1, player2].find(p => winnerName.includes(p.username));
                if (winningPlayer) {
                    winners[match.id] = { id: winningPlayer.id, username: winningPlayer.username };
                } else {
                    console.warn("Winner not found for match:", match.id, winnerName);
                }

                currentMatchIndex++;
                setTimeout(() => playNextMatch(), 2000);
            },
        });
    };

    playNextMatch();
}

async function showTournamentMatchesLobby(tournamentData: any) {
    console.log("showTournamentMatchesLobby called with:", tournamentData);
    const matches = tournamentData.matches;
    if (!matches || matches.length === 0) {
        alert("No matches available.");
        return;
    }

    // Get tournament name
    const token = getAccessToken();
    const tournamentResponse = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
    });
    const tournamentInfo = await tournamentResponse.json();
    const tournamentName = tournamentInfo.name || "Tournament";

    const matchesWithRooms = await Promise.all(matches.map(async (match: any) => {
        console.log("Creating private room for match:", match.id);
        // Create PRIVATE room for tournament match so it won't appear in public lobby
        const response = await fetch(`http://${apiHost}:8080/game/remote-rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ public: false })
        });
        if (!response.ok) throw new Error("Failed to create room");
        const { roomId } = await response.json();
        console.log("Created roomId:", roomId, "for match:", match.id);
        
        // Update the match with the roomId in the database
        console.log("Updating match", match.id, "with roomId:", roomId);
        const updateResponse = await fetch(`http://${apiHost}:8080/tournaments/matches/${match.id}/room`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ roomId })
        });
        console.log("Update response status:", updateResponse.status);
        
        return { ...match, roomId };
    }));

    const matchesHtml = matchesWithRooms.map((match: any) => {
        const player1 = match.player1?.username || 'Player1';
        const player2 = match.player2?.username || 'Player2';
        return `<li>${player1} vs ${player2} - <a href="#/remote-tournament-pong?matchId=${match.id}">Join Room</a></li>`;
    }).join('');

    const html = `
        <div class="tournament-matches-lobby">
            <h2>🏆 ${tournamentName}</h2>
            <p>Tournament started! Click on your match to join the room.</p>
            <ul>
                ${matchesHtml}
            </ul>
            <button id="back-to-lobby-btn" class="tournament-button">Back to Lobby</button>
        </div>
    `;

    setTournamentContent(html);

    // Add handler for back button
    document.getElementById("back-to-lobby-btn")?.addEventListener("click", async () => {
        const html = await getTournamentLobbyHTML(currentTournamentId);
        setTournamentContent(html);
        startPolling(currentTournamentId);
    });
}

export async function tournamentHandlers() {

    const localButton = document.getElementById("local-tournament-btn");
    const onlineButton = document.getElementById("online-tournament-btn");
    const tournamentContainer = document.getElementById("tournament-container");
    const fourPlayerBtn = document.getElementById("fourPlayerBtn");
    const eightPlayerBtn = document.getElementById("eightPlayerBtn");
    const fourPlayerForm = document.getElementById("fourPlayerForm");
    const joinTournamentsButton = document.getElementById("join-tournament-btn");
    const createOnlineTournamentButton = document.getElementById("new-tournament-btn");
    const backButton = document.getElementById("backButton");
    const startLocalTournamentBtn = document.getElementById("start-local-tournament-btn");
    const cards = document.querySelectorAll(".tournament-list-card");
    const joinBtn = document.getElementById("join-btn");
    const leaveBtn = document.getElementById("leave-btn");
    const startBtn = document.getElementById("start-btn");


    cards.forEach(card => {
        card.addEventListener("click", async () => {
            currentTournamentId = Number(card.getAttribute("data-tournament-id"));
            const html = await getTournamentLobbyHTML(currentTournamentId)
            setTournamentContent(html);
            startFastPolling(currentTournamentId); // Start with fast polling
        });
    });
    
    startBtn?.addEventListener("click", async () => {
        const token = getAccessToken();
        const tournament = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}/start-remote`, {
            method: "POST",
            headers: {                 
                "Authorization": `Bearer ${token}`, },
            credentials: "include", // include cookies
        });

        const tournamentData = await tournament.json();
        console.log(tournamentData);
        if (tournament.ok) {
            // Show matches lobby with room creation for the creator
            showTournamentMatchesLobby(tournamentData);
        }
    })

    joinBtn?.addEventListener("click", async () => {
        const token = getAccessToken();
        const response = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}/join`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });
        const data = await response.json();
    })
    
    leaveBtn?.addEventListener("click", async () => {
        const token = getAccessToken();
        const response = await fetch(`http://${apiHost}:8080/tournaments/${currentTournamentId}/leave`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
            await loadTournamentPlayers(currentTournamentId);
        }
    });

    backButton?.addEventListener("click", () => {
    isOnline = 0;
    stopPolling(); // Stop polling when going back
    const tournamentContainer = document.getElementById("tournament-container");
    if (!tournamentContainer || tournamentHistory.length === 0) return;
    // Restore the last state
    const previousHTML = tournamentHistory.pop();
    if (previousHTML) {
        tournamentContainer.innerHTML = previousHTML;
        tournamentHandlers();
    }
    });


    localButton?.addEventListener("click", () => {
        setTournamentContent(getTournamentPlayersHtml());
        tournamentHandlers();
    })

    onlineButton?.addEventListener("click", () => {
        if (!isLoggedIn()) {
            window.location.hash = "#/login";
            return ;
        }
        setTournamentContent(getTournamentRemoteModeHtml());
        isOnline = 1;
        tournamentHandlers();
    })

    joinTournamentsButton?.addEventListener("click", async () => {
        const tournamentList = await getRemoteTournaments();
        setTournamentContent(getTournamentListHtml(tournamentList));
        const tournamentTitle = document.getElementById("tournamentTitle");
        if (tournamentTitle)
            tournamentTitle.style.marginBottom = "30px";
    })

    createOnlineTournamentButton?.addEventListener("click", () => {
        setTournamentContent(getTournamentPlayersHtml());
    })

    fourPlayerBtn?.addEventListener("click", async () => {
        if (!isOnline)
        {
            tournamentPlayers = 4;
            const name = (document.querySelector<HTMLInputElement>("#tournamentName"));
            if (name?.value) {
                if (name.value.length > 30) {
                    alert("Tournament name cannot exceed 30 characters");
                    return;
                }
                tournamentName = name.value;
            }
            setTournamentContent(getTournamentAliasFourHtml());
        }
        else {
            tournamentPlayers = 4;
            const name = (document.querySelector<HTMLInputElement>("#tournamentName"));
            if (name?.value) {
                if (name.value.length > 30) {
                    alert("Tournament name cannot exceed 30 characters");
                    return;
                }
                tournamentName = name.value;
            }
            currentTournamentId = await createRemoteTournament(tournamentName, tournamentPlayers);
            const html = await getTournamentLobbyHTML(currentTournamentId)
            setTournamentContent(html);
            startFastPolling(currentTournamentId); // Start with fast polling to detect when tournament starts
        }
    })

    if (fourPlayerForm) {
        fourPlayerForm.onsubmit = async (e) => {
            e.preventDefault();

        const playerOne = (document.querySelector<HTMLInputElement>("#player-one")!).value;
        const playerTwo = (document.querySelector<HTMLInputElement>("#player-two")!).value;
        const playerThree = (document.querySelector<HTMLInputElement>("#player-three")!).value;
        const playerFour = (document.querySelector<HTMLInputElement>("#player-four")!).value;

        // Validate alias lengths
        const aliases = [playerOne, playerTwo, playerThree, playerFour];
        for (let i = 0; i < aliases.length; i++) {
            if (aliases[i].length > 10) {
                alert(`Player ${i + 1} alias cannot exceed 10 characters`);
                return;
            }
            if (aliases[i].trim() === "") {
                alert(`Player ${i + 1} alias cannot be empty`);
                return;
            }
        }

        // Check for duplicate aliases
        const aliasSet = new Set<string>();
        const playerNames = ['Player one', 'Player two', 'Player three', 'Player four'];
        for (let i = 0; i < aliases.length; i++) {
            const normalizedAlias = aliases[i].toLowerCase().trim();
            if (aliasSet.has(normalizedAlias)) {
                alert(`Duplicate alias detected: "${aliases[i]}". Each player must have a unique alias.`);
                return;
            }
            aliasSet.add(normalizedAlias);
        }

        const tournament = await fetch(`http://${apiHost}:8080/tournaments/local`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tournamentName, tournamentPlayers, playerOne, playerTwo, playerThree, playerFour }),
            credentials: "include", // include cookies
        });

        const tournamentData = await tournament.json();
        console.log(tournamentData);
        if (tournament.ok && tournamentData.shuffledPlayers)
        {
            const players = tournamentData.shuffledPlayers;
            onTournamentCreated(tournamentData);
            setTournamentContent(getTournamentCanvasFourHtml(players[0], players[1], players[2], players[3]));
        }
        tournamentHandlers();
    }
}

    startLocalTournamentBtn?.addEventListener("click", async () => {
        if (!currentTournament)
            return alert("No active tournament");

        const response = await fetch(`http://${apiHost}:8080/tournaments/${currentTournament.id}/start`, {
            method: "POST",
        })
        const tournamentData = await response.json();
        console.log(tournamentData);
        const currentHTML = tournamentContainer?.innerHTML ?? "";
       //if (tournamentContainer)
        //    tournamentContainer.innerHTML = localTournamentPongPage();
        startLocalTournamentFlow(tournamentData);
        tournamentHandlers();
        //renderMatch(matches[0]);
    });

    const leftPlayerButton = document.getElementById("leftPlayer");

    leftPlayerButton?.addEventListener("click", () => {
        leftPlayerLoses("semifinal");
        tournamentHandlers();
    })

    const rightPlayerButton = document.getElementById("rightPlayer");

    rightPlayerButton?.addEventListener("click", () => {
        rightPlayerLoses("semifinal");
        tournamentHandlers();
    })
}