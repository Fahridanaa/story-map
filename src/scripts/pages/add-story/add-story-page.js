import storyData from '../../data/story-data';
import AddStoryPresenter from './add-story-presenter';

export default class AddStoryPage {
    #presenter;

    constructor() {
        this.#presenter = new AddStoryPresenter({
            model: storyData,
            view: this
        });
    }

    async render() {
        return `
        <div class="add-story-container">
          <h1>Add Your Story</h1>
          <form id="add-story-form" class="add-story-form" aria-labelledby="add-story-heading">
            <div class="form-group">
              <label for="description" id="description-label">Story Description</label>
              <textarea
                id="description"
                name="description"
                required
                aria-required="true"
                aria-labelledby="description-label"
                placeholder="Describe your story..."
              ></textarea>
            </div>
            <div class="form-group">
              <label id="photo-label">Photo</label>
              <div class="camera-container" aria-labelledby="photo-label">
                <div id="camera-preview" aria-label="Camera preview">
                  <video autoplay playsinline aria-hidden="true"></video>
                  <div id="captured-photo-container" aria-label="Captured photo">
                    <img id="captured-photo" style="width: 100%; height: 100%; object-fit: contain;" alt="Captured photo">
                  </div>
                </div>
                <canvas id="photo-canvas" style="display: none;" aria-hidden="true"></canvas>

                <div class="camera-controls" role="toolbar" aria-label="Camera controls">
                  <button type="button" id="start-camera" class="camera-button" aria-label="Start camera">
                    <i class="fas fa-camera" aria-hidden="true"></i> Start Camera
                  </button>
                  <button type="button" id="stop-camera" class="camera-button" style="display: none;" aria-label="Stop camera">
                    <i class="fas fa-stop" aria-hidden="true"></i> Stop Camera
                  </button>
                  <button type="button" id="capture-photo" class="camera-button" disabled aria-label="Capture photo">
                    <i class="fas fa-camera" aria-hidden="true"></i> Capture Photo
                  </button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label id="location-label">Location</label>
              <div id="map" class="story-map" aria-labelledby="location-label" role="application" aria-label="Map for selecting story location"></div>
              <div class="location-controls" role="toolbar" aria-label="Location controls">
                <button type="button" id="use-current-location" class="location-button" aria-label="Use current location">
                  <i class="fas fa-location-arrow" aria-hidden="true"></i>
                  Use Current Location
                </button>
                <button type="button" id="clear-location" class="location-button" aria-label="Clear selected location">
                  <i class="fas fa-times" aria-hidden="true"></i>
                  Clear Location
                </button>
              </div>
            </div>
            <button type="submit" class="submit-button" id="submit-button" aria-label="Submit your story">
              <i class="fas fa-paper-plane" aria-hidden="true"></i>
              <span class="button-text">Submit Story</span>
              <div class="loading-spinner" style="display: none;" aria-hidden="true">
                <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
              </div>
            </button>
          </form>
        </div>
    `;
    }

    async afterRender() {
        const addStoryContainer = document.querySelector('.add-story-container');
        if (addStoryContainer) {
            addStoryContainer.style.opacity = '1';
        }

        this.initializeComponents();
    }

    async initializeComponents() {
        try {
            await this.#presenter.initMap();

            this.initCamera();

            this.addEventListeners();
        } catch (error) {
            console.error('Error initializing components:', error);
            this.showError('Failed to initialize some components. Please refresh the page.');
        }
    }

    setupAuthStateListener() {
        window.addEventListener('hashchange', async () => {
            try {
                this.destroy();

                if (window.location.hash === '#/add-story') {
                    await this.initializeComponents();
                }
            } catch (error) {
                console.error('Error handling hash change:', error);
            }
        });
    }

    initCamera() {
        const startButton = document.getElementById('start-camera');
        const stopButton = document.getElementById('stop-camera');
        const captureButton = document.getElementById('capture-photo');
        const video = document.querySelector('#camera-preview video');
        const canvas = document.getElementById('photo-canvas');
        const capturedPhoto = document.getElementById('captured-photo');
        const capturedPhotoContainer = document.getElementById('captured-photo-container');

        if (!startButton || !stopButton || !captureButton || !video || !canvas || !capturedPhoto || !capturedPhotoContainer) {
            console.error('Camera elements not found');
            return;
        }

        startButton.style.display = 'block';
        stopButton.style.display = 'none';
        captureButton.disabled = true;
        capturedPhotoContainer.style.display = 'none';
        capturedPhoto.style.display = 'none';
        video.style.display = 'none';

        startButton.addEventListener('click', async () => {
            await this.#presenter.startCamera();
        });

        stopButton.addEventListener('click', () => {
            this.#presenter.stopCamera();
        });

        captureButton.addEventListener('click', () => {
            this.#presenter.capturePhoto(video, canvas);
        });
    }

    updateCameraUI(isCameraActive) {
        const startButton = document.getElementById('start-camera');
        const stopButton = document.getElementById('stop-camera');
        const captureButton = document.getElementById('capture-photo');
        const video = document.querySelector('#camera-preview video');
        const capturedPhoto = document.getElementById('captured-photo');
        const capturedPhotoContainer = document.getElementById('captured-photo-container');

        if (isCameraActive) {
            startButton.style.display = 'none';
            stopButton.style.display = 'block';
            captureButton.disabled = false;

            if (capturedPhotoContainer) {
                capturedPhotoContainer.style.display = 'none';
            }
            if (capturedPhoto) {
                capturedPhoto.style.display = 'none';
            }
            if (video) {
                video.style.display = 'block';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
            }
        } else {
            if (video) {
                video.style.display = 'none';
            }
            startButton.style.display = 'block';
            stopButton.style.display = 'none';
            captureButton.disabled = true;
        }
    }

    displayCapturedPhoto(photoData) {
        const capturedPhoto = document.getElementById('captured-photo');
        const capturedPhotoContainer = document.getElementById('captured-photo-container');
        const video = document.querySelector('#camera-preview video');

        if (!capturedPhoto || !capturedPhotoContainer) {
            console.error('Captured photo elements not found');
            return;
        }

        capturedPhoto.src = photoData;

        capturedPhotoContainer.style.display = 'block';
        capturedPhoto.style.display = 'block';

        if (video) {
            video.style.display = 'none';
        }
    }

    setCameraLoading(isLoading) {
        const startButton = document.getElementById('start-camera');
        if (!startButton) return;

        if (isLoading) {
            startButton.disabled = true;
            startButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Starting Camera...';
        } else {
            startButton.disabled = false;
            startButton.innerHTML = '<i class="fas fa-camera" aria-hidden="true"></i> Start Camera';
        }
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        const button = document.getElementById('submit-button');
        if (!button) return;

        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.loading-spinner');
        const icon = button.querySelector('.fa-paper-plane');

        if (isLoading) {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.classList.add('disabled');
            buttonText.textContent = 'Submitting...';
            icon.style.display = 'none';
            spinner.style.display = 'inline-block';
            spinner.setAttribute('aria-hidden', 'false');
        } else {
            button.disabled = false;
            button.setAttribute('aria-disabled', 'false');
            button.classList.remove('disabled');
            buttonText.textContent = 'Submit Story';
            icon.style.display = 'inline-block';
            spinner.style.display = 'none';
            spinner.setAttribute('aria-hidden', 'true');
        }
    }

    addEventListeners() {
        const addStoryForm = document.getElementById('add-story-form');
        const useCurrentLocationButton = document.getElementById('use-current-location');
        const clearLocationButton = document.getElementById('clear-location');

        if (addStoryForm) {
            addStoryForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const description = document.getElementById('description').value;
                await this.#presenter.submitStory(description);
            });
        }

        if (useCurrentLocationButton) {
            useCurrentLocationButton.addEventListener('click', () => {
                this.#presenter.getCurrentLocation();
            });
        }

        if (clearLocationButton) {
            clearLocationButton.addEventListener('click', () => {
                this.#presenter.clearLocation();
            });
        }
    }

    setLocationLoading(isLoading) {
        const button = document.getElementById('use-current-location');
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Getting Location...';
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-location-arrow" aria-hidden="true"></i> Use Current Location';
        }
    }

    showError(message) {
        const addStoryContainer = document.querySelector('.add-story-container');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message fade-in';
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        errorElement.innerHTML = `
      <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

        const existingError = addStoryContainer.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        addStoryContainer.insertBefore(errorElement, addStoryContainer.firstChild);

        setTimeout(() => {
            errorElement.remove();
        }, 3000);
    }

    showSuccess(message) {
        const addStoryContainer = document.querySelector('.add-story-container');
        const successElement = document.createElement('div');
        successElement.className = 'success-message fade-in';
        successElement.setAttribute('role', 'status');
        successElement.setAttribute('aria-live', 'polite');
        successElement.innerHTML = `
      <i class="fas fa-check-circle" aria-hidden="true"></i>
      <p>${message}</p>
    `;

        const existingSuccess = addStoryContainer.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        addStoryContainer.insertBefore(successElement, addStoryContainer.firstChild);

        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }

    resetForm() {
        const addStoryForm = document.getElementById('add-story-form');
        addStoryForm.reset();
        document.getElementById('captured-photo').style.display = 'none';
    }

    destroy() {
        try {
            const video = document.querySelector('#camera-preview video');
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }

            if (this.#presenter) {
                this.#presenter.destroy();
            }

            const addStoryForm = document.getElementById('add-story-form');
            if (addStoryForm) {
                addStoryForm.removeEventListener('submit', this.handleSubmit);
            }

            const useCurrentLocationButton = document.getElementById('use-current-location');
            if (useCurrentLocationButton) {
                useCurrentLocationButton.removeEventListener('click', this.handleUseCurrentLocation);
            }

            const clearLocationButton = document.getElementById('clear-location');
            if (clearLocationButton) {
                clearLocationButton.removeEventListener('click', this.handleClearLocation);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}
