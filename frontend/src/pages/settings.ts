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
          <div class="email">
            <p id="useremail"></p>
            <input type="text" id="newEmail" value="Enter a new Email" />
            <button type="button" id="changeEmailBTN">Change Email</button>
          </div>
          <pre id="AllUsers"></pre>
        </form>
      </div>
  `;
}

export function settingsHandlers(accessToken: string) {
  const usernameField = document.querySelector<HTMLParagraphElement>("#username")!;
  const emailField = document.querySelector<HTMLParagraphElement>("#useremail")!;
  const newUsername = document.querySelector<HTMLInputElement>("#newUsername")!;
  const changeUsernameBtn = document.querySelector<HTMLButtonElement>("#changeUsernameBTN")!;
  const newEmail = document.querySelector<HTMLInputElement>("#newEmail")!;
  const changeEmailBtn = document.querySelector<HTMLButtonElement>("#changeEmailBTN")!;
  const allUsersField = document.querySelector<HTMLPreElement>("#AllUsers")!;

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

  // -> TEMPORALMENTE <-

  // Función para obtener todos los usuarios
  async function fetchAllUsers() {
    try {
      const res = await fetch("http://localhost:8080/users/getAllUsers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Formatear la lista de usuarios como "ID - Username"
        const usersList = data.users.map((user: any) => `${user.id} - ${user.username}`).join('\n');
        allUsersField.textContent = usersList;
      } else {
        console.error("Error fetching all users:", data);
        allUsersField.textContent = "Error loading users";
      }
    } catch (err) {
      console.error("⚠️ Failed to reach server", err);
      allUsersField.textContent = "Failed to load users";
    }
  }

  fetchAllUsers();

  // -> FINAL TEMPORALMENTE <-

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
        location.reload();
      } 
      else {
        console.error("Error changing username:", data.error);
      }
    } 
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });

  // Listener para cambiar email
  changeEmailBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const currentEmail = emailField.textContent?.replace("Email: ", "");
    if (!newEmail.value || newEmail.value === currentEmail) {
      return;
    }
    try {
      const res = await fetch ("http://localhost:8080/users/changeEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newEmail: newEmail.value }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Email changed successfully");
        location.reload();
      }
      else {
        console.error("Error changing email:", data.error);
      }
    }
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });
}
