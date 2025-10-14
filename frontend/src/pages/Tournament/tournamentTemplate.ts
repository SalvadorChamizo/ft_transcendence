export function getTournamentHtml(): string {
    return `
    <div class="tournament-container">
        <h1>Tournament Mode</h1>
        <div id="tournament-container">${getTournamentModeHtml()}</div>
    </div>
    `;
}

export function getTournamentModeHtml(): string {
    return `
    <div id="modeSelection">
      <h2> Select a Tournament format</h2>
      <div>
        <button id="local-tournament-btn" class="tournament-type-button">Local tournament</button>
        <button id="online-tournament-btn" class="tournament-type-button">Online tournament</button>
      </div>
    </div>
    `;
}

export function getTournamentPlayersHtml(): string {
    return `
    <div class="tournament-players">
      <h2>Select the number of players</h2>
      <div class="players-buttons">
        <button id="fourPlayerBtn" class="tournament-button">4 Players</button>
        <button id="eightPlayerBtn" class="tournament-button">8 Players</button>
      </div>
    </div>
    `;
}

export function getTournamentAliasFourHtml(): string {
    return `
    <div class="tournament-form">
      <form id="fourPlayerForm">
        <h2>Enter the alias for each player</h2>
        <div class="tournament-form-inputs">
          <div>
            <label for="player-one">Player one:</label><br>
            <input type="text" id="player-one" name="player-one"><br>
            <label for="player-two">Player two:</label><br>
            <input type="text" id="player-two" name="player-two"><br>
          </div>
          <div>
            <label for="player-three">Player three:</label><br>
            <input type="text" id="player-three" name="player-one"><br>
            <label for="player-four">Player four:</label><br>
            <input type="text" id="player-four" name="player-four"><br>
          </div>
        </div>
        <button type="submit">Create Tournament</button>
      </form>
    </div>
    `;
}

export function getTournamentAliasEightHtml(): string {
    return `
    
    `;
}

export function  getTournamentCanvasFourHtml(one: string, two: string, three: string, four: string): string {
    return `
  <div class="tournament-container-brackets grid">
    <div class="tournament-round">
      <div class="tournament-match"></div>
    </div>
    <div id="semifinal" class="tournament-round justify-space-around">
      <div id="leftPlayer" class="tournament-match"></div>
      <div class="tournament-link">
        <span id="middle-line" class="tournament-line-middle"></span>
        <span id="middle-line-left" class="tournament-line-middle-left"></span>
        <span id="middle-line-right" class="tournament-line-middle-right"></span>
          <span id="down-line-left" class="tournament-line-down-left"></span>
          <span id="up-line" class="tournament-line-up"></span>
          <span id="down-line-right" class="tournament-line-down-right"></span>
      </div>
      <div id="rightPlayer" class="tournament-match"></div>
    </div>
    <div class="tournament-round">
      <div id="match-one" class="tournament-round">
        <div class="tournament-match">${one}</div>
      <div class="tournament-link">
        <span class="tournament-line-middle"></span>
        <span class="tournament-line-middle-left"></span>
        <span class="tournament-line-middle-right"></span>
          <span class="tournament-line-left top"></span>
          <span class="tournament-line-down-left"></span>
          <span class="tournament-line-up-left"></span>
          <span class="tournament-line-down-right bottom"></span>
      </div>
        <div class="tournament-match">${two}</div>
      </div>
      <div id="match-two" class="tournament-round">
        <div class="tournament-match">${three}</div>
      <div class="tournament-link">
        <span class="tournament-line-middle"></span>
        <span class="tournament-line-middle-left"></span>
        <span class="tournament-line-middle-right"></span>
          <span class="tournament-line-right  top"></span>
          <span class="tournament-line-down-left"></span>
          <span class="tournament-line-up-right"></span>
          <span class="tournament-line-right tournament-line-down-right bottom"></span>
      </div>
        <div class="tournament-match">${four}</div>
      </div>
    </div>
  </div>
    `;
}

export function getTournamentCanvasEightHtml(): string {
    return `
    
    `;
}

export function getTournamentOnlineHtml(): string {
    return `
    
    `;
}

export function getTournamentOnlineRoomHtml(): string {
    return `
    
    `;
}