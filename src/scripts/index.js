import '../styles/styles.css';
import '../styles/accessibility.css';
import '../styles/view-transitions.css';

import App from './pages/app';
import authModel from './data/auth-model';
import { updateNavigation } from './utils/navigation';

let app;

document.addEventListener('DOMContentLoaded', async () => {
  app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();
  updateNavigation();
  setupLogout();
  setupDrawerButton();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    updateNavigation();
  });
});

function setupLogout() {
  const logoutLink = document.getElementById('logout-link');
  if (!logoutLink) return;

  logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    authModel.logout();
    updateNavigation();

    if (window.location.hash === '#/' || window.location.hash === '') {
      import('./pages/home/home-page').then(module => {
        const HomePage = module.default;
        const homePageInstance = new HomePage();
        homePageInstance.showLoginPrompt();
      });
    } else {
      window.location.hash = '/';
    }
  });
}

function setupDrawerButton() {
  const drawerButton = document.getElementById('drawer-button');
  if (!drawerButton) return;

  drawerButton.addEventListener('click', () => {
    const isExpanded = drawerButton.getAttribute('aria-expanded') === 'true';
    drawerButton.setAttribute('aria-expanded', !isExpanded);
  });
}
