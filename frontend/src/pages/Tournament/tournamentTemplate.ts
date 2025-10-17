export function getTournamentHtml(): string {
    return `
    <div class="tournament-container">
      <h1 id="tournamentTitle">Tournament Mode</h1>
      <div id="tournament-container">${getTournamentModeHtml()}</div>
      <button id="backButton" class="tournament-button">⬅ Back</button>   
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

export function getTournamentRemoteModeHtml(): string {
  return `
      <div id="modeSelection">
      <h2>Online Tournaments</h2>
      <div>
        <button id="new-tournament-btn" class="tournament-type-button">Create new tournament</button>
        <button id="join-tournament-btn" class="tournament-type-button">Join tournament</button>
      </div>
    </div>
  `;
}

export function getTournamentListHtml(): string {
  return `
  <div class="tournament-list-container">
  <h2>🏆 Available Tournaments</h2>

  <div class="tournaments-list-header">
    <button id="create-tournament-list-btn" class="tournament-btn create">➕ Create Tournament</button>
  </div>

  <div id="tournaments-list" class="tournaments-list">
    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #1</span>
        <span class="tournament-players">Players: 2 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #2</span>
        <span class="tournament-players">Players: 3 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #3</span>
        <span class="tournament-players">Players: 1 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #2</span>
        <span class="tournament-players">Players: 3 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #3</span>
        <span class="tournament-players">Players: 1 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #2</span>
        <span class="tournament-players">Players: 3 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>

    <div class="tournament-list-card">
      <div class="tournament-info">
        <span class="tournament-name">Tournament #3</span>
        <span class="tournament-players">Players: 1 / 4</span>
      </div>
      <button class="tournament-btn">Join</button>
    </div>
  </div>
  </div>
  `;
}

export function getTournamentLobbyHTML(): string {
  return `
    <div class="lobby-container">
  <h2>🏆 Tournament Lobby</h2>
  <p id="tournament-name">Tournament: <strong>Autumn Cup</strong></p>
  <p id="tournament-status">Status: <strong>Waiting for players...</strong></p>

  <div class="lobby-players">
    <h3>Joined Players</h3>
    <ul id="player-list">
                <li>pepe</li>
          <li>manolo</li>
          <li>paquito</li>
          <li>churrita</li>

    </ul>
  </div>

  <div class="lobby-actions">
    <button id="join-btn" class="lobby-button">Join</button>
    <button id="leave-btn" class="lobby-button">Leave</button>
    <button id="start-btn" class="lobby-button start" disabled>Start Tournament</button>
  </div>
</div>
  `;
}

export function getTournamentPlayersHtml(): string {
    return `
    <div class="tournament-players">
      <h2>Select the number of players</h2>
        <div class="tournament-name-field">
    <label for="tournamentName">Tournament Name</label>
    <input
      type="text"
      id="tournamentName"
      class="tournament-input"
      placeholder="Enter tournament name..."
    />
  </div>
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
    <button id="start-local-tournament-btn" class="tournament-button">Start Tournament</button>
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