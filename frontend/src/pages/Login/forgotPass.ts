import { forgotPassHTML } from "./loginTemplate";
import { setText } from "./loginDOM";

const apiHost = `${window.location.hostname}`;

export function forgotPass(): string {
    return forgotPassHTML();
}

export function forgotPassHandle() {
    const changeSubmit = document.getElementById("change-pass-button")!;
    const backBtn = document.getElementById("back-btn");
    
    backBtn?.addEventListener("click", () => {
        window.location.hash = "#/login";
    })
    
    changeSubmit.addEventListener("click", async () => {
        const emailPass = (document.querySelector<HTMLInputElement>("#email-pass")!).value;

        await changePassword(emailPass);
    });
}

async function changePassword(email: string) {

    try {
      const res = await fetch(`http://${apiHost}:8080/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include", // include cookies
      });

      const result = document.querySelector<HTMLParagraphElement>("#result")!;
      const data = await res.json();
        if (res.ok) {
            setText(result, `✅ Password changed`);
            setTimeout(() => {window.location.hash = "#/login" }, 1000);
        } else {
            setText(result, `${data.error || "Password changing failed"}`);
        }
    } catch (err) {

    }
}