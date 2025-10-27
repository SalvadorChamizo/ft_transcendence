import { Home } from "./pages/home";
import { About } from "./pages/About/about";
import { Login, TwoFALogin } from "./pages/Login/login";
import { Health, healthHandlers } from "./pages/health";
import { Ping } from "./pages/ping";
import { Chat, chatHandlers } from "./pages/chat";
// import { pongPage } from "./pages/pong"; // Eliminado
import { Settings } from "./pages/settings";
import { localPongPage, localPongHandlers } from "./pages/localPong"; // Importar handlers
import { localPowerUpPongPage, localPowerUpPongHandlers } from "./pages/localPowerUpPong"; // PowerUp mode
import { remotePongPage, remotePongHandlers } from "./pages/remotePong"; // Importar handlers
import { Game } from "./pages/game"
import { Profile, profileHandlers } from "./pages/profile";
import { Tournament } from "./pages/Tournament/tournament";
import { isLoggedIn } from "./state/authState";
import { forgotPass } from "./pages/Login/forgotPass";

export function router(route: string): string {
    const cleanRoute = route.split('?')[0];
    switch (cleanRoute) {
        case "#/profile":
            if (isLoggedIn()) {
                setTimeout(profileHandlers, 0);
                return Profile();
            }
            return Login();
        case "#/about":
            return About();
        case "#/login":
            if (isLoggedIn()) {
                window.location.hash = "#/profile";
                return Profile();
            }
            return Login();
        case "#/login/2fa":
            if (isLoggedIn()) {
                return TwoFALogin();
            }
            return Login();
        case "#/forgot-pass":
            return forgotPass();
        case "#/health":
            setTimeout(healthHandlers, 0);
            return Health();
            case "#/ping":
                return Ping();
            case "#/chat":
                if (isLoggedIn()) {
                    setTimeout(chatHandlers, 0);
                    return Chat();
                }
                else {
                    window.location.hash = "#/login";
                    return Login();
                }
        case "#/pong/local":
            setTimeout(localPongHandlers, 0);
            return localPongPage();
        case "#/pong/local/powerup":
            setTimeout(localPowerUpPongHandlers, 0);
            return localPowerUpPongPage();
        case "#/pong/remote":
                if (isLoggedIn()) {
                    setTimeout(remotePongHandlers, 0);
                    return remotePongPage();
                }
                else {
                    window.location.hash = "#/login";
                    return Login();
                }
        case "#/settings":
            if (isLoggedIn()) {
                return Settings();
            }
            return Login();
        case "#/game":
            return Game();
        case "#/tournament":
            return Tournament();
        case "#/":
        default:
            return Home();
    }
}