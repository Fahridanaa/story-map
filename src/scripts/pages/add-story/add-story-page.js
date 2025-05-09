import storyData from '../../data/story-data';
import AddStoryPresenter from './add-story-presenter';
import Swal from 'sweetalert2';

export default class AddStoryPage {
    #presenter;
    #mapElement;
    #mapMessageElement;
    #useCurrentLocationButton;
    #clearLocationButton;
    #selectedLocationTextElement;

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
              <div id="selected-location-text" class="selected-location-info" style="display: none; margin-bottom: 0.5rem; font-style: italic;"></div>
              <div id="map-message" class="map-offline-message" style="display: none; padding: 1rem; text-align: center; background-color: #f0f0f0; border-radius: var(--border-radius);">Location selection is not available while offline.</div>
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

        this.#mapElement = document.getElementById('map');
        this.#mapMessageElement = document.getElementById('map-message');
        this.#useCurrentLocationButton = document.getElementById('use-current-location');
        this.#clearLocationButton = document.getElementById('clear-location');
        this.#selectedLocationTextElement = document.getElementById('selected-location-text');

        this.initializeComponents();
        this.addConnectionListeners();
    }

    addConnectionListeners() {
        window.addEventListener('online', () => this.#presenter.handleConnectionChange());
        window.addEventListener('offline', () => this.#presenter.handleConnectionChange());
    }

    removeConnectionListeners() {
        window.removeEventListener('online', () => this.#presenter.handleConnectionChange());
        window.removeEventListener('offline', () => this.#presenter.handleConnectionChange());
    }

    updateLocationUIForConnection(isOnline) {
        if (!this.#mapElement || !this.#mapMessageElement || !this.#useCurrentLocationButton || !this.#clearLocationButton || !this.#selectedLocationTextElement) {
            console.error('Location UI elements not found for connection update.');
            return;
        }

        if (isOnline) {
            this.#mapElement.style.display = 'block';
            this.#mapMessageElement.style.display = 'none';
            this.#useCurrentLocationButton.disabled = false;
            this.#clearLocationButton.disabled = false;
            this.#presenter.initMap();
        } else {
            this.#mapElement.style.display = 'none';
            this.#mapMessageElement.style.display = 'block';
            this.#useCurrentLocationButton.disabled = false;
            this.#clearLocationButton.disabled = false;
        }
    }

    updateSelectedLocationDisplay(position, isLastKnownOrOffline) {
        if (!this.#selectedLocationTextElement) return;

        if (position && typeof position.lat === 'number' && typeof position.lng === 'number') {
            const lat = position.lat.toFixed(5);
            const lng = position.lng.toFixed(5);
            let text = `Selected: ${lat}, ${lng}`;
            if (isLastKnownOrOffline && !navigator.onLine) {
                text = `Last known (offline): ${lat}, ${lng}`;
            } else if (isLastKnownOrOffline && navigator.onLine) {
                text = `Current (auto-filled): ${lat}, ${lng}`;
            }
            this.#selectedLocationTextElement.textContent = text;
            this.#selectedLocationTextElement.style.display = 'block';
        } else {
            this.#selectedLocationTextElement.textContent = '';
            this.#selectedLocationTextElement.style.display = 'none';
        }
    }

    async initializeComponents() {
        try {
            this.updateLocationUIForConnection(navigator.onLine);
            await this.#presenter.checkAndAutofillLocationOnLoad();
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
        this.#useCurrentLocationButton = document.getElementById('use-current-location');
        this.#clearLocationButton = document.getElementById('clear-location');

        if (addStoryForm) {
            addStoryForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const description = document.getElementById('description').value;
                await this.#presenter.submitStory(description);
            });
        }

        if (this.#useCurrentLocationButton) {
            this.#useCurrentLocationButton.addEventListener('click', () => {
                this.#presenter.getCurrentLocation();
            });
        }

        if (this.#clearLocationButton) {
            this.#clearLocationButton.addEventListener('click', () => {
                this.#presenter.clearLocation();
            });
        }
    }

    setLocationLoading(isLoading) {
        if (!this.#useCurrentLocationButton) return;
        const isAutofill = !this.#useCurrentLocationButton.matches(':focus-within');

        if (isLoading) {
            this.#useCurrentLocationButton.disabled = true;
            if (!isAutofill) {
                this.#useCurrentLocationButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Getting Location...';
            }
        } else {
            this.#useCurrentLocationButton.disabled = false;
            if (!isAutofill || this.#useCurrentLocationButton.textContent.includes('Getting')) {
                this.#useCurrentLocationButton.innerHTML = '<i class="fas fa-location-arrow" aria-hidden="true"></i> Use Current Location';
            }
            this.updateLocationUIForConnection(navigator.onLine);
        }
    }

    showError(message) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    }

    showSuccess(message) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    }

    resetForm() {
        const addStoryForm = document.getElementById('add-story-form');
        if (addStoryForm) {
            addStoryForm.reset();
        }
        const capturedPhotoElement = document.getElementById('captured-photo');
        if (capturedPhotoElement) {
            capturedPhotoElement.style.display = 'none';
            capturedPhotoElement.src = '#';
        }
        const capturedPhotoContainer = document.getElementById('captured-photo-container');
        if (capturedPhotoContainer) {
            capturedPhotoContainer.style.display = 'none';
        }
        if (this.#presenter) {
            this.#presenter.clearLocation();
        }
    }

    destroy() {
        this.removeConnectionListeners();
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

        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}
