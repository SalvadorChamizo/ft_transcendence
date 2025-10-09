import { router } from "./router";
import { registerHandlers, autoRegisterUser } from "./pages/register"
import { loginHandlers, autoLoginUser } from "./pages/Login/login"
import { homeText } from "./pages/home"
import { getAccessToken, refreshAccessToken, tempToken, tempUserId, tempUsername } from "./state/authState"
import { localPongPage, localPongHandlers } from "./pages/localPong";
import { remotePongPage, remotePongHandlers } from "./pages/remotePong";
import { handleTwoFA } from "./pages/Login/twofa";
import { handleOAuthErrors, userLoggedIn } from "./pages/Login/loginHandlers";
import { fetchCurrentUser } from "./pages/Login/loginService";
export async function render() {

    await refreshAccessToken();

    const accessToken = getAccessToken();
    if (accessToken) {
        const user = await fetchCurrentUser(accessToken);
        localStorage.setItem("user", JSON.stringify(user));
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

    if (location.hash === "#/register")
    {
        autoRegisterUser("t", "t", "t@gmail.com"); // auto register for testing purposes
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
	if (location.hash === "#/pong") {
        pongHandlers();
    }
    if (location.hash === "" || location.hash === "#/" || location.hash === "#/home") {
        import("./pages/home").then(mod => mod.handleStars());
    }
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);
