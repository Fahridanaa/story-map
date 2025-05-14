import HomePresenter from './home-presenter';
import { StoryCard } from '../../components/StoryCard';
import storyData from '../../data/story-data';

export default class HomePage {
  #presenter;
  scrollTimeout;

  constructor() {
    this.#presenter = new HomePresenter({
      model: storyData,
      view: this
    });
  }

  async render() {
    return `
      <div class="home-page" id="home-page">
        <div class="content-layout">
          <section id="map" class="map-container" aria-label="Stories map">
            <div id="map-content" class="map-content" role="application" aria-label="Map showing story locations"></div>
          </section>
          <section class="stories-container" aria-label="Stories list">
            <h1 class="visually-hidden">Story Map - Home</h1>
            <div id="story-list" class="story-list" role="list"></div>
            <div id="loading-indicator" class="loading" style="display: none;" role="status" aria-live="polite">
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              <p>Loading stories...</p>
            </div>
            <div id="load-more-container" class="load-more-controls">
              <button id="load-more" class="load-more-button" style="display: none;" aria-label="Load more stories">
                Load More Stories
              </button>
              <p id="end-of-stories-message" class="end-message" style="display: none;">You have reached the end of the stories.</p>
              <p id="offline-message" class="offline-message" style="display: none;">Load more is not available while offline.</p>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  async afterRender() {
    if (!this.#presenter.isUserAuthenticated()) {
      this.showLoginPrompt();
      return;
    }

    this.#presenter.initMap();
    await this.#presenter.loadInitialStories();
    this.addEventListeners();

    if (this.#presenter.isStateRestored) {
      this.#presenter.applyRestoredScrollPosition();
    }
    this.updateLoadMoreButtonVisibility();
  }

  renderStories(stories) {
    const storyList = document.getElementById('story-list');

    if (!storyList) {
      console.error('Story list element not found');
      return;
    }

    storyList.innerHTML = '';

    if (stories && stories.length > 0) {
      stories.forEach(story => {
        const storyCardElement = document.createElement('story-card');
        storyCardElement.setStory(story);
        storyList.appendChild(storyCardElement);
      });
    } else if (!this.#presenter.isLoading) {
      storyList.innerHTML = '<p class="no-stories-message">No stories available at the moment.</p>';
    }

    this.#presenter.updateMap(stories);
    this.updateLoadMoreButtonVisibility();
  }

  showOfflineMessage(show) {
    const offlineMessage = document.getElementById('offline-message');
    if (offlineMessage) {
      if (show) {
        offlineMessage.textContent = 'You are offline. Only saved stories are displayed.';
        offlineMessage.style.display = 'block';
      } else {
        offlineMessage.style.display = 'none';
      }
    }
  }

  updateLoadMoreButtonVisibility() {
    if (!this.#presenter) return;

    const loadMoreButton = document.getElementById('load-more');
    const endOfStoriesMessage = document.getElementById('end-of-stories-message');
    const offlineMessage = document.getElementById('offline-message');

    if (!loadMoreButton || !endOfStoriesMessage || !offlineMessage) {
      return;
    }

    const isOnline = navigator.onLine;
    const hasMore = this.#presenter.hasMoreStories;

    if (!isOnline) {
      loadMoreButton.style.display = 'none';
      endOfStoriesMessage.style.display = 'none';
      offlineMessage.style.display = 'block';
      loadMoreButton.disabled = true;
    } else if (hasMore) {
      loadMoreButton.style.display = 'block';
      loadMoreButton.disabled = false;
      endOfStoriesMessage.style.display = 'none';
      offlineMessage.style.display = 'none';
    } else {
      loadMoreButton.style.display = 'none';
      loadMoreButton.disabled = true;
      endOfStoriesMessage.style.display = 'block';
      offlineMessage.style.display = 'none';
    }
  }

  addEventListeners() {
    const loadMoreButton = document.getElementById('load-more');

    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => {
        if (!navigator.onLine) {
          alert("You are offline. Can't load more stories.");
          this.updateLoadMoreButtonVisibility();
          return;
        }
        if (this.#presenter.hasMoreStories) {
          this.#presenter.loadMoreStories();
        } else {
          this.updateLoadMoreButtonVisibility();
        }
      });
    }

    document.addEventListener('click', (event) => {
      const viewDetailsLink = event.target.closest('.view-details-link');
      if (viewDetailsLink) {
        console.log('View details link clicked, saving page state');
        this.#presenter.savePageState();
      }
    });

    const storiesContainer = document.querySelector('.stories-container');
    if (storiesContainer) {
      storiesContainer.addEventListener('scroll', () => {
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.#presenter.savePageState();
        }, 100);
      });
    }

    window.addEventListener('online', () => {
      this.updateLoadMoreButtonVisibility();
      this.#presenter.loadStories();
    });

    window.addEventListener('offline', () => {
      this.updateLoadMoreButtonVisibility();
      this.#presenter.loadStories();
    });
  }

  showLoadingIndicator(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'flex' : 'none';
    }
    const loadMoreButton = document.getElementById('load-more');
    if (loadMoreButton) {
      loadMoreButton.disabled = show;
      if (show) loadMoreButton.style.display = 'none';
    }
    const endOfStoriesMessage = document.getElementById('end-of-stories-message');
    const offlineMessage = document.getElementById('offline-message');
    if (show) {
      if (endOfStoriesMessage) endOfStoriesMessage.style.display = 'none';
      if (offlineMessage) offlineMessage.style.display = 'none';
    } else {
      this.updateLoadMoreButtonVisibility();
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

  showLoginPrompt() {
    const mainElement = document.querySelector('#main-content');
    mainElement.innerHTML = `
      <div class="login-prompt fade-in">
        <div class="login-prompt-content">
          <h1>Welcome to Story Map</h1>
          <p>You can add stories as a guest, but you need to login to view all stories.</p>
          <div class="login-prompt-buttons" role="toolbar" aria-label="Login options">
            <a href="#/login" class="login-button" aria-label="Login to your account">
              <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
              Login
            </a>
            <a href="#/register" class="register-button" aria-label="Create a new account">
              <i class="fas fa-user-plus" aria-hidden="true"></i>
              Create Account
            </a>
            <a href="#/add-story" class="guest-button" aria-label="Continue as a guest">
              <i class="fas fa-user" aria-hidden="true"></i>
              Continue as Guest
            </a>
          </div>
        </div>
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
