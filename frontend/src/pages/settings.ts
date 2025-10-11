import { getAccessToken } from "../state/authState";

export function Settings() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return `
      <div class="settings-actions">
        <h1>Settings</h1>
        <p>Please log or register in to view your settings.</p>
      </div>
    `;
  }
  setTimeout(() => settingsHandlers(accessToken), 0); // Pasar el token como parámetro
  return `
      <div class="settings-actions">
        <h1>Settings</h1>
        <form id="settings-form">
          <p id="username"></p>
          <p id="useremail"></p>
        </form>
      </div>
  `;
}

export function settingsHandlers(accessToken: string) {

  setTimeout(() => { //Defines la funcion, no se ejecuta aun
    const form = document.querySelector<HTMLFormElement>("#settings-form")!;
    const usernameField = document.querySelector<HTMLParagraphElement>("#username")!;
    const emailField = document.querySelector<HTMLParagraphElement>("#useremail")!;
  
    async function fetchUserData() {
      try {
        const accessToken = getAccessToken();
        const me = await fetch("http://localhost:8080/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await me.json();
        console.log("User data fetched:", data);
        if (me.ok) {
          console.log("username:", data.user.username);
          usernameField.textContent = `Username: ${data.user.username}`;
          console.log("Email:", data.user.email);
          emailField.textContent = `Email: ${data.user.email}`;
        } else {
          console.error("Error fetching user data:", data);
        }
      } catch (err) {
        console.error("⚠️ Failed to reach server");
      }
    }

    fetchUserData(); // Aqui se ejecuta la funcion

  }, 0);
}