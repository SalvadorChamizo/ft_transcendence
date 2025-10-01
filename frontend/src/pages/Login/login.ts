import { getAccessToken, setAccessToken, clearAuth, isLoggedIn } from "../../state/authState"
import { getLoginHtml, TwoFAFormHtml } from "./loginTemplate"
import { setupLoginHandlers } from "./loginHandlers";

export function Login(): string {
  return getLoginHtml();
}

export function TwoFALogin(): string {
  return TwoFAFormHtml();
}

export function loginHandlers(): void {
  setupLoginHandlers();
  setupLoginTabs();
}

/*export function loginHandlers() {
  setupLoginTabs();
  const form = document.querySelector<HTMLFormElement>("#login-form")!;
  const result = document.querySelector<HTMLParagraphElement>("#result")!;
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
  result.style.display = "none";

  // Check if user is already logged in
  if (isLoggedIn()) {
    result.style.display = "block";
    result.textContent = "✅ You are already logged in";
    form.style.display = "none"; // hide login form
    logoutBtn.style.display = "block"; // show logout button
    
    const userStr = localStorage.getItem("user");

    if (userStr) {
      const user = JSON.parse(userStr) as { id: number; username: string };
      document.querySelector("#twofa-section")!.innerHTML = Enable2FA();
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
        result.style.display = "block";
        result.textContent = `✅ Logged in as ${username}`;
        form.style.display = "none";
        logoutBtn.style.display = "block";
        } else if (res.ok && data.requires2FA) {
            const app = document.getElementById("app")!;
            app.innerHTML = TwoFAForm();

          const qrDiv = document.querySelector<HTMLDivElement>(".twofa-qrcode")!;
          console.log(data);
          try {
            const res = await fetch("http://localhost:8080/auth/generate-qr", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${data.tempToken}`
              },
              body: JSON.stringify({ username: data.username, userId: data.userId }),
              });
  
              const qr = await res.json();
              if (res.ok && qr) {
                qrDiv.innerHTML = `<img src="${qr.qr}" alt="QR Code" />`;
              } else {
                qrDiv.innerHTML = "❌ Failed to generate QR code";
              }
            } catch {
              console.error("Failed to reach server");
              qrDiv.innerHTML = "❌ Failed to generate QR code";
            }

            const twofaForm = document.querySelector<HTMLFormElement>("#twofa-form")!;
            const twofaResult = document.querySelector<HTMLParagraphElement>("#twofa-result")!;
            const twofaInput = document.querySelector<HTMLInputElement>("#twofa-code")!;

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
              //twofaInput.style.display = "none";
              //logoutBtn.style.display = "block";
              setTimeout(() => {
                window.location.href = "#/health";
              }, 2000);
              const body = document.querySelector("body")!;
              body.style.background = "none";
              //const html = document.querySelector("html")!;
              //html.style.background = "none";
              return ;
            }
            else {
              twofaResult.textContent = "❌ Invalid 2FA code"
            }
            console.log("Nothing happens");
          }
      } else {
        result.style.display = "block";
        result.textContent = `❌ ${data.error || "Login failed"}`;
      }
    } catch (err) {
      result.style.display = "block";    
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
      result.style.display = "block";
      result.textContent = "⚠️ Logged out successfully";
      form.style.display = "block";
      logoutBtn.style.display = "none";
    } catch {
      result.style.display = "block";
      result.textContent = "⚠️ Failed to logout";
    }
  };
}*/


export async function autoLoginUser(username: string, password: string) {
    setupLoginTabs();
    const form = document.querySelector<HTMLFormElement>("#login-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#result")!;
    const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn")!;
    
    // Check if user is already logged in
    if (isLoggedIn()) {
      result.style.display = "block";
      result.textContent = "✅ You are already logged in";
      form.style.display = "none"; // hide login form
      logoutBtn.style.display = "block"; // show logout button
      return ;
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
        result.style.display = "block";
        result.textContent = `✅ Logged in as ${username}`;
        form.style.display = "none";
        logoutBtn.style.display = "block";
      } else if (res.ok && data.requires2FA) {
          document.body.innerHTML = TwoFAForm();

          const qrDiv = document.querySelector<HTMLDivElement>(".twofa-qrcode")!;
          const res = await fetch("http://localhost:8080/auth/generate-qr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.tempToken}`
            },
            body: JSON.stringify({ username: data.username, userId: data.userId }),
            });

            const qr = await res.json();
            if (qr) {
              qrDiv.innerHTML = `<img src="${qr}" alt="QR Code" />`;
            }

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
      result.style.display = "block";
      result.textContent = "⚠️ Logged out successfully";
      form.style.display = "block";
      logoutBtn.style.display = "none";
    } catch {
      result.style.display = "block";
      result.textContent = "⚠️ Failed to logout";
    }
  };
  };

export async function fetchQRCode(userId: number, username: string, token: string): Promise<string | null> {
    try {
        const res = await fetch("http://localhost:8080/auth/generate-qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ username, userId }),
          });

          const data = await res.json();

        if (res.ok && data.qr) {
          return data.qr;
        }
        } catch {
          console.error("Failed to reach server");
        }
    return null;
  }

  export function TwoFAForm(): string {
    const body = document.querySelector("body")!;
    body.style.background = "black";
    body.style.minHeight = "100vh";
    const html = document.querySelector("html")!;
    html.style.background = "black";

    return `
    <div class="twofa-body">
        <h1 id="2fa-title">Enable two-factor authentication (2FA)</h1>
        <div class="twofa-block">
            <div>
                <h2>Setup authenticator app</h2>
                <p id="twofa-paragraph">Authenticator apps and browser extensions like 1Password, Authy, Microsoft Authenticator, etc.
                    generate one-time passwords that are used as a second factor to verify your identity when prompted 
                    during sign-in.
                </p>
            </div>
            <div>
                <h3 id="twofa-h3-title">Scan the QR code</h3>
                <p id="twofa-paragraph">Use an authenticator app or browser extension to scan.</p>
                <div class="twofa-qrcode"></div>
            </div>
            <div>
                <h3 id="twofa-h3-title">Verify the code from the app</h3>
                <form id="twofa-form">
                    <input type="text" id="twofa-code" placeholder="6-digit code">
                    <hr style="width: 100%; border: 1px solid #5a5f66;">
                    <div id="twofa-buttons">
                    <button type="button" id="twofa-cancel" onclick="window.location.href='#/login'">Cancel</button>
                        <button id="twofa-submit" type="submit">Verify</button>
                        <p id="twofa-result"></p>
                    </div>
                    </form>
            </div>
        </div>
    </div>
      `;
  }

  export function Enable2FA(): string {
    return `
      <h2 style="color:white">Two-Factor Authentication</h2>
      <button id="enable-2fa-btn">Enable 2FA</button>
      <button id="show-qr-btn" style="display:none; margin-left:1rem;">Generate QR</button>

      <div id="qr-container" style="margin-top:1rem;"></div>
      <form id="verify-2fa-form" style="display:none; margin-top:1rem;">
        <input type="text" id="verify-2fa-code" placeholder="Enter 6-digit code" required />
        <button type="submit">Verify</button>
      </form>
      <p id="enable-2fa-result"></p>
      `;
  }

  export function enable2FAHandlers(userId: number, username: string) {
    const enableBtn = document.querySelector<HTMLButtonElement>("#enable-2fa-btn")!;
    const showQRBtn = document.querySelector<HTMLButtonElement>("#show-qr-btn")!;
    const qrContainer = document.querySelector<HTMLDivElement>("#qr-container")!;
    const form = document.querySelector<HTMLFormElement>("#verify-2fa-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#enable-2fa-result")!;

    enableBtn.onclick = async () => {
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

         if (res.ok) {
          result.textContent = "2FA enabled. Now click 'Generate QR' to continue."
          showQRBtn.style.display = "inline-block";
          enableBtn.disabled = true;
         } else {
          result.textContent = `${data.error || "Failed to enable 2FA"}`;
         }
      } catch {
        result.textContent = "Failed to reach server";
      }
    };

         showQRBtn.onclick = async () => {
          try {
            const token = getAccessToken();
            const res = await fetch("http://localhost:8080/auth/generate-qr", {
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
              result.textContent = "Scan the QR in your authentication app, then verify the code below.";
            } else {
              result.textContent = `${data.error || "Failed to generate the QR Code."}`;
            }
          } catch {
            result.textContent = "Failed to reach server";
          }
        };

    form.onsubmit = async (e) => {
      e.preventDefault();

      const code = (document.querySelector<HTMLInputElement>("#verify-2fa-code")!).value;

      try {
        const res = await fetch("http://localhost:8080/auth/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

export function setupLoginTabs(): void {
  const tabLinks = document.querySelectorAll(".login-nav-link");
  const tabPanes = document.querySelectorAll(".login-tab-panel");
  const tabLinkAccount = document.querySelectorAll(".login-nav-link-account");
  const tabLinkPassword = document.querySelectorAll(".login-nav-link-password");

  tabLinks.forEach(link => {
    link.addEventListener("click", function (this: HTMLElement, e) {
      e.preventDefault();

      const target = this.getAttribute("data-tab");
      if (!target) return;

      tabLinks.forEach(link => link.classList.remove("active"));
      tabPanes.forEach(pane => pane.classList.remove("active"));
      tabLinkAccount.forEach(account => account.classList.remove("active"));
      tabLinkPassword.forEach(pass => pass.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(target)?.classList.add("active");

      if (target === "login-tab-panel") {
        tabLinkPassword.forEach(pass => pass.classList.add("active"));
      } else if (target === "signup-tab-panel") {
        tabLinkAccount.forEach(account => account.classList.add("active"));
      }
    });
  });

  tabLinkAccount.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Reset all
      tabLinks.forEach(link => link.classList.remove("active"));
      tabPanes.forEach(pane => pane.classList.remove("active"));
      tabLinkAccount.forEach(account => account.classList.remove("active"));
      tabLinkPassword.forEach(pass => pass.classList.remove("active"));

      // Activate Login tab
      const loginNavLink = document.querySelector('.login-nav-link[data-tab="login-tab-panel"]');
      loginNavLink?.classList.add("active");

      document.getElementById("login-tab-panel")?.classList.add("active");
      tabLinkPassword.forEach(pass => pass.classList.add("active"));
    });
  });
}
