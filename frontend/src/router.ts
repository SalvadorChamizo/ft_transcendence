import { Home } from "./pages/home";
import { About } from "./pages/About/about";
import { Login, TwoFALogin } from "./pages/Login/login";
import { Status, refreshStatus } from "./pages/status";
import { chatHandlers } from "./pages/Chat/chatHandlers";
import { Chat } from "./pages/Chat/chat";
// import { pongPage } from "./pages/pong"; // Eliminado
import { Settings } from "./pages/settings";
import { localPongPage, localPongHandlers } from "./pages/localPong"; // Importar handlers
import { localPowerUpPongPage, localPowerUpPongHandlers } from "./pages/localPowerUpPong"; // PowerUp mode
import { remotePongPage, remotePongHandlers } from "./pages/remotePong"; // Importar handlers
import { remoteTournamentPongPage, remoteTournamentPongHandlers } from "./pages/remoteTournamentPong"; // Importar handlers
import { Game } from "./pages/game"
import { Profile as ProfileSettings, profileHandlers as profileSettingsHandlers } from "./pages/profile";
import { ProfileView, profileViewHandlers } from "./pages/profileView";
import { ProfileStats, profileStatsHandlers } from "./pages/profileStats";
import { GameStats, gameStatsHandlers } from "./pages/gameStats";
import { Tournament } from "./pages/Tournament/tournament";
import { isLoggedIn } from "./state/authState";
import { forgotPass } from "./pages/Login/forgotPass";
import { ErrorPage } from "./pages/ErrorPage";
import { TermsPage } from "./pages/TermsPage";
import { privateRemotePongPage, privateRemotePongHandlers } from "./pages/privateRemotePong";
import { setupSidebarTabs } from "./pages/Chat/chatNotifications";

export function router(route: string): string {
    // for the roomid to be visible
    if (route.startsWith("#/remote-pong")) {
        setTimeout(remotePongHandlers, 0);
        return remotePongPage();
    }
    if (route.startsWith("#/private-remote-pong")) {
        setTimeout(privateRemotePongHandlers, 0);
        return privateRemotePongPage();
    }

    if (route.startsWith("#/remote-tournament-pong")) {
        setTimeout(remoteTournamentPongHandlers, 0);
        return remoteTournamentPongPage();
    }
    if (route.startsWith("#/profile")) {
        if (isLoggedIn()) {
            setTimeout(profileSettingsHandlers, 0);
            return ProfileSettings();
        }
        return Login();
    }
    switch (route) {
        case "#/error":
            return ErrorPage();
        case "#/terms":
            return TermsPage();
        case "#/profile":
            if (isLoggedIn()) {
                setTimeout(profileHandlers, 0);
                return Profile();
            }
            return Login();
        case route.match(/^#\/profile\/.+/)?.input:
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
                return ProfileSettings();
            }
            return Login();
        case "#/login/2fa":
            if (!isLoggedIn())
                return TwoFALogin(0);
            else
                return (ProfileSettings());
        case "#/forgot-pass":
            return forgotPass();
            case "#/status":
                setTimeout(refreshStatus, 0);
                return Status();
            case "#/chat":
                if (isLoggedIn()) {
                    setTimeout(chatHandlers, 0);
                    setTimeout(setupSidebarTabs, 0);
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
        case "#/game-stats":
            if (isLoggedIn()) {
                setTimeout(gameStatsHandlers, 0);
                return GameStats();
            }
            return Login();
        case "#/":
            return Home();
        case "":
            return Home();
        default:
            return ErrorPage();
    }
}