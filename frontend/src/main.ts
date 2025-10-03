import { router } from "./router";
import { registerHandlers, autoRegisterUser } from "./pages/register"
import { loginHandlers, autoLoginUser } from "./pages/Login/login"
import { homeText } from "./pages/home"
import { getAccessToken, refreshAccessToken, tempToken, tempUserId, tempUsername } from "./state/authState"
import { pongHandlers } from "./pages/pong";
import { handleTwoFA } from "./pages/Login/twofa";
import { handleOAuthErrors } from "./pages/Login/loginHandlers";
import { fetchCurrentUser } from "./pages/Login/loginService";
export async function render() {

    await refreshAccessToken();

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
            const accessToken = getAccessToken();
            if (accessToken) {
                const user = fetchCurrentUser(accessToken);
                localStorage.setItem("user", JSON.stringify(user));
            }
            loginHandlers();
            registerHandlers();
            handleOAuthErrors();
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
