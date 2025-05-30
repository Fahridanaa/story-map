import StoryDetailPresenter from './story-detail-presenter';
import storyData from '../../data/story-data';
import Swal from 'sweetalert2';

export default class StoryDetailPage {
  #presenter;

  constructor() {
    const storyId = StoryDetailPresenter.extractStoryIdFromHash();
    this.#presenter = new StoryDetailPresenter(storyId, {
      model: storyData,
      view: this
    });
  }

  updateSaveButtonUI(isSaved) {
    this._updateSaveButtonUI(isSaved);
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

            <div class="story-detail-actions">
              <button id="save-story-button" class="save-button" data-story-id="${story.id}">
                <i class="far fa-bookmark"></i>
                <span>Save Story</span>
              </button>
            </div>
          </div>
        </section>
      </article>
    `;

    const backButton = storyContent.querySelector('.back-button');
    if (backButton) {
      backButton.addEventListener('click', (event) => {
        event.preventDefault();
        window.history.back();
      });
    }

    this._setupSaveButton(story);
  }

  async _setupSaveButton(story) {
    const saveButton = document.getElementById('save-story-button');
    if (!saveButton) return;

    const isSaved = await this._checkIfSaved(story.id);
    this._updateSaveButtonUI(isSaved);

    saveButton.addEventListener('click', async () => {
      await this._toggleSaveStory(story);
    });
  }

  async _checkIfSaved(storyId) {
    try {
      const { getStory } = await import('../../data/idb-helper');
      const savedStory = await getStory(storyId);
      return !!savedStory;
    } catch (error) {
      console.error('Error checking if story is saved:', error);
      return false;
    }
  }

  async _toggleSaveStory(story) {
    try {
      const { getStory, putStory, deleteStory } = await import('../../data/idb-helper');
      const savedStory = await getStory(story.id);

      if (savedStory) {
        await deleteStory(story.id);
        this._updateSaveButtonUI(false);
        this._showToast('Story removed from saved stories', 'success');
      } else {
        await putStory(story);
        this._updateSaveButtonUI(true);
        this._showToast('Story saved successfully', 'success');
      }
    } catch (error) {
      console.error('Error toggling save story:', error);
      this._showToast('Failed to save story. Please try again.', 'error');
    }
  }

  _updateSaveButtonUI(isSaved) {
    const saveButton = document.getElementById('save-story-button');
    if (saveButton) {
      if (isSaved) {
        saveButton.classList.add('saved');
        saveButton.innerHTML = '<i class="fas fa-bookmark"></i><span>Saved</span>';
      } else {
        saveButton.classList.remove('saved');
        saveButton.innerHTML = '<i class="far fa-bookmark"></i><span>Save Story</span>';
      }
    }
  }

  _showToast(message, icon = 'success') {
    Swal.fire({
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      timer: 3000,
      icon: icon,
      title: message,
    });
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
