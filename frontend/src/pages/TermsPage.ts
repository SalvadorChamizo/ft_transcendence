export function TermsPage(): string {
    return `
        <style>
        .terms-page {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            background: #fff;
            font-family: 'DM Sans', Arial, sans-serif;
            padding: 48px 24px;
        }
        .terms-title {
            color: #222;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 24px;
            text-align: center;
        }
        .terms-content {
            color: #333;
            font-size: 1.1rem;
            max-width: 800px;
            line-height: 1.7;
            background: #f8fafc;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }
        </style>
        <div class="terms-page">
            <div class="terms-title">Terms and Conditions</div>
            <div class="terms-content">
                <p><strong>Welcome to Ft_transcendence!</strong></p>
                <p>By accessing or using our website, you agree to be bound by these terms and conditions. Please read them carefully.</p>
                <ol>
                    <li><strong>Acceptance of Terms:</strong> Your use of the site constitutes your agreement to these terms.</li>
                    <li><strong>Modification:</strong> We reserve the right to modify these terms at any time. Changes will be posted on this page.</li>
                    <li><strong>Use of Content:</strong> All content is for personal, non-commercial use unless otherwise stated.</li>
                    <li><strong>Privacy:</strong> Your privacy is important to us. Please review our Privacy Policy for details.</li>
                    <li><strong>Limitation of Liability:</strong> We are not liable for any damages resulting from the use of our site.</li>
                    <li><strong>Contact:</strong> For questions, contact support@fttranscendence.com.</li>
                </ol>
                <p>By continuing to use our site, you acknowledge and accept these terms.</p>
            </div>
        </div>
    `;
}
