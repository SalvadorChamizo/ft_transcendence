export function TermsPage(): string {
    return `
        <div class="terms-page">
            <div class="terms-title">Terms and Conditions</div>
            <div class="modules-container" style="justify-content:center;">
                <div class="module-card" style="max-width:900px; width:90vw;">
                    <div class="terms-content" style="background:transparent; box-shadow:none; padding:0; margin-bottom:0;">
                        <p><strong>Welcome to Ft_transcendence!</strong></p>
                        <ol>
                            <li><strong>Academic use:</strong> This website is for educational and demonstrative purposes only.</li>
                            <li><strong>Privacy:</strong> No personal data is collected for commercial purposes.</li>
                            <li><strong>Responsibility:</strong> The authors are not responsible for errors or misuse.</li>
                            <li><strong>Good Practice:</strong> Users should follow general good practices and responsible behavior when using this platform.</li>
                        </ol>
                        <p>Using this website implies acceptance of these terms.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
