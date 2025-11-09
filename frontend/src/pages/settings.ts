import { getAccessToken, isLoggedIn } from "../state/authState";
import { Enable2FAHtml } from "./Login/loginTemplate";
import { getElement } from "./Login/loginDOM";
import { enable2FAHandlers } from "./Login/login";
import { logoutOutsideLoginPage, logout } from "./Login/loginService";

const apiHost = `${window.location.hostname}`;

export function Settings() {
  const accessToken = getAccessToken();
  setTimeout(() => settingsHandlers(accessToken), 0);
  setTimeout(() => setupSettingsTabs(), 0);
  return `
    <div class="settings-container">
      <h2>Settings</h2>
      <div class="settings-card">
        <ul class="settings-nav">
          <li class="settings-nav-item">
            <button type="button" class="settings-nav-link active btl" data-tab="profile-tab">Profile</button>
          </li>
          <li class="settings-nav-item">
            <button type="button" class="settings-nav-link" data-tab="security-tab">Security</button>
          </li>
          <li class="settings-nav-item">
            <button type="button" class="settings-nav-link btr" data-tab="preferences-tab">Preferences</button>
          </li>
        </ul>

        <div class="settings-tab-content">
          <div id="profile-tab" class="settings-tab-panel active">
            <div class="settings-form-section">
            <div class="avatar-section">
              <p id="avatar"></p>
              <input type="file" id="newAvatar" />
              <button type="button" id="changeAvatarBTN">Change Avatar</button>
            </div>
            </div>

            <div class="settings-form-section">
              <p id="username">Username</p>
              <input type="text" id="newUsername" placeholder="New username" />
              <button type="button" id="changeUsernameBTN">Change Username</button>
              <p id="username-error-message" class="error-message" style="display: none;"></p>
            </div>

            <div class="settings-form-section">
              <p id="useremail">Email</p>
              <input type="text" id="newEmail" placeholder="Enter a new Email" />
              <button type="button" id="changeEmailBTN">Change Email</button>
              <p id="email-error-message" class="error-message" style="display: none;"></p>
            </div>
    
          </div>

          <div id="security-tab" class="settings-tab-panel">
            <div class="settings-form-section">
              <p>Change Password</p>
              <input id="newPassword" type="password" placeholder="New password" />
              <input id="confirmPassword" type="password" placeholder="Confirm password" />
              <button id="changePasswordBTN">Change Password</button>
            </div>
            <div id="twofa-section" class="settings-form-section">
              <p>Two-Factor Authentication</p>
              <button id="enable-2fa-btn">Enable 2FA</button>
              <button id="show-qr-btn" style="display:none;">Generate QR</button>
              <div id="qr-container" style="margin-top:1rem;"></div>
              <form id="verify-2fa-form" style="display:none; margin-top:1rem;">
                <input type="text" id="verify-2fa-code" placeholder="Enter 6-digit code" required />
                <button type="submit">Verify</button>
              </form>
            </div>
          </div>

          <div id="preferences-tab" class="settings-tab-panel">
            <div class="settings-form-section">
              <p>Delete Account</p>
              <button id="delete-account-btn">Delete my account</button>
            </div>
          </div>
        </div>
      </div>
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
  const deleteUserBtn = document.querySelector<HTMLButtonElement>("#delete-account-btn")!;

  if (isLoggedIn()) {
    const userStr = localStorage.getItem("user");
    const user = JSON.parse(userStr!);
    const actualUser = user?.user || user;
    if (user?.twofa && user?.twofa === 1) {
      const twofaSection = document.getElementById("twofa-section");
      if (twofaSection)
        twofaSection.style.display = "none";
    } else {
      //getElement("#twofa-section").innerHTML = Enable2FAHtml();
      enable2FAHandlers(actualUser?.id, actualUser?.username);
    }
  }

  async function fetchUserData() {
    try {
      const res = await fetch(`http://${apiHost}:8080/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        if (usernameField) {
          usernameField.textContent = `Username: ${data.user.username}`;
          getElement("#login-name").textContent = `${data.user.username}`;
          getElement("#login-dropdown").classList.remove("hidden");
          const logoutBtn = document.querySelector<HTMLAnchorElement>("#logout-btn")!;
          logoutBtn.onclick = logoutOutsideLoginPage;
        }
        if (emailField)
          emailField.textContent = `Email: ${data.user.email}`;
        const avatarIMG = await fetch(`http://${apiHost}:8080/users/getAvatar`, {
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
    const errorMessage = document.querySelector<HTMLParagraphElement>("#username-error-message")!;

    errorMessage.style.display = "none";
    errorMessage.textContent = "";
    
    if (!newUsername.value){
      errorMessage.textContent = "Username cannot be empty";
      errorMessage.style.display = "block";
      return;
    }

    if (newUsername.value === currentUsername) {
      errorMessage.textContent = "Username must be different from current";
      errorMessage.style.display = "block";
      return;
    }
    
    if (!newUsername.value || newUsername.value.length < 3 || newUsername.value.length > 20) {
      errorMessage.textContent = "Username must be between 3-20 characters";
      errorMessage.style.display = "block";
      return;
    }


    try {
      const res = await fetch(`http://${apiHost}:8080/users/changeUsername`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newUsername: newUsername.value }),
      });

      const data = await res.json();
      if (res.ok) {
        const userStr = localStorage.getItem("user");
        const user = JSON.parse(userStr!);
        user.username = newUsername.value;
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify(user));
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

  changeEmailBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const currentEmail = emailField.textContent?.replace("Email: ", "");
    const errorMessage = document.querySelector<HTMLParagraphElement>("#email-error-message")!;

    errorMessage.style.display = "none";
    errorMessage.textContent = "";

    if (!newEmail.value) {
      errorMessage.textContent = "Email cannot be empty";
      errorMessage.style.display = "block";
      return;
    }

    if (newEmail.value === currentEmail) {
      errorMessage.textContent = "Email must be different from current";
      errorMessage.style.display = "block";
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(newEmail.value)) {
      errorMessage.textContent = "Please enter a valid email address";
      errorMessage.style.display = "block";
      return;
    }

    try {
      const res = await fetch (`http://${apiHost}:8080/users/changeEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newEmail: newEmail.value }),
      });
      const data = await res.json();
      if (res.ok) {
        const userStr = localStorage.getItem("user");
        const user = JSON.parse(userStr!);
        user.email = newEmail.value;
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify(user));
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

  changePasswordBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!newPassword.value || !confirmPassword.value || newPassword.value !== confirmPassword.value) {
      return;
    }
    // Password policy to be implemented
    try {
      const res = await fetch (`http://${apiHost}:8080/users/changePassword`, {
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
      const res = await fetch(`http://${apiHost}:8080/users/changeAvatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Avatar changed successfully");
      } else {
        console.error("Error changing avatar:", data.error);
      }
    } 
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
    location.reload();
  });

  deleteUserBtn.addEventListener("click", async (e) => {  
    e.preventDefault();
    try {
      const res = await fetch (`http://${apiHost}:8080/users/removeUsers`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPassword: newPassword.value }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("User delete successfully");
        logoutOutsideLoginPage();
/*         logout();
        location.hash = "/#login"; */
      }
      else {
        console.log("Error deleting user:", data.error)
      }
    }
    catch (err) {
      console.error("⚠️ Failed to reach server", err);
    }
  });
}

export function setupSettingsTabs() {
  const tabLinks = document.querySelectorAll(".settings-nav-link");
  const tabPanels = document.querySelectorAll(".settings-tab-panel");

  tabLinks.forEach(link => {
    link.addEventListener("click", function (this: Element) {
      const target = this.getAttribute("data-tab");
      if (!target) return;

      tabLinks.forEach(l => l.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(target)?.classList.add("active");
    });
  });
}