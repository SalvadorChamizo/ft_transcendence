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
          <div class="avatar-section">
            <p id="avatar"></p>
            <input type="file" id="newAvatar" />
            <button type="button" id="changeAvatarBTN">Change Avatar</button>
          </div>
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
          <div class="password-change">
            <p id="userpassword"></p>
            <input type="password" id="newPassword" value="Enter a new Password" />
            <input type="password" id="confirmPassword" value="Confirm new Password" />
            <button type="button" id="changePasswordBTN">Change Password</button>
          </div>
        </form>
      </div>
  `;
}

export function settingsHandlers(accessToken: string) {
  const usernameField = document.querySelector<HTMLParagraphElement>("#username")!;
  const newUsername = document.querySelector<HTMLInputElement>("#newUsername")!;
  const changeUsernameBtn = document.querySelector<HTMLButtonElement>("#changeUsernameBTN")!;
  const emailField = document.querySelector<HTMLParagraphElement>("#useremail")!;
  const newEmail = document.querySelector<HTMLInputElement>("#newEmail")!;
  const changeEmailBtn = document.querySelector<HTMLButtonElement>("#changeEmailBTN")!;
  const newPassword = document.querySelector<HTMLInputElement>("#newPassword")!;
  const confirmPassword = document.querySelector<HTMLInputElement>("#confirmPassword")!;
  const changePasswordBtn = document.querySelector<HTMLButtonElement>("#changePasswordBTN")!;
  const avatarField = document.querySelector<HTMLParagraphElement>("#avatar")!;
  const avatarInput = document.querySelector<HTMLInputElement>("#newAvatar")!;
  const changeAvatarBtn = document.querySelector<HTMLButtonElement>("#changeAvatarBTN")!;

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
        const avatarIMG = await fetch("http://localhost:8080/users/getAvatar", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-user-id": data.user.id.toString(),
          },
        });
        avatarField.innerHTML = `<img src="${URL.createObjectURL(await avatarIMG.blob())}" alt="User Avatar" width="100" height="100"/>`;
      } else {
        console.error("Error fetching user data:", data);
      }
    } catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  }

  fetchUserData();

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

  changePasswordBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!newPassword.value || !confirmPassword.value || newPassword.value !== confirmPassword.value) {
      return;
    }
    //Politica de contraseñas por implementar
    try {
      const res = await fetch ("http://localhost:8080/users/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPassword: newPassword.value }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Password changed successfully");
        location.reload();
      }
      else {
        console.error("Error changing password:", data.error);
      }
    }
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });

  changeAvatarBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const file = avatarInput.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPEG and JPG files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch("http://localhost:8080/users/changeAvatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Avatar changed successfully");
        location.reload();
      } else {
        console.error("Error changing avatar:", data.error);
      }
    } 
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });
}



