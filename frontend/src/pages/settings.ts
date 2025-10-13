import { getAccessToken } from "../state/authState";

const apiHost = `${window.location.hostname}`;

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
        <form id="settings-form">
          <div class="username-change">
            <p id="username"></p>
            <input type="text" id="newUsername" value="Enter a new Username" />
            <button type="button" id="changeUsernameBTN">Change Username</button>
          </div>
          <p id="useremail"></p>
        </form>
      </div>
  `;
}

export function settingsHandlers(accessToken: string) {
  const usernameField = document.querySelector<HTMLParagraphElement>("#username")!;
  const emailField = document.querySelector<HTMLParagraphElement>("#useremail")!;
  const newUsername = document.querySelector<HTMLInputElement>("#newUsername")!;
  const changeUsernameBtn = document.querySelector<HTMLButtonElement>("#changeUsernameBTN")!;

  // Traer datos del usuario
  async function fetchUserData() {
    try {
      const res = await fetch("http://localhost:8080/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        usernameField.textContent = `Username: ${data.user.username}`;
        emailField.textContent = `Email: ${data.user.email}`;
      } else {
        console.error("Error fetching user data:", data);
      }
    } catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  }

  fetchUserData();

  // Listener para cambiar username
  changeUsernameBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const currentUsername = usernameField.textContent?.replace("Username: ", "");

    if (!newUsername.value || newUsername.value.length < 3 || newUsername.value.length > 20 || newUsername.value === currentUsername) {
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/users/changeUsername", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newUsername: newUsername.value }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Username changed successfully");
        usernameField.textContent = `Username: ${newUsername.value}`;
        newUsername.value = "";
      } else {
        console.error("Error changing username:", data.error);
      }
    } catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });
}