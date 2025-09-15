import { getAccessToken, setAccessToken, clearAuth, isLoggedIn } from "../state/authState"

export function Login(): string {
  return `
    <h1>Login</h1>
    <form id="login-form">
      <input type="text" id="username" placeholder="Username" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p id="result"></p>
    <button id="logout-btn" style="display:none; margin-top:1rem;">Logout</button>
  `;
}

export function loginHandlers() {
  const form = document.querySelector<HTMLFormElement>("#login-form")!;
  const result = document.querySelector<HTMLParagraphElement>("#result")!;
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;

  // Check if user is already logged in
  if (isLoggedIn()) {
    result.textContent = "✅ You are already logged in";
    form.style.display = "none"; // hide login form
    logoutBtn.style.display = "block"; // show logout button
  }

  form.onsubmit = async (e) => {
    e.preventDefault();

    const username = (document.querySelector<HTMLInputElement>("#username")!).value;
    const password = (document.querySelector<HTMLInputElement>("#password")!).value;

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // include cookies
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        setAccessToken(data.accessToken);
        result.textContent = `✅ Logged in as ${username}`;
        form.style.display = "none";
        logoutBtn.style.display = "block";
      } else {
        result.textContent = `❌ ${data.error || "Login failed"}`;
      }
    } catch (err) {
      result.textContent = "⚠️ Failed to reach server";
    }
  };

  logoutBtn.onclick = async () => {
    try {
      const token = getAccessToken();
      await fetch("http://localhost:8080/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      clearAuth();
      result.textContent = "⚠️ Logged out successfully";
      form.style.display = "block";
      logoutBtn.style.display = "none";
    } catch {
      result.textContent = "⚠️ Failed to logout";
    }
  };
}

  const form = document.querySelector<HTMLFormElement>("#login-form")!;
  const result = document.querySelector<HTMLParagraphElement>("#result")!;
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;

  export async function autoLoginUser(username: string, password: string) {
    // Check if user is already logged in
    if (isLoggedIn()) {
      result.textContent = "✅ You are already logged in";
      form.style.display = "none"; // hide login form
      logoutBtn.style.display = "block"; // show logout button
    }
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // include cookies
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        setAccessToken(data.accessToken);
        result.textContent = `✅ Logged in as ${username}`;
        form.style.display = "none";
        logoutBtn.style.display = "block";
      } else {
        result.textContent = `❌ ${data.error || "Login failed"}`;
      }
    } catch (err) {
      result.textContent = "⚠️ Failed to reach server";
    }
  };