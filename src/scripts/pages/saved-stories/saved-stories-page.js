import SavedStoriesPresenter from './saved-stories-presenter';

export default class SavedStoriesPage {
    #presenter;

    constructor() {
        this.#presenter = new SavedStoriesPresenter({
            view: this
        });
    }

    async render() {
        return `
      <div class="saved-stories-page" id="saved-stories-page">
        <div class="content-layout">
          <section class="stories-container" aria-label="Saved Stories list">
            <h1 class="page-title">Saved Stories</h1>
            <div id="story-list" class="story-list" role="list"></div>
            <div id="loading-indicator" class="loading" style="display: none;" role="status" aria-live="polite">
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              <p>Loading saved stories...</p>
            </div>
            <div id="no-saved-stories" class="no-stories-message" style="display: none;">
              <p>You haven't saved any stories yet.</p>
              <a href="#/" class="browse-stories-link">Browse Stories</a>
            </div>
          </section>
        </div>
      </div>
    `;
    }

    async afterRender() {
        this.#presenter.loadSavedStories();
    }

    renderStories(stories) {
        const storyList = document.getElementById('story-list');
        const noSavedStories = document.getElementById('no-saved-stories');

        if (!storyList || !noSavedStories) {
            return;
        }

        storyList.innerHTML = '';

        if (stories && stories.length > 0) {
            stories.forEach(story => {
                const storyCardElement = document.createElement('story-card');
                storyCardElement.setStory(story);
                setTimeout(() => {
                    storyCardElement.updateSaveButtonUI(true);
                }, 0);
                storyList.appendChild(storyCardElement);
            });
            noSavedStories.style.display = 'none';
        } else {
            this._showNoStoriesMessage();
        }
    }

    _showNoStoriesMessage() {
        const noSavedStories = document.getElementById('no-saved-stories');
        if (noSavedStories) {
            noSavedStories.innerHTML = `
                <p>You haven't saved any stories yet.</p>
                <a href="#/" class="browse-stories-link">Browse Stories</a>
            `;
            noSavedStories.style.display = 'block';
        }
    }

    showLoadingIndicator(show) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        const mainElement = document.querySelector('#main-content');
        mainElement.innerHTML = `
      <div class="error-message fade-in" role="alert" aria-live="polite">
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        <p>${message}</p>
      </div>
    `;
    }

    destroy() {
        try {
            if (this.#presenter) {
                this.#presenter.destroy();
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}
