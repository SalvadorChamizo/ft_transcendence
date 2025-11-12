export function getLoginHtml() : string {
  return `
    <div class="login-home">
        <div id="login-card" class="login-card">
            <ul class="login-nav">
                <li class="login-nav-item">
                    <button type="button" class="login-nav-link active btl" data-tab="login-tab-panel" href="#/login">Login</a>
                </li>
                <li class="login-nav-item">
                    <button type="button" class="login-nav-link btr" data-tab="signup-tab-panel" href="#/login">Signup</a>
                </li>
            </ul>
            <div id="login-tab-content" class="login-tab-content">
                <div class="login-tab-panel active" id="login-tab-panel">
                    <h2 class="login-title">Have an account?</h2>
                    <hr>
                    <div class="gsi-buttons">
                        <button type="button" class="gsi-material-button" id="fortyTwoLoginButton">
                            <div class="gsi-material-button-state"></div>
                            <div class="gsi-material-button-content-wrapper">
                        <div class="gsi-material-button-icon">
                            <svg viewBox="0 -200 960 960" width="20" height="20" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                                <polygon points="32,412.6 362.1,412.6 362.1,578 526.8,578 526.8,279.1 197.3,279.1 526.8,-51.1 362.1,-51.1 32,279.1" fill="white"/>
                                <polygon points="597.9,114.2 762.7,-51.1 597.9,-51.1" fill="white"/>
                                <polygon points="762.7,114.2 597.9,279.1 597.9,443.9 762.7,443.9 762.7,279.1 928,114.2 928,-51.1 762.7,-51.1" fill="white"/>
                                <polygon points="928,279.1 762.7,443.9 928,443.9" fill="white"/>
                            </svg>
                        </div>
                        <span class="gsi-material-button-contents">Sign in with 42</span>
                        <span style="display: none;">Sign in with 42</span>
                    </div>
                    </button>
                    <button type="button" class="gsi-material-button" id="googleLoginButton">
                    <div class="gsi-material-button-state"></div>
                    <div class="gsi-material-button-content-wrapper">
                        <div class="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        </div>
                        <span class="gsi-material-button-contents">Sign in with Google</span>
                        <span style="display: none;">Sign in with Google</span>
                    </div>
                </button>
            </div>
                <form class="login-form" id="login-form" autocomplete="on">
                        <input type="text" id="username" class="form-control" placeholder="Username" autocomplete="username">
                        <input type="password" id="password" class="form-control" placeholder="Password" autocomplete="current-password">
                        <button type="submit" id="login-button" class="login-submit-button">Login</button>
                        <a class="login-nav-link-password active" href="#/forgot-pass">Forgot password</a>
                    </form>
                </div>
                <div class="login-tab-panel" id="signup-tab-panel">
                    <h2 class="login-title">Registration</h2>
                    <hr>
                    <form class="login-form" id="signup-form" autocomplete="on">
                        <input type="text" id="email" class="form-control" placeholder="Email" autocomplete="email">
                        <input type="text" id="signup-username" class="form-control" placeholder="Username" autocomplete="username">
                        <input type="password" id="signup-password" class="form-control" placeholder="Password" autocomplete="new-password">
                        <button type="submit" id="signup-button" class="login-submit-button">Signup</button>
                            <div class="terms-wrapper">
                            <label>
                                <input type="checkbox" id="signup-terms" required>
                                I agree to the <a href="#/terms">Terms and Conditions</a>
                            </label>
                        </div>
                        <div class="login-link-wrapper">
                            <a class="login-nav-link-account active" data-tab="login-tab-panel" href="#">Already have an account? Log in</a>
                        </div>
                    </form>
                </div>
                <p class="login-result" id="result" style="display:none"></p>
            </div>
        </div>
    </div>
  `;
}

export function TwoFAFormHtml(): string {
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
                    <button type="button" id="twofa-cancel">Cancel</button>
                        <button id="twofa-submit" type="submit">Verify</button>
                        <p id="twofa-result"></p>
                    </div>
                    </form>
            </div>
        </div>
    </div>
    `;
}

export function Enable2FAHtml(): string {
    return `
      <h2>Two-Factor Authentication</h2>
      <button id="enable-2fa-btn">Enable 2FA</button>
      <button id="show-qr-btn" style="display:none; margin-left:1rem;">Generate QR</button>

      <div id="qr-container" style="margin-top:1rem;"></div>
      <form id="verify-2fa-form" style="display:none; margin-top:1rem;">
        <input type="text" id="verify-2fa-code" placeholder="Enter 6-digit code" required />
        <button type="submit">Verify</button>
      </form>
      <p style="color:white" id="enable-2fa-result"></p>
      `;
  }

export function forgotPassHTML(): string {
    return `
    <div class="login-home">
        <div id="login-card" class="login-card">
            <ul class="login-nav">
                <li class="login-nav-item">
                    <button type="button" class="login-nav-link active btl" data-tab="login-tab-panel"
                        >Forgot Password</button>
                </li>
            </ul>
            <div id="login-tab-content" class="login-tab-content">
                <div class="login-tab-panel active" id="login-tab-panel">
                    <h2 class="login-title">Forgot your password?</h2>
                    <hr>
                </div>
                <form class="login-form" id="login-form">
                    <input type="text" id="email-pass" class="form-control" placeholder="Email">
                    <button type="submit" id="change-pass-button" class="login-submit-button">Change Password</button>
                    <button id="back-btn" class="login-nav-link-back active" href="#/login">Back</a>
                </form>
            </div>
            <p class="pass-result" id="result" style="display:none"></p>
        </div>
    </div>
    `;
}

export function getLoginTabHTML(): string {
    return `
                <div id="login-tab-content" class="login-tab-content">
                <div class="login-tab-panel active" id="login-tab-panel">
                    <h2 class="login-title">Have an account?</h2>
                    <hr>
                    <div class="gsi-buttons">
                        <button type="button" class="gsi-material-button" id="fortyTwoLoginButton">
                            <div class="gsi-material-button-state"></div>
                            <div class="gsi-material-button-content-wrapper">
                        <div class="gsi-material-button-icon">
                            <svg viewBox="0 -200 960 960" width="20" height="20" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                                <polygon points="32,412.6 362.1,412.6 362.1,578 526.8,578 526.8,279.1 197.3,279.1 526.8,-51.1 362.1,-51.1 32,279.1" fill="white"/>
                                <polygon points="597.9,114.2 762.7,-51.1 597.9,-51.1" fill="white"/>
                                <polygon points="762.7,114.2 597.9,279.1 597.9,443.9 762.7,443.9 762.7,279.1 928,114.2 928,-51.1 762.7,-51.1" fill="white"/>
                                <polygon points="928,279.1 762.7,443.9 928,443.9" fill="white"/>
                            </svg>
                        </div>
                        <span class="gsi-material-button-contents">Sign in with 42</span>
                        <span style="display: none;">Sign in with 42</span>
                    </div>
                    </button>
                    <button type="button" class="gsi-material-button" id="googleLoginButton">
                    <div class="gsi-material-button-state"></div>
                    <div class="gsi-material-button-content-wrapper">
                        <div class="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        </div>
                        <span class="gsi-material-button-contents">Sign in with Google</span>
                        <span style="display: none;">Sign in with Google</span>
                    </div>
                </button>
            </div>
                <form class="login-form" id="login-form">
                        <input type="text" id="username" class="form-control" placeholder="Username">
                        <input type="password" id="password" class="form-control" placeholder="Password">
                        <button type="submit" id="login-button" class="login-submit-button">Login</button>
                        <button id="forgot-pass-btn" class="login-nav-link-password active" href="#">Forgot password</a>
                    </form>
                </div>
                <div class="login-tab-panel" id="signup-tab-panel">
                    <h2 class="login-title">Registration</h2>
                    <hr>
                    <form class="login-form" id="signup-form">
                        <input type="text" id="email" class="form-control" placeholder="Email">
                        <input type="text" id="signup-username" class="form-control" placeholder="Username">
                        <input type="password" id="signup-password" class="form-control" placeholder="Password">
                        <button type="submit" id="signup-button" class="login-submit-button">Signup</button>
                            <div class="terms-wrapper">
                            <label>
                                <input type="checkbox" id="signup-terms" required>
                                I agree to the <a href="/terms-and-conditions" target="_blank">Terms and Conditions</a>
                            </label>
                        </div>
                        <div class="login-link-wrapper">
                            <a class="login-nav-link-account active" data-tab="login-tab-panel" href="#">Already have an account? Log in</a>
                        </div>
                    </form>
                </div>
                <p class="login-result" id="result" style="display:none"></p>
            </div>
    `;
}