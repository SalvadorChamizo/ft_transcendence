import { router } from "./router";
import { registerHandlers, autoRegisterUser } from "./pages/register"
import { loginHandlers, autoLoginUser } from "./pages/login"
import { homeText } from "./pages/home"
import { refreshAccessToken } from "./state/authState"

async function render() {

    await refreshAccessToken();

    const app = document.getElementById("app")!;
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
        autoRegisterUser("t", "t"); // auto register for testing purposes
        registerHandlers();
    }
    if (location.hash === "#/login")
    {
        autoLoginUser("t", "t"); // auto login for testing purposes
        loginHandlers();
    }
    if (location.hash === "" || location.hash === "#/" || location.hash === "#/home") {
        import("./pages/home").then(mod => mod.handleStars());
    }
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);