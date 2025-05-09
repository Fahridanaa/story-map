import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;
  #supportsViewTransitions = false;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#supportsViewTransitions = document.startViewTransition !== undefined;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    try {
      const url = getActiveRoute();

      const page = routes[url];

      if (!page) {
        console.error(`No route found for: ${url}`);
        return;
      }

      if (this.#currentPage && typeof this.#currentPage.destroy === 'function') {
        this.#currentPage.destroy();
      }

      const isNavigatingToStoryDetail = url.startsWith('/story/');
      const isNavigatingToHome = url === '/';

      if (this.#supportsViewTransitions) {
        const transition = document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          await page.afterRender();

          if (isNavigatingToStoryDetail) {
            window.scrollTo(0, 0);
          }
        });

        await transition.finished;
      } else {
        this.#content.innerHTML = await page.render();
        await page.afterRender();

        if (isNavigatingToStoryDetail) {
          window.scrollTo(0, 0);
        }
      }

      this.#currentPage = page;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }
}

export default App;
