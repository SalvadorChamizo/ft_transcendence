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
      result.style.display = "block";

      if (!validateEmail(email)) {
        result.textContent = "Please enter a valid email address.";
        return ;
      }

      if (!validateUsername(username)) {
        result.textContent = "Username must be at least 3 characters (letters/numbers only).";
        return ;
      }

      if (!validatePassword(password)) {
        result.textContent = "Password must be at least 8 characters and include upper, lower, number, and symbol.";
        return ;
      }

      try {
        const res = await fetch(`https://${apiHost}:8443/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, email }),
        });
        
        const data = await res.json();
        if (res.ok && data.message) {
          result.textContent = `✅ Registered as ${username}`;
          setTimeout(() => {
            const loginNavLink = document.querySelector<HTMLElement>('.login-nav-link[data-tab="login-tab-panel"]');
          if  (loginNavLink) loginNavLink.click();
          }, 2000)
        } else {
          let errorMessage = data.error;

          try {
            const parsed = JSON.parse(data.error);
            if (parsed && parsed.error) {
              errorMessage = parsed.error;
            }
          } catch {

          }
          result.textContent = `❌ Error: ${errorMessage}`;
        }
      } catch (err) {
        result.textContent = "⚠️ Failed to reach server";
      }
    };

  }, 0);
}

function validateEmail(email: string): boolean {
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(email);
}

function validateUsername(username: string): boolean {
  // Minimum 3 chars and Max 10 char
  const re = /^().{3,10}$/;
  return re.test(username);
}

function validatePassword(password: string): boolean {
  // Minimum 6 chars, Max 12 char, upper. lower, number, special char
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).{6,12}$/;
  return re.test(password);
}