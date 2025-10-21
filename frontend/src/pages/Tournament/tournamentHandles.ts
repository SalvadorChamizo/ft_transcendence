import { localTournamentPongPage, playTournamentMatch } from "./localTournament";
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

let currentPlayers = [];

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

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startLocalTournamentFlow(tournamentData: any) {
    let matches = tournamentData.matches;
    const players = tournamentData.players;
    if (!players || players.length === 0) return;

    const playerMap = Object.fromEntries(players.map(p => [p.id, p])); // map by id
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
            const res = await fetch(`http://${apiHost}:8080/tournaments/${currentTournament.id}/advance`, {
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
            await sleep(1000);
            playNextMatch();
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
                await sleep(1500);
                playNextMatch();
            },
        });
    };

    playNextMatch();
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

    backButton?.addEventListener("click", () => {
    isOnline = 0;
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
        setTournamentContent(getTournamentRemoteModeHtml());
        isOnline = 1;
        tournamentHandlers();
    })

    joinTournamentsButton?.addEventListener("click", () => {
        setTournamentContent(getTournamentListHtml());
        const tournamentTitle = document.getElementById("tournamentTitle");
        if (tournamentTitle)
            tournamentTitle.style.marginBottom = "30px";
        tournamentHandlers();
    })

    createOnlineTournamentButton?.addEventListener("click", () => {
        setTournamentContent(getTournamentPlayersHtml());
        tournamentHandlers();
    })

    fourPlayerBtn?.addEventListener("click", () => {
        if (!isOnline)
        {
            tournamentPlayers = 4;
            const name = (document.querySelector<HTMLInputElement>("#tournamentName"));
            if (name?.value)
                tournamentName = name.value;
            setTournamentContent(getTournamentAliasFourHtml());
        }
        else
            setTournamentContent(getTournamentLobbyHTML());
        tournamentHandlers();
    })

    if (fourPlayerForm) {
        fourPlayerForm.onsubmit = async (e) => {
            e.preventDefault();

        const playerOne = (document.querySelector<HTMLInputElement>("#player-one")!).value;
        const playerTwo = (document.querySelector<HTMLInputElement>("#player-two")!).value;
        const playerThree = (document.querySelector<HTMLInputElement>("#player-three")!).value;
        const playerFour = (document.querySelector<HTMLInputElement>("#player-four")!).value;

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

        const currentHTML = tournamentContainer?.innerHTML ?? "";
        if (tournamentContainer)
            tournamentContainer.innerHTML = localTournamentPongPage();
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