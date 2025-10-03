export function Register(): string {
  return `
    <h1>Register</h1>
    <form id="register-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="text" id="username" placeholder="Username" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    <p id="result"></p>
  `;
}

export function registerHandlers() {

  setTimeout(() => {
    const form = document.querySelector<HTMLFormElement>("#signup-form")!;
    const result = document.querySelector<HTMLParagraphElement>("#result")!;
  
    form.onsubmit = async (e) => {
      e.preventDefault();
  
      const username = (document.querySelector<HTMLInputElement>("#signup-username")!).value;
      const password = (document.querySelector<HTMLInputElement>("#signup-password")!).value;
      const email = (document.querySelector<HTMLInputElement>("#email")!).value;
  
      try {
        const res = await fetch("http://localhost:8080/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, email }),
        });
  
        const data = await res.json();
        result.style.display = "block";
        if (res.ok && data.message) {
          result.textContent = `✅ Registered as ${username}`;
          setTimeout(() => {
            const loginNavLink = document.querySelector<HTMLElement>('.login-nav-link[data-tab="login-tab-panel"]');
          if  (loginNavLink) loginNavLink.click();
          }, 2000)
        } else {
          result.textContent = `❌ Error: ${data.error}`;
        }
      } catch (err) {
        result.textContent = "⚠️ Failed to reach server";
      }
      console.log("Result element:", result);
    };

  }, 0);
}

export async function autoRegisterUser(username: string, password: string, email: string) {
  try {
    const res = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await res.json();
    if (data.message) {
      console.log(`✅ Registered as ${username}`);
    } else if (data.error && data.error.includes("already exists")) {
      console.log(`ℹ️ User ${username} already exists`);
    } else {
      console.log(`❌ Error: ${data.error}`);
    }
  } catch (err) {
    console.log("⚠️ Failed to reach server");
  }
}