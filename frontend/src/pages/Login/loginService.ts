import { getElement, setText, hideElement, showElement } from "./loginDOM";
import { getAccessToken, setAccessToken, clearAuth, setTemp2FA } from "../../state/authState";
import { handleTwoFA } from "./twofa";
import { render } from "../../main";

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

        const data = await res.json();
 
        if (res.ok && data.accessToken) {
            setAccessToken(data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            setText(result, `✅ Logged in as ${username}`);
            hideElement(form);
            showElement(logoutBtn);
        } else if (res.ok && data.requires2FA) {
            setTemp2FA(data.tempToken, data.username, data.userId);
            location.hash = "#/login/2fa";
        } else {
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
      clearAuth();
      localStorage.removeItem("user");
      showElement(form);
      hideElement(logoutBtn);
      setText(result, "⚠️ Logged out successfully");

      if (window.location.hash === "#/login")
        render();
      else
        window.location.hash = "#/login";
    } catch {
      setText(result, "⚠️ Failed to logout")
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
  
  const data = res.json();
  return data;
}