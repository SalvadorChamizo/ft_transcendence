export interface RemoteTournamentCreateDTO {
    id: number,
    name: string;
    mode: "remote";
    current_players: number,
    creator_id?: number | null;
    max_players: number;
}

export function leftPlayerLoses(id: string) {
    const currentPlayer = document.getElementById(id);
    if (!currentPlayer)
        return ;

    const middleLines = currentPlayer.querySelectorAll('#middle-line-left');
    middleLines.forEach(middleLine => {
        (middleLine as HTMLElement).style.backgroundColor = "#fa4242";
    });

    const downLines = currentPlayer.querySelectorAll('#down-line-left');
    downLines.forEach(downLine => {
        (downLine as HTMLElement).style.backgroundColor = "#fa4242";
    });

    const leftPlayer = currentPlayer.querySelectorAll("#leftPlayer");
    leftPlayer.forEach(player => {
        (player as HTMLElement).style.borderColor = "#fa4242";
    })
}

export function rightPlayerLoses(id: string) {
    const currentPlayer = document.getElementById(id);
    if (!currentPlayer)
        return ;

    const middleLines = currentPlayer.querySelectorAll('#middle-line-right');
    middleLines.forEach(middleLine => {
        (middleLine as HTMLElement).style.backgroundColor = "#fa4242";
    });

    const downLines = currentPlayer.querySelectorAll('#down-line-right');
    downLines.forEach(downLine => {
        (downLine as HTMLElement).style.backgroundColor = "#fa4242";
    });

    const rightPlayer = currentPlayer.querySelectorAll("#rightPlayer");
    rightPlayer.forEach(player => {
        (player as HTMLElement).style.borderColor = "#fa4242";
    })
}

export function renderTournamentCard(t: RemoteTournamentCreateDTO): string {
    return `
        <div class="tournament-list-card" data-tournament-id="${t.id}">
            <div class="tournament-info">
                <span class="tournament-name">${t.name}</span>
                <span class="tournament-players">Players: ${t.current_players} / ${t.max_players}</span>
            </div>
            <button class="tournament-btn">Join</button>
        </div>
    `
}

