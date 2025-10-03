import { Home } from "./pages/home";
import { About } from "./pages/about";
import { Register } from "./pages/register";
import { Login, TwoFALogin } from "./pages/Login/login";
import { Health, healthHandlers } from "./pages/health";
import { Ping } from "./pages/ping";
import { Chat, chatHandlers } from "./pages/chat";
import { pongPage } from "./pages/pong";

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
		case "#/pong":
			return pongPage();
        case "#/":
        default:
            return Home();
    }
}