import { Home } from "./pages/home";
import { About } from "./pages/about";
import { Register } from "./pages/register";
import { Login, TwoFALogin } from "./pages/Login/login";
import { Health, healthHandlers } from "./pages/health";
import { Ping } from "./pages/ping";
import { Chat, chatHandlers } from "./pages/chat";
// import { pongPage } from "./pages/pong"; // Eliminado
import { Settings } from "./pages/settings";
import { localPongPage, localPongHandlers } from "./pages/localPong"; // Importar handlers
import { remotePongPage, remotePongHandlers } from "./pages/remotePong"; // Importar handlers
import { Game } from "./pages/game"
import { Tournament } from "./pages/Tournament/tournament";

export function router(route: string): string {
    switch (route) {
        case "#/about":
            return About();
        case "#/register":
            return Register();
        case "#/login":
            return Login();
        case "#/login/2fa":
            return TwoFALogin();
        case "#/health":
            setTimeout(healthHandlers, 0);
            return Health();
        case "#/ping":
            return Ping();
        case "#/chat":
            setTimeout(chatHandlers, 0);
            return Chat();
        case "#/pong/local":
            setTimeout(localPongHandlers, 0); // Añadir llamada a handlers
            return localPongPage();
        case "#/pong/remote":
            setTimeout(remotePongHandlers, 0); // Añadir llamada a handlers
            return remotePongPage();
        case "#/settings":
            return Settings();
        case "#/game":
            return Game();
        case "#/tournament":
            return Tournament();
        case "#/":
        default:
            return Home();
    }
}