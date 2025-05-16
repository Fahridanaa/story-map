import { getAllStories } from '../../data/idb-helper';

class SavedStoriesPresenter {
    #view;

    constructor({ view }) {
        this.#view = view;
    }

    async loadSavedStories() {
        try {
            this.#view.showLoadingIndicator(true);
            const stories = await getAllStories();
            this.#view.renderStories(stories);
        } catch (error) {
            console.error('Error loading saved stories:', error);
            this.#view.showError('Failed to load saved stories. Please try again later.');
        } finally {
            this.#view.showLoadingIndicator(false);
        }
    }

    destroy() {
        // Any cleanup logic for the presenter can go here
    }
}

export default SavedStoriesPresenter;
