import CONFIG from '../../config';
import { addPendingStory } from '../../data/idb-helper';
import authModel from '../../data/auth-model';

const LAST_KNOWN_LAT_KEY = 'lastKnownLat';
const LAST_KNOWN_LON_KEY = 'lastKnownLon';

export default class AddStoryPresenter {
    #model;
    #view;
    #map;
    #marker;
    #currentPosition;
    #cameraStream;
    #capturedPhoto;
    #isLoading;
    #lastKnownLocation;

    constructor({ model, view }) {
        this.#model = model;
        this.#view = view;
        this.#map = null;
        this.#marker = null;
        this.#currentPosition = null;
        this.#cameraStream = null;
        this.#capturedPhoto = null;
        this.#isLoading = false;
        this.#lastKnownLocation = this.getLastKnownLocationFromStorage();
    }

    getLastKnownLocationFromStorage() {
        const lat = localStorage.getItem(LAST_KNOWN_LAT_KEY);
        const lon = localStorage.getItem(LAST_KNOWN_LON_KEY);
        if (lat && lon) {
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        }
        return null;
    }

    saveLastKnownLocation(lat, lng) {
        localStorage.setItem(LAST_KNOWN_LAT_KEY, lat.toString());
        localStorage.setItem(LAST_KNOWN_LON_KEY, lng.toString());
        this.#lastKnownLocation = { lat, lng };
    }

    async checkAndAutofillLocationOnLoad() {
        if (!navigator.onLine) {
            if (this.#lastKnownLocation) {
                console.log('Offline on load, using last known location.');
                this.setMarker(L.latLng(this.#lastKnownLocation.lat, this.#lastKnownLocation.lng), true);
            }
            return;
        }

        try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            if (permissionStatus.state === 'granted') {
                console.log('Geolocation permission granted, attempting to autofill location.');
                await this.getCurrentLocation(true);
            } else if (permissionStatus.state === 'prompt') {
                console.log('Geolocation permission prompt will be shown on user interaction.');
            } else {
                console.log('Geolocation permission denied.');
            }
        } catch (error) {
            console.warn('Could not query geolocation permission status:', error);
        }
    }

    handleConnectionChange() {
        const isOnline = navigator.onLine;
        this.#view.updateLocationUIForConnection(isOnline);
        if (isOnline) {
            setTimeout(() => {
                if (this.#map) this.#map.invalidateSize();
                if (this.#currentPosition && this.#map) {
                    this.setMarker(L.latLng(this.#currentPosition.lat, this.#currentPosition.lng));
                }
            }, 150);
        }
    }

    initMap() {
        if (!navigator.onLine) {
            this.#view.updateLocationUIForConnection(false);
            return;
        }

        if (this.#map) {
            this.#map.remove();
            this.#map = null;
        }

        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            return;
        }
        if (mapContainer.offsetParent === null) {
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
                if (this.#currentPosition) {
                    this.setMarker(L.latLng(this.#currentPosition.lat, this.#currentPosition.lng));
                }
            }
        }, 100);
    }

    setMarker(latlng, isLastKnown = false) {
        this.#currentPosition = { lat: latlng.lat, lng: latlng.lng };

        if (navigator.onLine && this.#map) {
            if (this.#marker) {
                this.#map.removeLayer(this.#marker);
            }
            this.#marker = L.marker(latlng).addTo(this.#map);
            this.#map.setView(latlng, this.#map.getZoom() || 15);
        }
        this.#view.updateSelectedLocationDisplay(this.#currentPosition, isLastKnown || !navigator.onLine);
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

    async getCurrentLocation(isAutofill = false) {
        if (!navigator.onLine) {
            this.#view.setLocationLoading(true);
            const lastKnown = this.getLastKnownLocationFromStorage();
            if (lastKnown) {
                console.log('Offline, using last known location from storage.');
                const latlng = L.latLng(lastKnown.lat, lastKnown.lng);
                this.setMarker(latlng, true);
                this.#view.setLocationLoading(false);
                this.#view.showSuccess('Using last known location (offline).');
                return Promise.resolve(latlng);
            }
            this.#view.showError('Cannot get current location while offline. No last known location available.');
            this.#view.setLocationLoading(false);
            return Promise.reject(new Error('Offline and no last known location'));
        }

        if (navigator.geolocation) {
            if (!isAutofill) this.#view.setLocationLoading(true);

            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
                        this.saveLastKnownLocation(position.coords.latitude, position.coords.longitude);
                        this.setMarker(latlng);
                        if (!isAutofill) this.#view.setLocationLoading(false);
                        resolve(latlng);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        if (!isAutofill) {
                            this.#view.showError('Failed to get your location. Please try again or select a location manually.');
                        }
                        if (!isAutofill) this.#view.setLocationLoading(false);
                        reject(error);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });
        } else {
            if (!isAutofill) this.#view.showError('Geolocation is not supported by your browser.');
            if (!isAutofill) this.#view.setLocationLoading(false);
            return Promise.reject(new Error('Geolocation not supported'));
        }
    }

    clearLocation() {
        if (this.#marker && this.#map) {
            this.#map.removeLayer(this.#marker);
            this.#marker = null;
        }
        this.#currentPosition = null;
        this.#view.updateSelectedLocationDisplay(null, false);
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

        if (!this.#currentPosition) {
            this.#view.showError('Please select a location for your story.');
            return false;
        }

        this.#view.setLoading(true);
        this.#isLoading = true;

        try {
            const userToken = authModel.getToken();

            const storyDataObject = {
                description,
                photo: this.#capturedPhoto,
                lat: this.#currentPosition ? this.#currentPosition.lat : null,
                lon: this.#currentPosition ? this.#currentPosition.lng : null,
                token: userToken,
            };

            if (!navigator.onLine) {
                console.log('App is offline. Storing story for background sync.');
                await addPendingStory(storyDataObject);

                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.sync.register('add-story-sync');
                        this.#view.showSuccess('You are offline. Story saved and will be uploaded when connection is back!');
                    } catch (syncError) {
                        console.error('Background sync registration failed:', syncError);
                        this.#view.showError('Story saved locally, but background sync could not be set up. It will be uploaded later.');
                    }
                } else {
                    this.#view.showSuccess('You are offline. Story saved locally and will be uploaded when connection is back!');
                }

                this.resetForm();
                this.#view.setLoading(false);
                this.#isLoading = false;

                setTimeout(() => {
                    if (window.location.hash === '#/add-story') {
                        window.location.hash = '/';
                    }
                }, 2000);
                return true;
            }

            const response = await fetch(storyDataObject.photo);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('description', storyDataObject.description);
            formData.append('photo', file);

            if (storyDataObject.lat && storyDataObject.lon) {
                formData.append('lat', storyDataObject.lat);
                formData.append('lon', storyDataObject.lon);
            }

            await this.#model.addStory(formData);
            this.#view.showSuccess('Story added successfully!');

            this.resetForm();

            setTimeout(() => {
                window.location.hash = '/';
            }, 2000);

            return true;

        } catch (error) {
            console.error('Error submitting story:', error);
            this.#view.showError(error.message || 'Failed to add story. Please try again.');
            return false;
        } finally {
            if (this.#isLoading) {
                this.#view.setLoading(false);
                this.#isLoading = false;
            }
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
