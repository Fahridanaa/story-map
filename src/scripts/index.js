import '../styles/styles.css';
import '../styles/accessibility.css';
import '../styles/view-transitions.css';

import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import L from 'leaflet';
window.L = L;

import App from './pages/app';
import authModel from './data/auth-model';
import { updateNavigation } from './utils/navigation';
import CONFIG from './config';
import { registerSW } from 'virtual:pwa-register';
import {
  isServiceWorkerAvailable,
  isPushManagerAvailable,
  handlePwaRegistered,
} from './utils';
import { unsubscribeFromPushNotifications } from './utils/notification-helper';
import { clearAllStories } from './data/idb-helper';
import Swal from 'sweetalert2';

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
  setupClearOfflineDataButton();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    updateNavigation();
  });

  if (isServiceWorkerAvailable() && isPushManagerAvailable()) {
    const sw = registerSW({
      async onRegistered(registration) {
        if (registration) {
          await handlePwaRegistered(registration, authModel, CONFIG);
        }
      },
    });
  }
});

async function handleLogoutUnsubscription() {
  if (isServiceWorkerAvailable() && isPushManagerAvailable()) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await unsubscribeFromPushNotifications(registration, authModel, CONFIG);
      }
    } catch (error) {
      console.error('Error saat mencoba unsubscribe notifikasi waktu logout:', error);
    }
  }
}

function setupLogout() {
  const logoutLink = document.getElementById('logout-link');
  if (!logoutLink) return;

  logoutLink.addEventListener('click', async (event) => {
    event.preventDefault();

    await handleLogoutUnsubscription();

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

function setupClearOfflineDataButton() {
  const clearButton = document.getElementById('clear-offline-data-button');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      try {
        await clearAllStories();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Offline story data and saved stories have been cleared!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        if (window.location.hash === '#/saved-stories') {
          window.location.reload();
        }
      } catch (error) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to clear offline story data.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    });
  }
}
