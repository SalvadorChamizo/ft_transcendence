export function Home(): string {
    return `
        <div class="home-page">
        <h1>Characteristics</h1>
        <div class="card-flex">
        <div>
            <div class="card">
                <h2>Tournament</h2>
                <p class="p-emoji">🏆</p>
                <p>This is the first card's content.</p>
            </div>
            <div class="card">
                <h2>2FA & JWT</h2>
                <p class="p-emoji">🛡️</p>
                <p>This is the second card's content.</p>
            </div>
            </div>
            <div>
            <div class="card">
                <h2>Microservices</h2>
                <p class="p-emoji">🐳</p>
                <p>This is the third card's content.</p>
            </div>
            <div class="card">
                <h2>AI Opponent</h2>
                <p class="p-emoji">🤖</p>
                <p>This is the first card's content.</p>
            </div>
            </div>
            <div>
            <div class="card">
                <h2>Local Pong</h2>
                <p>1 vs 1</p>
            </div>
            <div class="card">
                <h2>Card Title 3</h2>
                <p>This is the third card's content.</p>
            </div>
            </div>
            </div>
        </div>
    `;
}

export function homeText(): string {
    return `
        <div class="home-text">
            <h1 class="main-title">FT_TRANSCENDENCE</h1>
            <p class="last-project">This is the last project</p>
            <button onclick="window.location.hash = '#/game';" class="game-btn">
                <span>Let's play</span>
            </button>
        </div>
    `;
}

export function handleStars(): void {
    const body = document.getElementsByClassName("home-page");
    const winHeight = window.innerHeight;
    const winWidth = window.innerWidth;

    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.animation = `twinkle ${(Math.random() * 5 + 5)}s linear ${(Math.random() * 5 + 5)}s infinite`;
        star.style.top = `${Math.random() * winHeight}px`;
        star.style.left = `${Math.random() * winWidth}px`;
        star.style.position = 'absolute';
        body[0].appendChild(star);
    }
}