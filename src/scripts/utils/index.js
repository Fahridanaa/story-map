import { requestPermissionAndSubscribeNotifications } from './notification-helper';

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}

export function isPushManagerAvailable() {
  return 'PushManager' in window;
}

export async function handlePwaRegistered(registration, authModel, CONFIG) {
  if (registration && authModel.isAuthenticated()) {
    await requestPermissionAndSubscribeNotifications(registration, authModel, CONFIG);
  }
}
