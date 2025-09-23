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
    
    const userStr = localStorage.getItem("user");

    if (userStr) {
      const user = JSON.parse(userStr) as { id: number; username: string };
      document.body.innerHTML += Enable2FA();
      enable2FAHandlers(user.id, user.username);
    }
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
        const { id, username } = data.user;
        localStorage.setItem("user", JSON.stringify({ id, username }));
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


export async function autoLoginUser(username: string, password: string) {
    
    const form = document.querySelector<HTMLFormElement>("#login-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#result")!;
    const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
    
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
      } else if (res.ok && data.requires2FA) {
          document.body.innerHTML = TwoFAForm(data.userId);

          const twofaForm = document.querySelector<HTMLFormElement>("#twofa-form")!;
          const twofaResult = document.querySelector<HTMLParagraphElement>("#twofa-result")!;

          twofaForm.onsubmit = async (e) => {
            e.preventDefault();

            const code = (document.querySelector<HTMLInputElement>("#twofa-code")!).value;

            const verifyRes = await fetch("http://localhost:8080/auth/verify-2fa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.userId, code }),
              credentials: "include",
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.accessToken) {
              setAccessToken(verifyData.accessToken);
              twofaResult.textContent = "✅ 2FA verified, loggen in!";
              twofaForm.style.display = "none";
              logoutBtn.style.display = "block"
            }
            else {
              twofaResult.textContent = "❌ Invalid 2FA code"
            }
          }
      } else {
        result.textContent = `❌ ${data.error || "Login failed"}`;
      }
    } catch (err) {
      result.textContent = "⚠️ Failed to reach server";
    }
  };

  export function TwoFAForm(userId: number): string {
    return `
      <h2>Enter 2FA Code</h2>
      <form id="twofa-form">
        <input type="text" id="twofa-code" placeholder="6-digit code">
        <button type="submit">Verify</button>
      </form>
      <p id="twofa-result"></p>
      `;
  }

  export function Enable2FA(): string {
    return `
      <h2>Enable 2FA</h2>
      <button id="enable-2fa-btn">Generate QR</button>
      <div id="qr-container" style="margin-top:1rem;"></div>
      <form id="verify-2fa-form" style="display:none; margin-top:1rem;">
        <input type="text" id="verify-2fa-code" placeholder="Enter 6-digit code" required />
        <button type="submit">Verify</button>
      </form>
      <p id="enable-2fa-result"></p>
      `;
  }

  export function enable2FAHandlers(userId: number, username: string) {
    const btn = document.querySelector<HTMLButtonElement>("#enable-2fa-btn")!;
    const qrContainer = document.querySelector<HTMLDivElement>("#qr-container")!;
    const form = document.querySelector<HTMLFormElement>("#verify-2fa-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#enable-2fa-result")!;

    btn.onclick = async () => {
      try {
        const token = getAccessToken();
        const res = await fetch("http://localhost:8080/auth/enable-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ username, userId }),
         });

         const data = await res.json();

         if (res.ok && data.qr) {
          qrContainer.innerHTML = `<img src="${data.qr}" alt="QR Code" />`;
          form.style.display = "block";
          result.textContent = "Scan the QR in Google Authenticator, then enter the code below";
         } else {
          result.textContent = `${data.error || "Failed to enable 2FA"}`;
         }
      } catch (err) {
          result.textContent = "Failed to reach server";
      }
    };

    form.onsubmit = async (e) => {
      e.preventDefault();

      const code = (document.querySelector<HTMLInputElement>("#verify-2fa-code")!).value;

      try {
        const res = await fetch("http://localhost:8080/auth/verify-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, code }),
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok && data.accessToken) {
          setAccessToken(data.accessToken);
          result.textContent = "2FA enabled and verified!";
          form.style.display = "none";
        } else {
          result.textContent = `${data.error || "Invalid code"}`;
        }
      } catch (err) {
        result.textContent = "Failed to reach server";
      }
    };
  }