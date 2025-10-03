import { login, logout } from "./loginService"
import { isLoggedIn } from "../../state/authState";
import { hideElement, showElement, setText, getElement } from "./loginDOM";
import { enable2FAHandlers } from "./login";
import { Enable2FAHtml } from "./loginTemplate";

export function setupLoginHandlers() {
    const form = document.querySelector<HTMLFormElement>("#login-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#result")!;
    const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
    
    logoutBtn.onclick = logout;

    
    if (isLoggedIn()) {
      const user = JSON.parse(localStorage.getItem("user")!);
      setText(result, "✅ You are already logged in");
      getElement("#twofa-section").innerHTML = Enable2FAHtml();
      hideElement(form);
      showElement(logoutBtn);
      enable2FAHandlers(user.id, user.username);
      return ;
    }
    
    const fortyTwoBtn = document.querySelector<HTMLButtonElement>("#fortyTwoLoginButton");
    fortyTwoBtn?.addEventListener("click", () => {
      window.location.href = "http://localhost:8080/auth/42/login";
    });
    
    const googleBtn = document.querySelector<HTMLButtonElement>("#googleLoginButton");
    googleBtn?.addEventListener("click", () => {
      window.location.href = "http://localhost:8080/auth/google/login";
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
  
      const username = (document.querySelector<HTMLInputElement>("#username")!).value;
      const password = (document.querySelector<HTMLInputElement>("#password")!).value;

      await login(username, password);
    };

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