export function TermsPage(): string {
    return `
        <div class="terms-page">
            <div class="terms-title">Terms and Conditions — ft_transcendence</div>
            <div class="modules-container" style="justify-content:center;">
                <div class="module-card" style="max-width:900px; width:90vw;">
                    <div class="terms-content" style="background:transparent; box-shadow:none; padding:0; margin-bottom:0;">
                        <p><strong>Last updated:</strong> November 1, 2025</p>
                        <p>Welcome to <strong>ft_transcendence</strong>, a web application developed as part of the 42 School curriculum. 
                        This document outlines the terms and conditions for using the ft_transcendence platform, including details about data management, 
                        user rights, and GDPR compliance.</p>
                        <p><strong>By using ft_transcendence, you agree to these Terms and Conditions.</strong></p>

                        <ol>
                            <li><strong>Purpose of the Application:</strong> ft_transcendence is a student project developed within 42 School. 
                            It provides online gaming, chat, and user interaction features while ensuring that all personal data is handled in compliance 
                            with the General Data Protection Regulation (GDPR) (EU Regulation 2016/679).</li>

                            <li><strong>Data Controller and Contact:</strong> Data processing is performed locally or within the educational 
                            infrastructure of 42 School. For privacy or data-related concerns, users may contact the project maintainer or local 42 administration.</li>

                            <li><strong>Personal Data Collected:</strong>
                                <ul>
                                    <li>Identification Data: username, email address, or profile information.</li>
                                    <li>Authentication Data: encrypted passwords or login tokens.</li>
                                    <li>Activity Data: match history, chat messages, and game statistics.</li>
                                    <li>Security Data: two-factor authentication (2FA) secrets if enabled.</li>
                                </ul>
                                All personal data is stored securely and used only to ensure platform functionality.
                            </li>

                            <li><strong>Legal Basis for Processing:</strong> Data is processed either on the basis of legitimate interest (to provide 
                            platform functionality) or user consent (when registering or using the service). No personal data is shared with third parties.</li>

                            <li><strong>Data Retention and Anonymization:</strong> Users inactive for a set period may have their data automatically anonymized. 
                            Personally identifiable data such as usernames or emails may be removed or replaced with anonymized values. Anonymized data may still be used 
                            for testing or statistics, but it cannot identify any individual.</li>

                            <li><strong>User Rights (GDPR Compliance):</strong>
                                <ul>
                                    <li>Right of Access — view personal data stored about you.</li>
                                    <li>Right to Rectification — update or correct your information.</li>
                                    <li>Right to Erasure (“Right to be Forgotten”) — permanently delete your account and data.</li>
                                    <li>Right to Restrict or Object — limit how your data is processed.</li>
                                    <li>Right to Data Portability — export your data in a readable format.</li>
                                    <li>Right to Anonymization — anonymize your data without deleting your account.</li>
                                </ul>
                                These actions can be performed under <strong>Account Settings</strong> or by contacting the maintainer.
                            </li>

                            <li><strong>Local Data Management:</strong> Users can view, edit, or delete personal data through their account settings. 
                            Data is stored locally within the project environment (e.g., local database or Docker volume), not on external cloud services.</li>

                            <li><strong>Account Deletion Process:</strong> When deletion is requested, the account and related data (profile, chat, matches, etc.) 
                            are permanently removed. Any backup copies will be deleted or anonymized as soon as technically feasible. Deletion is irreversible.</li>

                            <li><strong>Transparency and Communication:</strong> ft_transcendence ensures transparent communication regarding data privacy. 
                            Users can access information about privacy rights and GDPR options via the interface or documentation.</li>

                            <li><strong>Educational Context:</strong> ft_transcendence is a non-commercial educational project. 
                            It is not meant for public or commercial deployment but to demonstrate software engineering, security, and GDPR compliance principles.</li>

                            <li><strong>Changes to These Terms:</strong> Terms may be updated to reflect changes in scope or GDPR requirements. 
                            Updates will be communicated through the project repository or user interface.</li>

                            <li><strong>Further Information:</strong> To learn more about the GDPR and your data rights, visit the official EU website:
                            <a href="https://commission.europa.eu/data-protection/" target="_blank" rel="noopener noreferrer">European Commission — Data Protection</a>.</li>
                        </ol>

                        <p><strong>Summary of Privacy Options:</strong></p>
                        <ul>
                            <li>Edit Personal Data — update or correct stored information.</li>
                            <li>Delete Account — permanently remove your account and all related data.</li>
                            <li>Anonymize Account — remove identifiable information while retaining anonymous stats.</li>
                            <li>View Local Data — review what information is stored locally about you.</li>
                        </ul>

                        <p><em>ft_transcendence — 42 School Project • Last updated: November 1, 2025</em></p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
