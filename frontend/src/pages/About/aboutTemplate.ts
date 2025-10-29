export function getAboutHTML(): string {
    return `
    <div class="about-btn">
        <button id="about-us-btn" class="about-button">About us</button>
        <button id="about-project-btn" class="about-button">About the project</button>
    </div>
    <div id="about-content" class="about-content">
        <p class="about-group-description">
            We are disciples of Vzurera's coding philosophy.
        We come from completely different backgrounds,
        which gives us a diverse set of skills that we've applied throughout this project.
        </p>
        <h1>Meet the Team</h1>
        <div class="team-container">
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/saroca_intra.jpg" alt="saroca_intra">
                        </div>
                        <div class="team-content">
                        <h3 class="name">Sergio Aroca</h3>
                        <h4 class="title-saroca">Saroca-f</h4>
                    </div>
                    <ul class="social">
                        <li><a href="https://github.com/saroca-f" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                <li><a href="https://www.linkedin.com/in/sergio-aroca-fernandez/" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                </ul>
                </div>
            </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/jeandrad_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Jesús Andrade</h3>
                        <h4 class="title">jeandrad</h4>
                        </div>
                        <ul class="social">
                        <li><a href="https://github.com/jeandrad1" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="https://www.linkedin.com/in/jes%C3%BAs-andrade-perez-50299b2ba/" class="fa-brands fa-linkedin"
                            aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                    </ul>
                    </div>
            </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/pablogon_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Pablo González</h3>
                        <h4 class="title">pablogon</h4>
                        </div>
                        <ul class="social">
                        <li><a href="https://github.com/pablooglez" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="https://www.linkedin.com/in/pablooglez/" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                </ul>
                </div>
                </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/schamizo_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Salvador Chamizo</h3>
                        <h4 class="title">schamizo</h4>
                    </div>
                    <ul class="social">
                        <li><a href="https://github.com/SalvadorChamizo" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="www.linkedin.com/in/salvadorchamizo" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                    </ul>
                    </div>
                    </div>
        </div>
        </div>
    </div>
    `;
}

export function getGameplayModuleHTML(): string {
    return `
        <h1>Gameplay and User Experience</h1>
        <p class="about-group-description">
            These modules elevate the core Pong gameplay by improving interaction, customization, 
            and communication between players, ensuring a smooth and engaging experience across devices.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Remote Multiplayer</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    We enabled remote play, allowing two players to compete from different computers through 
                    the same web platform. The system manages synchronization, latency handling, and reconnection 
                    logic to provide stable, real-time gameplay even in imperfect network conditions.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">Game Customization Options</h2>
                <h3 class="module-subtitle">Minor Module</h3>
                <p class="module-description">
                    Players can personalize their Pong experience by choosing between different maps, power-ups, 
                    and gameplay modes. A default “classic” mode remains available for those who prefer traditional 
                    matches. All customization options are designed to stay consistent across the entire platform, 
                    maintaining balance and simplicity.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">Live Chat Integration</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    We implemented a real-time chat system where users can communicate directly, send match invitations, 
                    and even block others when necessary. The chat also connects to the tournament system to notify players 
                    about upcoming matches, and provides easy access to user profiles — turning communication into a central 
                    part of the gaming experience.
                </p>
            </div>

        </div>
        `;
}


export function getUserModuleHTML(): string {
    return `
        <h1>User Management</h1>
        <p class="about-group-description">
        This module focuses on how users interact with the Pong platform — from registration and profiles
        to authentication and social connections. It ensures a secure and personalized experience for every player.
        </p>

        <div class="modules-container">
            <div class="module-card">
                <h2 class="module-title">User Accounts & Player Profiles</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                We developed a full user management system that allows players to register, log in, and create
                personalized profiles. Each user can choose a unique display name, upload an avatar, and
                update their information at any time.<br><br>
                The platform also enables players to add friends, see who’s online, and view detailed match
                histories including scores, dates, and results — creating a connected and competitive community.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">Remote Authentication (OAuth 2.0)</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                To enhance security and convenience, we implemented <strong>OAuth 2.0 authentication</strong>,
                allowing users to log in using trusted external providers such as <strong>Google</strong> or
                <strong>42</strong>.<br><br>
                This integration ensures safe token exchange, user privacy, and a smooth login flow that meets
                modern web security standards, making account access faster and more reliable.
                </p>
            </div>
        </div>
    `;
}

export function getWebModuleHTML(): string {
    return `
        <h1>Web</h1>
        <p class="about-group-description">
        These modules allowed us to expand our Pong project into a complete web application,
        connecting the gameplay experience with a modern, reliable backend.
        </p>

        <div class="modules-container">
            <div class="module-card">
                <h2 class="module-title">Fastify Backend Framework</h2>
                <h3 class="module-subtitle">Mayor Module</h3>
                <p class="module-description">
                    We built our backend using <strong>Fastify</strong>, a lightweight Node.js framework known for its
                    speed and simplicity. It handles API requests, authentication, and real-time communication between
                    players, forming the foundation of the web integration in our game.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">SQLite Database</h2>
                <h3 class="module-subtitle">Minor Module</h3>
                <p class="module-description">
                    To store user data, tournaments, messages, match results, statistics, and more, we integrated an <strong>SQLite</strong> database on each respective microservice.<br><br>
                    Its efficiency and simplicity made it ideal for managing persistent data while keeping the setup
                    lightweight and consistent with our backend framework.
                </p>
            </div>
        </div>
    `;
}

export function getAiModuleHTML() {
    return `
        <h1>AI & Algorithms</h1>
        <p class="about-group-description">
            These modules bring intelligent and data-driven behavior to our Pong project, 
            making gameplay more dynamic and providing valuable insights through analytics.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">AI Opponent</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    We designed an <strong>AI-powered Pong opponent</strong> that mimics human behavior and reacts intelligently 
                    to gameplay. Instead of relying on predefined paths, the AI observes the game state once per second 
                    and predicts ball movement to plan its actions — just like a real player.<br><br>
                    It simulates keyboard input and adapts to different match conditions, even using power-ups if they’re available. 
                    The result is a challenging and engaging opponent that feels natural, competitive, and unpredictable.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">User & Game Statistics Dashboards</h2>
                <h3 class="module-subtitle">Minor Module</h3>
                <p class="module-description">
                    We implemented interactive <strong>statistics dashboards</strong> that let players visualize their progress 
                    and game performance over time. These dashboards present player stats, match history, and performance trends 
                    using clear charts and data visualizations.<br><br>
                    This feature helps users analyze their strengths, track improvements, and gain a deeper understanding 
                    of their gameplay through a clean and intuitive interface.
                </p>
            </div>

        </div>
    `;
}

export function getCybersecurityModuleHTML() {
    return `
        <h1>Cybersecurity</h1>
        <p class="about-group-description">
            These modules reinforce the security and privacy foundation of our Pong project, 
            ensuring that user data and authentication processes meet modern protection standards.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Two-Factor Authentication (2FA) & JWT Security</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    To enhance account protection, we implemented <strong>Two-Factor Authentication (2FA)</strong> 
                    and <strong>JSON Web Tokens (JWT)</strong> for secure authentication and authorization.<br><br>
                    2FA adds an extra verification step — such as a one-time code sent via email or authenticator app — 
                    to ensure that only legitimate users can access their accounts. Meanwhile, JWTs securely handle 
                    session validation and permissions across our backend, preventing unauthorized access and maintaining 
                    consistent session integrity.<br><br>
                    Together, these systems provide a strong defense against identity theft and session hijacking,
                    ensuring a safe and reliable authentication process for all users.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">GDPR Compliance & Data Privacy</h2>
                <h3 class="module-subtitle">Minor Module</h3>
                <p class="module-description">
                    We introduced <strong>GDPR-compliant features</strong> that empower users to manage and protect 
                    their personal data. Players can view, edit, or delete their stored information, anonymize their identity, 
                    or request full account deletion in accordance with EU data protection laws.<br><br>
                    These measures ensure transparency, privacy, and control over user data, aligning our platform 
                    with modern digital responsibility standards and demonstrating our commitment to user trust and 
                    information security.
                </p>
            </div>

        </div>
    `;
}

export function getDevOpsModuleHTML() {
    return `
        <h1>DevOps</h1>
        <p class="about-group-description">
            The DevOps module focuses on improving the architecture and scalability of our project’s infrastructure,
            emphasizing flexibility, modularity, and efficient deployment practices.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Backend Microservices Architecture</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    We designed our backend following a <strong>microservices architecture</strong>, dividing the system 
                    into small, independent services, each handling a specific function — such as authentication, 
                    matchmaking, chat, and game management.<br><br>
                    This modular approach allows us to develop, deploy, and scale each service independently, improving 
                    reliability and simplifying maintenance. Communication between microservices is handled through 
                    <strong>RESTful APIs</strong>, ensuring clean data exchange and efficient coordination.<br><br>
                    By adopting microservices, our project achieves higher scalability, better fault isolation, and a 
                    more robust backend foundation suited for continuous integration and future feature expansion.
                </p>
            </div>

        </div>
    `;
}

export function getAccessibilityModuleHTML() {
    return `
        <h1>Accessibility</h1>
        <p class="about-group-description">
            The Accessibility module focuses on improving the inclusiveness and reach of our web application 
            by ensuring a consistent experience across multiple browsers and platforms.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Expanding Browser Compatibility</h2>
                <h3 class="module-subtitle">Minor Module</h3>
                <p class="module-description">
                    To make our platform more accessible, we extended support beyond a single browser, 
                    ensuring that users can enjoy the application smoothly regardless of their preferred environment.<br><br>
                    This process involved rigorous <strong>cross-browser testing</strong>, 
                    fine-tuning our styles, layouts, and scripts to guarantee consistent behavior and performance 
                    across major browsers such as <strong>Chrome, Firefox, Safari, and Edge</strong>.<br><br>
                    By expanding browser compatibility, we provide users with a reliable, 
                    visually coherent, and fully functional experience — no matter where they choose to play.
                </p>
            </div>

        </div>
    `;
}

export function getMandatoryPartHTML() {
    return `
        <h1>Mandatory Part</h1>
        <p class="about-group-description">
            The mandatory part establishes the foundational structure and technical standards for the project.
            It defines the core features, architectural requirements, and minimal security practices that every
            implementation must follow before integrating optional modules.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Single Page Application (SPA)</h2>
                <p class="module-description">
                    The project must run as a <strong>Single Page Application (SPA)</strong>, supporting standard browser
                    navigation and full compatibility with the latest version of <strong>Mozilla Firefox</strong>.  
                    No unhandled errors or warnings should appear in the console.
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">Pong Game</h2>
                <p class="module-description">
                    The website’s main function is to host a live <strong>Pong game</strong> playable directly in the browser.
                    Two players should be able to play locally on the same keyboard, while optional modules like
                    <strong>Remote Players</strong> can enhance this functionality for online play.<br><br>
                    The game must include:
                    <ul class="module-description">
                        <li class="module-description">A <strong>tournament system</strong> allowing multiple players to compete in sequence.</li>
                        <li class="module-description">A <strong>matchmaking mechanism</strong> to organize rounds and display upcoming matches.</li>
                        <li class="module-description">Uniform gameplay rules — all paddles and AI must share the same speed and behavior.</li>
                        <li class="module-description">A <strong>registration system</strong> for alias-based participation, with optional persistent accounts if the <strong>User Management module</strong> is implemented.</li>
                    </ul>
                </p>
            </div>

            <div class="module-card">
                <h2 class="module-title">Security Concerns</h2>
                <p class="module-description">
                    Security is a core aspect of the mandatory part. Regardless of module choice, all implementations must:
                    <ul class="module-description">
                        <li class="module-description"><strong>Hash all stored passwords</strong> to protect user credentials.</li>
                        <li class="module-description">Prevent <strong>SQL injection</strong> and <strong>XSS</strong> vulnerabilities through proper input validation.</li>
                        <li class="module-description">Use <strong>HTTPS</strong> (or <strong>WSS</strong> for WebSocket connections) to secure communication.</li>
                        <li class="module-description">Implement <strong>form validation</strong> on both client and server sides.</li>
                        <li class="module-description">Protect API routes and endpoints, ensuring that no sensitive data is exposed.</li>
                    </ul>
                    Even if the <strong>JWT Security</strong> or <strong>2FA</strong> module is not used, the project must still demonstrate
                    responsible security practices in its base configuration.
                </p>
            </div>

        </div>
    `;
}

export function getServerSidePongModuleHTML() {
    return `
        <h1>Server-Side Pong</h1>
        <p class="about-group-description">
            This module represents a major technical evolution of the project — transforming the classic Pong game 
            into a fully server-driven experience with a robust API for web and CLI integration.
        </p>

        <div class="modules-container">

            <div class="module-card">
                <h2 class="module-title">Replace Basic Pong with Server-Side Pong and Implement an API</h2>
                <h3 class="module-subtitle">Major Module</h3>
                <p class="module-description">
                    The <strong>Server-Side Pong</strong> module shifts game logic — including ball movement, scoring, and 
                    player interaction — from the client to the server. This ensures <strong>real-time synchronization</strong>, 
                    improved performance, and a consistent experience for all connected players.<br><br>
                    A dedicated <strong>RESTful API</strong> was implemented to expose game resources and control mechanisms, 
                    allowing interaction from both the <strong>web interface</strong> and the <strong>Command-Line Interface (CLI)</strong>.<br><br>
                    This architectural shift enhances scalability, simplifies multiplayer coordination, and opens the door 
                    for future integrations. The result is a seamless and engaging Pong experience — powered by a modern, 
                    server-side foundation.
                </p>
            </div>

        </div>
    `;
}


export function getAboutUsHTML() {
    return `
        <p class="about-group-description">
            We are disciples of Vzurera's coding philosophy.
        We come from completely different backgrounds,
        which gives us a diverse set of skills that we've applied throughout this project.
        </p>
        <h1>Meet the Team</h1>
        <div class="team-container">
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/saroca_intra.jpg" alt="saroca_intra">
                        </div>
                        <div class="team-content">
                        <h3 class="name">Sergio Aroca</h3>
                        <h4 class="title-saroca">Saroca-f</h4>
                    </div>
                    <ul class="social">
                        <li><a href="https://github.com/saroca-f" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                <li><a href="https://www.linkedin.com/in/sergio-aroca-fernandez/" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                </ul>
                </div>
            </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/jeandrad_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Jesús Andrade</h3>
                        <h4 class="title">jeandrad</h4>
                        </div>
                        <ul class="social">
                        <li><a href="https://github.com/jeandrad1" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="https://www.linkedin.com/in/jes%C3%BAs-andrade-perez-50299b2ba/" class="fa-brands fa-linkedin"
                            aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                    </ul>
                    </div>
            </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/pablogon_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Pablo González</h3>
                        <h4 class="title">pablogon</h4>
                        </div>
                        <ul class="social">
                        <li><a href="https://github.com/pablooglez" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="https://www.linkedin.com/in/pablooglez/" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                                </ul>
                </div>
                </div>
            <div class="team-member">
                <div class="our-team">
                    <div class="picture">
                        <img src="../../public/schamizo_intra.jpg" alt="saroca_intra">
                    </div>
                    <div class="team-content">
                        <h3 class="name">Salvador Chamizo</h3>
                        <h4 class="title">schamizo</h4>
                    </div>
                    <ul class="social">
                        <li><a href="https://github.com/SalvadorChamizo" class="fa-brands fa-github"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                        <li><a href="www.linkedin.com/in/salvadorchamizo" class="fa-brands fa-linkedin"
                                aria-hidden="true" target="_blank" rel="noopener noreferrer"></a></li>
                    </ul>
                    </div>
                    </div>
        </div>
        </div>
    `;
}
        
export function getAboutProjectHTML() {
    return `
        <h2>Modules</h2>
        <div class="project-modules">
            <button id="mandatory-module-btn" class="module-btn">Mandatory</button>
            <button id="web-module-btn" class="module-btn">Web</button>
            <button id="user-module-btn" class="module-btn">User-Management</button>
            <button id="gameplay-module-btn" class="module-btn">Gameplay and User Experience</button>
            <button id="ai-module-btn" class="module-btn">AI-Algo</button>
            <button id="security-module-btn" class="module-btn">Cybersecurity</button>
            <button id="devops-module-btn" class="module-btn">Devops</button>
            <button id="access-module-btn" class="module-btn">Accessibility</button>
            <button id="serverPong-module-btn" class="module-btn">Server-Side Pong</button>
        </div>
        <div id="module-info" class="module-info">
        </div>
    `;
}