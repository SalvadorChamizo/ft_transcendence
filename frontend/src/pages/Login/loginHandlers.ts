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
    })
    
    form.onsubmit = async (e) => {
      e.preventDefault();
  
      const username = (document.querySelector<HTMLInputElement>("#username")!).value;
      const password = (document.querySelector<HTMLInputElement>("#password")!).value;

      await login(username, password);
    };

}
