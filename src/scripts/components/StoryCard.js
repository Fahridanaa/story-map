export class StoryCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    setStory(story) {
        this.story = story;
        this.render();
    }

    updateSaveButtonUI(isSaved) {
        this._updateSaveButtonUI(isSaved);
    }

    render() {
        if (!this.story) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-bottom: 1rem;
                }

                .story-card {
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .story-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                }

                .story-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                }

                .story-content {
                    padding: 1rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .story-title {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                    color: #2c3e50;
                }

                .story-description {
                    color: #666;
                    margin-bottom: 0.5rem;
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                }

                .story-location {
                    display: flex;
                    align-items: center;
                    color: #166088;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .story-location i {
                    margin-right: 0.5rem;
                }

                .story-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                }

                .view-details-link {
                    display: inline-block;
                    color: #4a6fa5;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .view-details-link:hover {
                    color: #166088;
                    text-decoration: underline;
                }

                .save-button {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    padding: 0.375rem 0.75rem;
                    font-size: 0.875rem;
                    color: #495057;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                }

                .save-button:hover {
                    background-color: #e9ecef;
                }

                .save-button.saved {
                    background-color: #e3f2fd;
                    color: #0d6efd;
                    border-color: #0d6efd;
                }

                .save-button.favorite {
                    background-color: #fff3cd;
                    color: #ffc107;
                    border-color: #ffc107;
                }

                .save-button i {
                    margin-right: 0.5rem;
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .slide-in {
                    animation: slideIn 0.5s ease forwards;
                }
            </style>

            <div class="story-card slide-in" style="view-transition-name: story-card-${this.story.id}">
                <img class="story-image" src="${this.story.photoUrl}" alt="Story image: ${this.story.description.substring(0, 50)}..." style="view-transition-name: story-image-${this.story.id}" onerror="this.onerror=null;">

                <div class="story-content">
                    <h2 class="story-title">Story by ${this.story.name}</h2>
                    <p class="story-description">${this.story.description}</p>

                    <div class="story-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Location: ${this.story.lat}, ${this.story.lon}</span>
                    </div>

                    <div class="story-actions">
                        <a class="view-details-link" href="#/story/${this.story.id}" data-story-id="${this.story.id}">View Details</a>
                        <button class="save-button" id="save-button-${this.story.id}" data-story-id="${this.story.id}">
                            <i class="far fa-bookmark"></i>
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this._setupSaveButton();
    }

    _setupSaveButton() {
        const saveButton = this.shadowRoot.querySelector(`#save-button-${this.story.id}`);
        if (saveButton) {
            this._checkIfSaved().then(isSaved => {
                this._updateSaveButtonUI(isSaved);
            });

            saveButton.addEventListener('click', async (event) => {
                event.preventDefault();
                await this._toggleSaveStory();
            });
        }
    }

    async _checkIfSaved() {
        try {
            const { getStory } = await import('../data/idb-helper');
            const storyFromDb = await getStory(this.story.id);
            return !!storyFromDb;
        } catch (error) {
            console.error('Error checking if story is saved:', error);
            return false;
        }
    }

    async _toggleSaveStory() {
        try {
            const { getStory, putStory, deleteStory } = await import('../data/idb-helper');
            const storyFromDb = await getStory(this.story.id);

            if (storyFromDb) {
                await deleteStory(this.story.id);
                this._updateSaveButtonUI(false);
                this._showToast('Story removed from saved list', 'success');

                const isOnSavedStoriesPage = window.location.hash.includes('/saved');
                if (isOnSavedStoriesPage) {
                    this.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    this.style.opacity = '0';
                    this.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        this.remove();
                        const storyList = document.querySelector('#story-list');
                        if (storyList && storyList.children.length === 0) {
                            const noSavedStories = document.querySelector('#no-saved-stories');
                            if (noSavedStories) {
                                noSavedStories.style.display = 'block';
                            }
                        }
                    }, 300);
                }
            } else {
                await putStory(this.story);
                this._updateSaveButtonUI(true);
                this._showToast('Story saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error toggling save story:', error);
            this._showToast('Failed to update saved state. Please try again.', 'error');
        }
    }

    _updateSaveButtonUI(isSaved) {
        const saveButton = this.shadowRoot.querySelector(`#save-button-${this.story.id}`);
        if (saveButton) {
            if (isSaved) {
                saveButton.classList.add('saved');
                saveButton.innerHTML = '<i class="fas fa-bookmark"></i><span>Saved</span>';
            } else {
                saveButton.classList.remove('saved');
                saveButton.innerHTML = '<i class="far fa-bookmark"></i><span>Save</span>';
            }
        }
    }

    _showToast(message, icon = 'success') {
        import('sweetalert2').then(({ default: Swal }) => {
            Swal.fire({
                toast: true,
                position: 'top-right',
                showConfirmButton: false,
                timer: 3000,
                icon: icon,
                title: message,
            });
        });
    }
}

customElements.define('story-card', StoryCard);
