import { openDB } from 'idb';

const DB_NAME = 'stories-db';
const STORIES_STORE_NAME = 'stories';
const PENDING_STORIES_STORE_NAME = 'pending-stories';
const DB_VERSION = 2;

const openStoriesDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains(STORIES_STORE_NAME)) {
                    db.createObjectStore(STORIES_STORE_NAME, { keyPath: 'id' });
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

export const putStory = async (story) => {
    if (!story || !story.id) {
        console.error('Story object atau story.id tidak boleh kosong untuk putStory.');
        return null;
    }
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    const result = await store.put(story);
    await tx.done;
    return result;
};

export const putStories = async (stories) => {
    if (!stories || !Array.isArray(stories)) {
        return null;
    }
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    const results = [];
    for (const story of stories) {
        if (story && story.id) {
            results.push(await store.put(story));
        }
    }
    await tx.done;
    return results;
};

export const getStory = async (id) => {
    if (!id) {
        return null;
    }
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(STORIES_STORE_NAME);
    const story = await store.get(id);
    await tx.done;
    return story;
};

export const getAllStories = async () => {
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(STORIES_STORE_NAME);
    const stories = await store.getAll();
    await tx.done;
    return stories;
};

export const deleteStory = async (id) => {
    if (!id) {
        return false;
    }
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    await store.delete(id);
    await tx.done;
    return true;
};

export const clearAllStories = async () => {
    const db = await openStoriesDB();
    const tx = db.transaction(STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORIES_STORE_NAME);
    await store.clear();
    await tx.done;
    return true;
};

export const addPendingStory = async (storyData) => {
    const storyWithTempId = { ...storyData, tempId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };

    const db = await openStoriesDB();
    const tx = db.transaction(PENDING_STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PENDING_STORIES_STORE_NAME);
    const result = await store.add(storyWithTempId);
    await tx.done;
    return result;
};

export const getAllPendingStories = async () => {
    const db = await openStoriesDB();
    const tx = db.transaction(PENDING_STORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(PENDING_STORIES_STORE_NAME);
    const stories = await store.getAll();
    await tx.done;
    return stories;
};

export const deletePendingStory = async (tempId) => {
    if (!tempId) {
        return false;
    }
    const db = await openStoriesDB();
    const tx = db.transaction(PENDING_STORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PENDING_STORIES_STORE_NAME);
    await store.delete(tempId);
    await tx.done;
    return true;
};
