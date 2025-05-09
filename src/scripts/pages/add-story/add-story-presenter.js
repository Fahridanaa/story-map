import CONFIG from '../../config';

export default class AddStoryPresenter {
    #model;
    #view;
    #map;
    #marker;
    #currentPosition;
    #cameraStream;
    #capturedPhoto;
    #isLoading;

    constructor({ model, view }) {
        this.#model = model;
        this.#view = view;
        this.#map = null;
        this.#marker = null;
        this.#currentPosition = null;
        this.#cameraStream = null;
        this.#capturedPhoto = null;
        this.#isLoading = false;
    }

    initMap() {
        if (this.#map) {
            this.#map.remove();
            this.#map = null;
        }

        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        this.#map = L.map('map', {
            maxZoom: 18,
            minZoom: 2
        }).setView([0, 0], 2);

        setTimeout(() => {
            if (this.#map) {
                L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${CONFIG.MAP_SERVICE_API_KEY}`, {
                    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
                    maxZoom: 18
                }).addTo(this.#map);

                this.#map.on('click', (e) => {
                    this.setMarker(e.latlng);
                });

                this.#map.invalidateSize();
            }
        }, 100);
    }

    setMarker(latlng) {
        if (this.#marker) {
            this.#map.removeLayer(this.#marker);
        }

        this.#marker = L.marker(latlng).addTo(this.#map);
        this.#currentPosition = latlng;
    }

    async startCamera() {
        try {
            this.#view.setCameraLoading(true);
            this.#cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            const video = document.querySelector('#camera-preview video');
            if (video) {
                video.srcObject = this.#cameraStream;
                await video.play().catch(error => {
                    console.error('Error playing video:', error);
                });
            } else {
                console.error('Video element not found');
            }

            this.#view.updateCameraUI(true);
            this.#view.setCameraLoading(false);
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.#view.showError('Could not access camera. Please make sure you have granted camera permissions.');
            this.#view.setCameraLoading(false);
            return false;
        }
    }

    stopCamera() {
        if (this.#cameraStream) {
            this.#cameraStream.getTracks().forEach(track => track.stop());
            this.#cameraStream = null;
        }
        this.#view.updateCameraUI(false);
    }

    capturePhoto(video, canvas) {
        try {
            if (!video || !canvas) {
                console.error('Video or canvas element not found');
                return;
            }

            if (video.paused) {
                console.error('Video is not playing');
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            this.#capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);

            this.#view.displayCapturedPhoto(this.#capturedPhoto);

            this.stopCamera();
        } catch (error) {
            console.error('Error capturing photo:', error);
            this.#view.showError('Failed to capture photo. Please try again.');
        }
    }

    async getCurrentLocation() {
        if (navigator.geolocation) {
            this.#view.setLocationLoading(true);

            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                        this.setMarker(latlng);
                        this.#map.setView(latlng, 15);
                        this.#view.setLocationLoading(false);
                        resolve(latlng);
                    },
                    (error) => {
                        this.#view.showError('Failed to get your location. Please try again or select a location manually.');
                        this.#view.setLocationLoading(false);
                        reject(error);
                    }
                );
            });
        } else {
            this.#view.showError('Geolocation is not supported by your browser.');
            return Promise.reject(new Error('Geolocation not supported'));
        }
    }

    clearLocation() {
        if (this.#marker) {
            this.#map.removeLayer(this.#marker);
            this.#marker = null;
        }
        this.#currentPosition = null;
    }

    async submitStory(description) {
        if (this.#isLoading) return false;

        if (!this.#capturedPhoto) {
            this.#view.showError('Please take a photo for your story.');
            return false;
        }

        if (!description) {
            this.#view.showError('Please provide a story description.');
            return false;
        }

        try {
            this.#view.setLoading(true);
            this.#isLoading = true;

            const response = await fetch(this.#capturedPhoto);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('description', description);
            formData.append('photo', file);

            if (this.#currentPosition) {
                formData.append('lat', this.#currentPosition.lat);
                formData.append('lon', this.#currentPosition.lng);
            }

            await this.#model.addStory(formData);
            this.#view.showSuccess('Story added successfully!');

            this.resetForm();

            setTimeout(() => {
                window.location.hash = '/';
            }, 2000);

            return true;
        } catch (error) {
            this.#view.showError(error.message || 'Failed to add story. Please try again.');
            this.#view.setLoading(false);
            this.#isLoading = false;
            return false;
        }
    }

    resetForm() {
        this.#view.resetForm();
        this.#capturedPhoto = null;
        this.clearLocation();
    }

    destroy() {
        if (this.#map) {
            this.#map.remove();
            this.#map = null;
        }

        if (this.#marker) {
            this.#marker = null;
        }

        if (this.#cameraStream) {
            this.#cameraStream.getTracks().forEach(track => track.stop());
            this.#cameraStream = null;
        }

        this.#capturedPhoto = null;
        this.#isLoading = false;
    }
}
