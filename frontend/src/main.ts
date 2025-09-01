import { router } from "./router";
import { registerHandlers } from "./pages/register"
import { loginHandlers } from "./pages/login"

function render() {
    const app = document.getElementById("app")!;
    app.innerHTML = router(window.location.hash);

    if (location.hash === "#/register")
        registerHandlers();
    if (location.hash === "#/login")
        loginHandlers();
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);