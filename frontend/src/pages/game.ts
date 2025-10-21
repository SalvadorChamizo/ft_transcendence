export function Game() : string {
    return `
        <div class="game-modes">
        <h1>Select a Game Mode</h1>
        <hr class="game-hr">
        <div class="game-card-flex">
        <a href="#/pong/local" class="game-card local">
            <div class="overlay">
                <h2>Local</h2>
            </div>
            </a>
            <a href="#/pong/remote" class="game-card remote">
            <div class="overlay">
                <h2>Remote</h2>
            </div>
            </a>
            <a href="#/tournament" class="game-card tournament">
            <div class="overlay">
                <h2>Tournament</h2>
            </div>
            </a>
            <a href="#/pong/local/powerup" class="game-card powerup">
            <div class="overlay">
                <h2>Local PowerUp</h2>
            </div>
            </a>
        </div>
        </div>
    `
}