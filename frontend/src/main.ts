import { router } from "./router";
import { registerHandlers, autoRegisterUser } from "./pages/register"
import { loginHandlers, autoLoginUser } from "./pages/Login/login"
import { homeText } from "./pages/home"
import { getAccessToken, refreshAccessToken, tempToken, tempUserId, tempUsername } from "./state/authState"
import { localPongPage, localPongHandlers } from "./pages/localPong";
import { localPowerUpPongPage, localPowerUpPongHandlers } from "./pages/localPowerUpPong";
import { remotePongPage, remotePongHandlers } from "./pages/remotePong";
import { handleTwoFA } from "./pages/Login/twofa";
import { handleOAuthErrors, userLoggedIn } from "./pages/Login/loginHandlers";
import { fetchCurrentUser } from "./pages/Login/loginService";
import { tournamentHandlers } from "./pages/Tournament/tournamentHandles";
import { aboutHandlers } from "./pages/About/about";
import { forgotPassHandle } from "./pages/Login/forgotPass";
import { websocketClient } from "./services/websocketClient";
import { setOnlineUsers, setUserOnline, setUserOffline } from "./state/presenceState";
import { getUserIdFromToken } from "./state/authState";

// Initialize WebSocket connection and presence tracking
let wsInitialized = false;

function initializeWebSocketPresence() {
    if (wsInitialized) return;
    
    const accessToken = getAccessToken();
    const userId = getUserIdFromToken();
    
    if (!accessToken || !userId) return;
    
    // Connect to WebSocket
    websocketClient.connect(userId).then(() => {
        wsInitialized = true;
    }).catch(error => {
    });
    
    // Listen for presence events
    websocketClient.onMessage((message) => {
        switch (message.type) {
            case 'connected_users_list':
                // Initial list of online users
                if (message.data && Array.isArray(message.data)) {
                    setOnlineUsers(message.data);
                }
                break;
                
            case 'user_connected':
                // User came online
                if (message.userId) {
                    setUserOnline(message.userId);
                }
                break;
                
            case 'user_disconnected':
                // User went offline
                if (message.userId) {
                    setUserOffline(message.userId);
                }
                break;
        }
    });
}

export async function render() {

    await refreshAccessToken();

    const accessToken = getAccessToken();
    if (accessToken) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
        const profileLink = document.querySelector('a[href="#/profile"]') as HTMLAnchorElement;
        if (profileLink && user?.username)
            profileLink.href = `#/profile/${user?.username}`;
        }
        
        // Initialize WebSocket for presence tracking
        initializeWebSocketPresence();
    }
    userLoggedIn();

    const app = document.getElementById("app")!;
    const html = document.querySelector("html")!;
    html.style.background = "none";
    app.innerHTML = router(window.location.hash);
    const header = document.getElementById("header")!;
    header.className = "";
    const home = document.getElementById("home")!;
    home.innerHTML = "";
    if (location.hash === "" || location.hash === "#/" || location.hash === "#/home")
    {
        const home = document.getElementById("home")!;
        home.innerHTML = homeText();
        const header = document.getElementById("header")!;
        header.className = "header-home";
    }
    if (location.hash === "#/login")
        {
            const html = document.querySelector("html")!;
            html.style.background = "#111111";
            //autoLoginUser("t", "t"); // auto login for testing purposes
            loginHandlers();
            registerHandlers();
            handleOAuthErrors();
            const accessToken = getAccessToken();
            if (accessToken) {
                const user = await fetchCurrentUser(accessToken);
                localStorage.setItem("user", JSON.stringify(user));
            }
    }
    if (location.hash === "#/login/2fa")
    {
        const html = document.querySelector("html")!;
        html.style.background = "#111111";
        await handleTwoFA(tempToken, tempUsername, tempUserId);
	}
    
    if (location.hash === "#/pong/local/powerup") {
        localPowerUpPongHandlers();
    }
    if (location.hash === "#/tournament") {
        tournamentHandlers();
    }
    if (location.hash === "#/about") {
        aboutHandlers();
    }
    if (location.hash === "#/forgot-pass") {
        forgotPassHandle();
    }
    if (location.hash === "" || location.hash === "#/" || location.hash === "#/home") {
        import("./pages/home").then(mod => mod.handleStars());
    }
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);
