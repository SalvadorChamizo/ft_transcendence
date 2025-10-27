const apiHost = `${window.location.hostname}`;

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
        const res = await fetch(`http://${apiHost}:8080/auth/register`, {
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
    };

  }, 0);
}