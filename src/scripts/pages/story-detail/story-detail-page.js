import StoryDetailPresenter from './story-detail-presenter';
import storyData from '../../data/story-data';

export default class StoryDetailPage {
  #presenter;

  constructor() {
    const storyId = StoryDetailPresenter.extractStoryIdFromHash();
    this.#presenter = new StoryDetailPresenter(storyId, {
      model: storyData,
      view: this
    });
  }

  async render() {
    return `
      <div class="fade-in">
        <div class="story-detail-container">
          <div id="story-content" class="story-content">
            <div class="loading" role="status" aria-live="polite">
              <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              <p>Loading story...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const storyId = StoryDetailPresenter.extractStoryIdFromHash();
      if (storyId) {
        this.#presenter = new StoryDetailPresenter(storyId, {
          model: storyData,
          view: this
        });
      }

      await this.#presenter.getStoryDetail();
    } catch (error) {
      console.error('Error in afterRender:', error);
      this.showError('An unexpected error occurred. Please try again later.');
    }
  }

  renderStoryDetail(story) {
    const storyContent = document.getElementById('story-content');
    const formattedDate = new Date(story.createdAt).toLocaleDateString();

    if (!storyContent) {
      console.error('Story content element not found');
      return;
    }

    storyContent.innerHTML = `
      <article class="story-detail-container" style="view-transition-name: story-detail-container-${story.id}">
        <nav aria-label="Story navigation">
          <a href="#/" class="back-button" aria-label="Return to stories list">
            <i class="fas fa-arrow-left" aria-hidden="true"></i> Back to Stories
          </a>
        </nav>

        <section class="story-detail">
          <figure>
            <img src="${story.photoUrl}"
                 alt="Story image: ${story.description.substring(0, 50)}..."
                 class="story-detail-image"
                 style="view-transition-name: story-image-${story.id}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Image+Not+Available';">
          </figure>

          <div class="story-detail-content">
            <h1 class="story-detail-title">Story by ${story.name}</h1>

            <div class="story-detail-description">
              <p>${story.description}</p>
            </div>

            <footer class="story-detail-meta">
              <div class="story-detail-location" aria-label="Story location">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>Location: ${story.lat}, ${story.lon}</span>
              </div>

              <div class="story-detail-date" aria-label="Story publication date">
                <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                <time datetime="${story.createdAt}">Posted on: ${formattedDate}</time>
              </div>
            </footer>
          </div>
        </section>
      </article>
    `;

    const backButton = storyContent.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.hash = '/';
      });
    }
  }

  showError(message) {
    const storyContent = document.getElementById('story-content');

    if (storyContent) {
      storyContent.innerHTML = `
        <div class="error-message fade-in" role="alert" aria-live="polite">
          <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
          <p>${message}</p>
          <a href="#/" class="nav-link">Back to Home</a>
        </div>
      `;
    }
  }

}
