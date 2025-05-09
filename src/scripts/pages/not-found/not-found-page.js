export default class NotFoundPage {
    async render() {
        return `
      <div class="not-found-page" style="text-align: center; padding: 4rem 1rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary-color);">404</h1>
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Page Not Found</h2>
        <p style="margin-bottom: 2rem; color: var(--text-color);">Sorry, the page you are looking for does not exist or has been moved.</p>
        <a href="#/" class="btn" style="background-color: var(--primary-color); color: white; padding: 0.8rem 1.5rem; text-decoration: none; border-radius: var(--border-radius);">Go to Homepage</a>
      </div>
    `;
    }
}
