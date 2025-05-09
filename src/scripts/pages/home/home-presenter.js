import CONFIG from '../../config';
import authModel from '../../data/auth-model';

export default class HomePresenter {
    #model;
    #view;
    #map;
    #markers;
    #currentPage;
    #stories;
    #isLoading;
    #baseLayers;
    #overlayLayers;
    #lastScrollPosition;

    constructor({ model, view }) {
        this.#model = model;
        this.#view = view;
        this.#map = null;
        this.#markers = [];
        this.#currentPage = 1;
        this.#stories = [];
        this.#isLoading = false;
        this.#baseLayers = {};
        this.#overlayLayers = {};
        this.#lastScrollPosition = 0;
    }

    async loadStories() {
        if (this.#isLoading) return;

        this.#isLoading = true;
        this.#view.showLoadingIndicator(true);

        try {
            const stories = await this.#model.getStories(this.#currentPage);

            if (this.#currentPage === 1) {
                this.#stories = stories;
            } else {
                const existingIds = new Set(this.#stories.map(story => story.id));

                const newStories = stories.filter(story => !existingIds.has(story.id));

                if (newStories.length != 0) {
                    this.#stories = [...this.#stories, ...newStories];
                }
            }

            this.#view.renderStories(this.#stories);
        } catch (error) {
            console.error('Error loading stories:', error);
            this.#view.showError('Failed to load stories. Please try again later.');
        } finally {
            this.#isLoading = false;
            this.#view.showLoadingIndicator(false);
        }
    }

    initMap() {
        const mapContainer = document.getElementById('map-content');

        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        if (this.#map) {
            setTimeout(() => {
                this.#map.invalidateSize();
            }, 100);
            return;
        }

        this.#map = L.map('map-content', {
            maxZoom: 18,
            minZoom: 3,
            maxBounds: L.latLngBounds(
                L.latLng(-90, -180),
                L.latLng(90, 180)
            ),
            maxBoundsViscosity: 1.0
        }).setView([0, 0], 3);

        this.#baseLayers = {
            "Streets": L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${CONFIG.MAP_SERVICE_API_KEY}`, {
                attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
                maxZoom: 18
            }),
            "Satellite": L.tileLayer(`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${CONFIG.MAP_SERVICE_API_KEY}`, {
                attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
                maxZoom: 18
            }),
            "Terrain": L.tileLayer(`https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=${CONFIG.MAP_SERVICE_API_KEY}`, {
                attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
                maxZoom: 18
            })
        };

        this.#overlayLayers = {
            "Traffic": L.tileLayer(`https://api.maptiler.com/maps/traffic/{z}/{x}/{y}.png?key=${CONFIG.MAP_SERVICE_API_KEY}`, {
                attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
                maxZoom: 18,
                opacity: 0.7
            })
        };

        this.#baseLayers["Streets"].addTo(this.#map);

        L.control.layers(this.#baseLayers, this.#overlayLayers, {
            position: 'topright',
            collapsed: false
        }).addTo(this.#map);

        L.control.scale({
            imperial: false,
            position: 'bottomright'
        }).addTo(this.#map);

        setTimeout(() => {
            this.#map.invalidateSize();
        }, 100);
    }

    updateMap(stories) {
        if (!this.#map) {
            console.error('Map not initialized');
            return;
        }

        this.#markers.forEach(marker => {
            this.#map.removeLayer(marker);
        });
        this.#markers = [];

        stories.forEach(story => {
            if (story.lat && story.lon) {
                const marker = L.marker([story.lat, story.lon]).addTo(this.#map);

                const popupContent = `
          <div class="map-popup">
            <img src="${story.photoUrl}" alt="Story image: ${story.description.substring(0, 50)}..." style="width: 100%; max-height: 150px; object-fit: cover; margin-bottom: 10px;">
            <h3>${story.name}</h3>
            <p>${story.description}</p>
          </div>
        `;

                marker.bindPopup(popupContent);

                this.#markers.push(marker);
            }
        });

        if (this.#markers.length > 0) {
            const bounds = L.latLngBounds(this.#markers.map(marker => marker.getLatLng()));
            this.#map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15
            });
        }
    }

    loadMoreStories() {
        this.#currentPage++;
        this.loadStories();
    }

    isUserAuthenticated() {
        return authModel.isAuthenticated();
    }

    saveScrollPosition() {
        const storiesContainer = document.querySelector('.stories-container');
        if (storiesContainer) {
            this.#lastScrollPosition = storiesContainer.scrollTop;
            localStorage.setItem('homeScrollPosition', this.#lastScrollPosition);
        }
    }

    restoreScrollPosition() {
        const storiesContainer = document.querySelector('.stories-container');
        if (storiesContainer) {
            const savedPosition = localStorage.getItem('homeScrollPosition');
            if (savedPosition) {
                setTimeout(() => {
                    storiesContainer.scrollTop = parseInt(savedPosition, 10);
                }, 100);
            }
        }
    }

    destroy() {
        if (this.#map) {
            this.#map.remove();
            this.#map = null;
        }

        this.#isLoading = false;
    }
}
