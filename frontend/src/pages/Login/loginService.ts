import { getElement, setText, hideElement, showElement } from "./loginDOM";
import { getAccessToken, setAccessToken, clearAuth, setTemp2FA } from "../../state/authState";
import { handleTwoFA } from "./twofa";
import { render } from "../../main";
import { TwoFALogin } from "./login";

const apiHost = `${window.location.hostname}`;

export async function login(username: string, password: string) {
    const result = getElement<HTMLParagraphElement>("#result");
    const form = getElement<HTMLFormElement>("#login-form");
    const logoutBtn = getElement<HTMLButtonElement>("#logout-btn");

       try {
      const res = await fetch(`http://${apiHost}:8080/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // include cookies
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {}; // prevent JSON parse errors for non-JSON responses
      }
 
        if (res.ok && data.accessToken) {
            setAccessToken(data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            setText(result, `✅ Logged in as ${username}`);
            hideElement(form);
            showElement(logoutBtn);
            getElement("#login-name").textContent = `${data.user.username}`;
            getElement("#login-dropdown").classList.remove("hidden");
            window.location.hash = "#/";
        } else if (res.ok && data.requires2FA) {
            setTemp2FA(data.tempToken, data.username, data.userId);
            const app = document.getElementById("app")!;
            app.innerHTML = TwoFALogin(1);
            const html = document.querySelector("html")!;
            html.style.background = "#111111";
            await handleTwoFA(data.tempToken, data.tempUsername, data.tempUserId);
        } else {
            showElement(result);
            setText(result, `${data.error || "Login failed"}`);
        }
    } catch {
        setText(result, "Failed to reach server");
    }
}

export async function logout() {
    const result = getElement<HTMLParagraphElement>("#result");
    const form = getElement<HTMLFormElement>("#login-form");
    const logoutBtn = getElement<HTMLButtonElement>("#logout-btn");

    try {
      const token = getAccessToken();
      await fetch(`http://${apiHost}:8080/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      // Cerrar el WebSocket de chat si está abierto
      try {
        // Importar el cliente WebSocket y desconectar
        const { websocketClient } = await import("../../services/websocketClient");
        websocketClient.disconnect();
      } catch (wsError) {
        console.warn("No se pudo cerrar el WebSocket de chat:", wsError);
      }
      clearAuth();
      localStorage.removeItem("user");
      showElement(form);
      hideElement(logoutBtn);
      getElement("#login-name").textContent = `Sign in / Sign up`;
      getElement("#login-dropdown").classList.add("hidden");
      setText(result, "⚠️ Logged out successfully");

      if (window.location.hash === "#/login")
        render();
      else
        window.location.hash = "#/login";
    } catch {
      setText(result, "⚠️ Failed to logout")
    }
}

export async function logoutOutsideLoginPage() {

    try {
      const token = getAccessToken();
      await fetch(`http://${apiHost}:8080/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      // Cerrar el WebSocket de chat si está abierto
      try {
        // Importar el cliente WebSocket y desconectar
        const { websocketClient } = await import("../../services/websocketClient");
        websocketClient.disconnect();
      } catch (wsError) {
        console.warn("No se pudo cerrar el WebSocket de chat:", wsError);
      }
      clearAuth();
      localStorage.removeItem("user");
      getElement("#login-name").textContent = `Sign in / Sign up`;
      getElement("#login-dropdown").classList.add("hidden");
      window.location.hash = "#/login";
    } catch {
    }
}

export async function fetchCurrentUser(accessToken: string) {
  const res = await fetch(`http://${apiHost}:8080/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok)
    throw new Error("Failed to fetch user");
  
  const data = await res.json();
  return data;
}