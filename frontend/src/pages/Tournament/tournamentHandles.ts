import { getTournamentCanvasFourHtml, getTournamentAliasFourHtml, getTournamentPlayersHtml } from "./tournamentTemplate";
import { leftPlayerLoses, rightPlayerLoses } from "./tournamentUtils";

export function tournamentHandlers() {

    const localButton = document.getElementById("local-tournament-btn");
    const onlineButton = document.getElementById("online-tournament-btn");
    const tournamentContainer = document.getElementById("tournament-container");
    const fourPlayerBtn = document.getElementById("fourPlayerBtn");
    const eightPlayerBtn = document.getElementById("eightPlayerBtn");
    const fourPlayerForm = document.getElementById("fourPlayerForm");

    localButton?.addEventListener("click", () => {
        if (tournamentContainer)
            tournamentContainer.innerHTML = getTournamentPlayersHtml();
        tournamentHandlers();
    })

    fourPlayerBtn?.addEventListener("click", () => {
        if (tournamentContainer)
            tournamentContainer.innerHTML = getTournamentAliasFourHtml();
        tournamentHandlers();
    })

    if (fourPlayerForm) {
        fourPlayerForm.onsubmit = async (e) => {
            e.preventDefault();

        const playerOne = (document.querySelector<HTMLInputElement>("#player-one")!).value;
        const playerTwo = (document.querySelector<HTMLInputElement>("#player-two")!).value;
        const playerThree = (document.querySelector<HTMLInputElement>("#player-three")!).value;
        const playerFour = (document.querySelector<HTMLInputElement>("#player-four")!).value;

        if (tournamentContainer)
            tournamentContainer.innerHTML = getTournamentCanvasFourHtml(playerOne, playerTwo, playerThree, playerFour);
        tournamentHandlers();
    }

    }

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