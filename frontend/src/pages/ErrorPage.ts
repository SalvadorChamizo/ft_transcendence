export function ErrorPage(): string {
    return `
        <div class="error-page">
            <div class="error-content">
                <div class="error-404">404</div>
                <div class="error-title">Page not found.</div>
                <div class="error-desc">Our experts are working on it.</div>
                <a href="#/" class="error-home-btn">Go to Home</a>
            </div>
            <div class="error-img">
                <img src="public/error_page_image.jpg" alt="Error" class="error-img-inner" />
            </div>
        </div>
    `;
}
