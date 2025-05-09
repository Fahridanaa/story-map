import routes from '../routes/routes';
import { getActiveRoute, getActivePathname } from '../routes/url-parser';
import NotFoundPage from './not-found/not-found-page';

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
    if (this.#currentPage && typeof this.#currentPage.destroy === 'function') {
      this.#currentPage.destroy();
    }

    const urlKey = getActiveRoute();
    const PageClass = routes[urlKey] || NotFoundPage;

    this.#currentPage = new PageClass();

    try {
      const pageUrlForScroll = getActivePathname();
      if (this.#supportsViewTransitions) {
        const transition = document.startViewTransition(async () => {
          this.#content.innerHTML = await this.#currentPage.render();
          if (typeof this.#currentPage.afterRender === 'function') {
            await this.#currentPage.afterRender();
          }
          if (pageUrlForScroll.startsWith('/story/')) {
            window.scrollTo(0, 0);
          }
        });
        await transition.finished;
      } else {
        this.#content.innerHTML = await this.#currentPage.render();
        if (typeof this.#currentPage.afterRender === 'function') {
          await this.#currentPage.afterRender();
        }
        if (pageUrlForScroll.startsWith('/story/')) {
          window.scrollTo(0, 0);
        }
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      const errorPage = new NotFoundPage();
      this.#content.innerHTML = await errorPage.render();
      if (typeof errorPage.afterRender === 'function') {
        await errorPage.afterRender();
      }
      this.#currentPage = errorPage;
    }
  }
}

export default App;
