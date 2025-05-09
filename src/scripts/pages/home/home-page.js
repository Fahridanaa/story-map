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
            <button id="load-more" class="load-more-button" style="display: none;" aria-label="Load more stories">
              Load More Stories
            </button>
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
    await this.#presenter.loadStories();
    this.addEventListeners();
    this.#presenter.restoreScrollPosition();
  }

  renderStories(stories) {
    const storyList = document.getElementById('story-list');

    if (!storyList) {
      console.error('Story list element not found');
      return;
    }

    storyList.innerHTML = '';

    stories.forEach(story => {
      const storyCardElement = document.createElement('story-card');
      storyCardElement.setStory(story);
      storyList.appendChild(storyCardElement);
    });

    this.#presenter.updateMap(stories);

    const loadMoreButton = document.getElementById('load-more');
    if (loadMoreButton) {
      loadMoreButton.style.display = 'block';
    } else {
      const endMessage = document.createElement('p');
      endMessage.className = 'end-message';
      endMessage.textContent = 'You have reached the end of the stories.';
      loadMoreButton.parentNode.replaceChild(endMessage, loadMoreButton);
    }
  }

  addEventListeners() {
    const loadMoreButton = document.getElementById('load-more');

    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => {
        this.#presenter.loadMoreStories();
      });
    }

    // Add event listeners for story cards
    document.addEventListener('click', (event) => {
      const viewDetailsLink = event.target.closest('.view-details-link');
      if (viewDetailsLink) {
        // Save scroll position before navigation
        console.log('View details link clicked, saving scroll position');
        this.#presenter.saveScrollPosition();
      }
    });

    // Also save scroll position when scrolling
    const storiesContainer = document.querySelector('.stories-container');
    if (storiesContainer) {
      storiesContainer.addEventListener('scroll', () => {
        // Debounce the scroll event to avoid too many saves
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
          this.#presenter.saveScrollPosition();
        }, 100);
      });
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
