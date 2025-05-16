importScripts('https://unpkg.com/idb@7.1.1/build/umd.js');

const DB_NAME = 'stories-db';
const PENDING_STORIES_STORE_NAME = 'pending-stories';
const DB_VERSION = 4;

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';
const ENDPOINTS = {
    ADD_STORY_GUEST: `${API_BASE_URL}/stories/guest`,
    ADD_STORY: `${API_BASE_URL}/stories`
};

const openStoriesDBInSW = async () => {
    return idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains('stories')) {
                    db.createObjectStore('stories', { keyPath: 'id' });
                }
            }
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains(PENDING_STORIES_STORE_NAME)) {
                    db.createObjectStore(PENDING_STORIES_STORE_NAME, { keyPath: 'tempId' });
                }
            }
        },
    });
};

const getAllPendingStoriesInSW = async () => {
    const db = await openStoriesDBInSW();
    const tx = db.transaction(PENDING_STORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(PENDING_STORIES_STORE_NAME);
    const stories = await store.getAll();
    await tx.done;
    return stories;
};

const deletePendingStoryInSW = async (tempId) => {
    if (!tempId) return false;
    const db = await openStoriesDBInSW();
    const tx = db.transaction(PENDING_STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PENDING_STORIES_STORE_NAME);
    await store.delete(tempId);
    await tx.done;
    return true;
};

async function addStoryToServer(storyDataForApi, token = null) {
    let endpoint = ENDPOINTS.ADD_STORY_GUEST;
    const headers = {};

    if (token) {
        endpoint = ENDPOINTS.ADD_STORY;
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: storyDataForApi
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add story from SW');
    }
    return await response.json();
}

self.addEventListener('push', (event) => {
    let pushData = {};
    try {
        pushData = event.data.json();
    } catch (e) {
        pushData = {
            title: 'Notifikasi Baru',
            options: {
                body: 'Anda memiliki pesan baru.',
                icon: '/icons/icon-192x192.png'
            }
        };
    }

    const title = pushData.title || 'Notifikasi dari Story App';
    const options = {
        body: pushData.options && pushData.options.body ? pushData.options.body : 'Pesan baru.',
        icon: pushData.options && pushData.options.icon ? pushData.options.icon : '/icons/icon-192x192.png',
        badge: pushData.options && pushData.options.badge ? pushData.options.badge : '/icons/icon-192x192.png',
        data: pushData.options && pushData.options.data ? pushData.options.data : { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'add-story-sync') {
        event.waitUntil(syncNewStories());
    }
});

async function syncNewStories() {
    const pendingStories = await getAllPendingStoriesInSW();

    for (const story of pendingStories) {
        try {
            const response = await fetch(story.photo);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('description', story.description);
            formData.append('photo', file);
            if (story.lat && story.lon) {
                formData.append('lat', story.lat);
                formData.append('lon', story.lon);
            }

            const userToken = story.token;

            await addStoryToServer(formData, userToken);
            await deletePendingStoryInSW(story.tempId);

            self.registration.showNotification('Story Uploaded!', {
                body: `Your story "${story.description.substring(0, 30)}..." was successfully uploaded.`,
                icon: '/icons/icon-192x192.png'
            });

        } catch (error) {
            console.error('[Service Worker] Failed to sync story:', story.tempId, error);
        }
    }
}
