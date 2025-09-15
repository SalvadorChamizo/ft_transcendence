// Register.ts
export function Register(): string {
  return `
    <h1>Register</h1>
    <form id="register-form">
      <input type="text" id="username" placeholder="Username" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    <p id="result"></p>
  `;
}

export function registerHandlers() {
  const form = document.querySelector<HTMLFormElement>("#register-form")!;
  const result = document.querySelector<HTMLParagraphElement>("#result")!;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const username = (document.querySelector<HTMLInputElement>("#username")!).value;
    const password = (document.querySelector<HTMLInputElement>("#password")!).value;

    try {
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.message) {
        result.textContent = `✅ Registered as ${username}`;
      } else {
        result.textContent = `❌ Error: ${data.error}`;
      }
    } catch (err) {
      result.textContent = "⚠️ Failed to reach server";
    }
  };
}

export async function autoRegisterUser(username: string, password: string) {
  try {
    const res = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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