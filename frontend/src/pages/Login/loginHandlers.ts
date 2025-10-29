import { login, logout, logoutOutsideLoginPage,fetchCurrentUser } from "./loginService"
import { getAccessToken, isLoggedIn, refreshAccessToken } from "../../state/authState";
import { hideElement, showElement, setText, getElement } from "./loginDOM";
import { enable2FAHandlers } from "./login";
import { Enable2FAHtml, forgotPassHTML, getLoginTabHTML } from "./loginTemplate";

const apiHost = `${window.location.hostname}`;

export function userLoggedIn() {
    if (isLoggedIn()) {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr!);
      const username = user.user ? user.user.username : user.username;
      getElement("#login-name").textContent = `${username}`;
      getElement("#login-dropdown").classList.remove("hidden");
      const logoutBtn = document.querySelector<HTMLAnchorElement>("#logout-btn")!;
      logoutBtn.onclick = logoutOutsideLoginPage;
    }
}

export function setupLoginHandlers() {
    const form = document.querySelector<HTMLFormElement>("#login-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#result")!;
    const logoutBtn = document.querySelector<HTMLAnchorElement>("#logout-btn")!;
    const forgotPassBtn = document.getElementById("forgot-pass-btn");

    if (window.location.hash === "#/login")
      logoutBtn.onclick = logout;
    else
      logoutBtn.onclick = logoutOutsideLoginPage;

    
    if (isLoggedIn()) {
      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr!);
      const actualUser = user.user || user;
      showElement(result);
      setText(result, "✅ You are already logged in");
      hideElement(form);
      getElement("#twofa-section").innerHTML = Enable2FAHtml();
      enable2FAHandlers(actualUser.id, actualUser.username);
      return ;
    }
    
    const fortyTwoBtn = document.querySelector<HTMLButtonElement>("#fortyTwoLoginButton");
    fortyTwoBtn?.addEventListener("click", () => {
      window.location.href = `http://${apiHost}:8080/auth/42/login`;
    });
    
    const googleBtn = document.querySelector<HTMLButtonElement>("#googleLoginButton");
    googleBtn?.addEventListener("click", async () => {
      window.location.href = `http://${apiHost}:8080/auth/google/login`;

      await refreshAccessToken();
      console.log("Entra aquí");
      const accessToken = getAccessToken();
      console.log(`Access token = ${accessToken}`);
      if (accessToken) {
        console.log("Pero aquí no entra");
        const user = await fetchCurrentUser(accessToken);
        localStorage.setItem("user", JSON.stringify(user));
      }
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
  
      const username = (document.querySelector<HTMLInputElement>("#username")!).value;
      const password = (document.querySelector<HTMLInputElement>("#password")!).value;

      await login(username, password);
    };

    forgotPassBtn?.addEventListener("click", () => {
      window.location.hash = "#/forgot-pass";
    })
}

export function handleOAuthErrors(): void {
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get("error");

  if (error) {
    let message = "An unknown error occurred during login.";

    switch (error) {
      case "access_denied":
        message = "You cancelled the login or denied access.";
        break;
      case "missing_code":
        message = "Login failed: missing authorization code.";
        break;
      case "oauth_failed":
        message = "Something went wrong during the login process";
        break;
    }

    alert(message);

    const newUrl = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);
  }
}