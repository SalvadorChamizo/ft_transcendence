import { TwoFAFormHtml } from "./loginTemplate";
import { setAccessToken, isLoggedIn } from "../../state/authState";
import { setText } from "./loginDOM";

const apiHost = `${window.location.hostname}`;

export async function handleTwoFA(tempToken: string, username: string, userId: number) {
    //const app = document.getElementById("app")!;
    //app.innerHTML = TwoFAFormHtml();

  if (isLoggedIn()) {
    location.hash = "#/";
  }

    setTimeout(async () => {
        const cancelBtn = document.querySelector<HTMLButtonElement>("#twofa-cancel")!;
        const qrDiv = document.querySelector<HTMLDivElement>(".twofa-qrcode")!;
        const twofaForm = document.querySelector<HTMLFormElement>("#twofa-form")!;
        const twofaResult = document.querySelector<HTMLParagraphElement>("#twofa-result")!;
    
        cancelBtn.onclick = (e) => {
            e.preventDefault();
    
            location.hash = "#/";
        };

        try {
            const res = await fetch(`http://${apiHost}:8080/auth/generate-qr`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`
                },
                body: JSON.stringify({ username, userId }),
            });
            const qr = await res.json();
            if (res.ok && qr.qr) {
                qrDiv.innerHTML = `<img src="${qr.qr}" alt="QR Code" />`;
            } else {
                setText(qrDiv, "Failed to generate QR code");
            }
        } catch {
            setText(qrDiv, "Failed to reach server");
        }
    
        twofaForm.onsubmit = async (e) => {
            e.preventDefault();
        
            const code = (document.querySelector<HTMLInputElement>("#twofa-code")!).value;
        
            try {
                const verifyRes = await fetch(`http://${apiHost}:8080/auth/verify-2fa`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, code }),
                    credentials: "include",
                });
            
                const verifyData = await verifyRes.json();
                        
                if (verifyRes.ok && verifyData.accessToken) {
                    console.log("Entra 2");
                    setAccessToken(verifyData.accessToken);
                    localStorage.setItem("user", JSON.stringify(verifyData.user));
                    setText(twofaResult, "✅ 2FA verified, loggen in!");
                    setTimeout(() => location.hash = "#/", 1000);
                } else {
                    setText(twofaResult, "❌ Invalid 2FA code");
                }
            } catch (err) {
                setText(twofaResult, "⚠️ Failed to reach server");
            }
        }
    }, 0);

}