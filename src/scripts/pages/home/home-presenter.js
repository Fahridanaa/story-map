import CONFIG from '../../config';
import authModel from '../../data/auth-model';
import { getAllStories, getAllPendingStories } from '../../data/idb-helper';

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
    #hasMoreStories;
    #pageSize;
    #isStateRestored;

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
        this.#hasMoreStories = true;
        this.#pageSize = 10;
        this.#isStateRestored = false;
    }

    get hasMoreStories() {
        return this.#hasMoreStories;
    }

    get isLoading() {
        return this.#isLoading;
    }

    get isStateRestored() {
        return this.#isStateRestored;
    }

    restorePageState() {
        try {
            const savedScroll = localStorage.getItem('homeScrollPosition');
            if (savedScroll) {
                this.#lastScrollPosition = parseInt(savedScroll, 10);
            }

            const savedPage = localStorage.getItem('homeCurrentPage');
            if (savedPage) {
                const pageNumber = parseInt(savedPage, 10);
                if (!isNaN(pageNumber) && pageNumber > 0) {
                    this.#currentPage = pageNumber;
                    this.#isStateRestored = true;
                } else {
                    this.#isStateRestored = false;
                    this.#currentPage = 1;
                }
            } else {
                this.#isStateRestored = false;
                this.#currentPage = 1;
            }
        } catch (error) {
            console.error('Error restoring page state:', error);
            localStorage.removeItem('homeScrollPosition');
            localStorage.removeItem('homeCurrentPage');
            this.#isStateRestored = false;
            this.#currentPage = 1;
            this.#lastScrollPosition = 0;
        }
    }

    savePageState() {
        const storiesContainer = document.querySelector('.stories-container');
        if (storiesContainer) {
            this.#lastScrollPosition = storiesContainer.scrollTop;
            localStorage.setItem('homeScrollPosition', this.#lastScrollPosition.toString());
        }
        localStorage.setItem('homeCurrentPage', this.#currentPage.toString());
    }

    applyRestoredScrollPosition() {
        if (this.#isStateRestored && this.#lastScrollPosition > 0) {
            const storiesContainer = document.querySelector('.stories-container');
            if (storiesContainer) {
                setTimeout(() => {
                    storiesContainer.scrollTop = this.#lastScrollPosition;
                }, 100);
            }
        }
    }

    async loadInitialStories() {
        this.restorePageState();

        const targetPageToLoad = this.#isStateRestored ? this.#currentPage : 1;

        this.#stories = [];
        this.#hasMoreStories = true;

        for (let pageNumToLoad = 1; pageNumToLoad <= targetPageToLoad; pageNumToLoad++) {
            if (!this.#hasMoreStories && pageNumToLoad > 1) {
                break;
            }
            this.#currentPage = pageNumToLoad;

            await this.loadStories(pageNumToLoad > 1);
        }
    }

    async loadStories(isLoadMoreOperation = false) {
        if (this.#isLoading) return;

        if (isLoadMoreOperation && !this.#hasMoreStories) {
            this.#view.updateLoadMoreButtonVisibility();
            return;
        }

        this.#isLoading = true;
        this.#view.showLoadingIndicator(true);

        try {
            if (!isLoadMoreOperation) {
                this.#stories = [];
                this.#hasMoreStories = true;
            }

            if (!navigator.onLine) {
                if (!isLoadMoreOperation) {
                    const savedStories = await getAllStories();
                    const pendingStoriesFromDb = await getAllPendingStories();

                    const adaptedPendingStories = pendingStoriesFromDb.map(pStory => ({
                        ...pStory,
                        id: pStory.tempId,
                        photoUrl: pStory.photo,
                        name: pStory.name || 'Pending Story',
                        isPending: true
                    }));

                    let combinedStories = [];
                    if (savedStories && savedStories.length > 0) {
                        combinedStories = [...savedStories];
                    }
                    combinedStories = [...adaptedPendingStories, ...combinedStories];

                    if (combinedStories.length > 0) {
                        this.#stories = combinedStories;
                    } else {
                        this.#stories = [];
                    }
                }
                this.#hasMoreStories = false;
                this.#view.renderStories(this.#stories);
                this.#view.showOfflineMessage(true);
                return;
            }

            const fetchedStories = await this.#model.getStories(this.#currentPage, this.#pageSize);

            if (fetchedStories && fetchedStories.length > 0) {
                if (isLoadMoreOperation) {
                    const existingIds = new Set(this.#stories.map(story => story.id));
                    const newStoriesToAdd = fetchedStories.filter(story => !existingIds.has(story.id));
                    this.#stories = [...this.#stories, ...newStoriesToAdd];
                } else {
                    this.#stories = fetchedStories;
                }
                this.#hasMoreStories = fetchedStories.length === this.#pageSize;
            } else {
                if (!isLoadMoreOperation) {
                    this.#stories = [];
                }
                this.#hasMoreStories = false;
            }

            this.#view.renderStories(this.#stories);
            this.#view.showOfflineMessage(false);

        } catch (error) {
            console.error(`Error loading stories (page ${this.#currentPage}):`, error);
            this.#view.showError('Failed to load stories. Please try again later.');
            if (!navigator.onLine && !isLoadMoreOperation) {
                try {
                    const savedStories = await getAllStories();
                    if (savedStories && savedStories.length > 0) {
                        this.#stories = savedStories;
                    } else {
                        this.#stories = [];
                    }
                    this.#view.renderStories(this.#stories);
                    this.#view.showOfflineMessage(true);
                } catch (dbError) {
                    console.error('Error loading saved stories after network failure:', dbError);
                }
            }
            this.#hasMoreStories = false;
        } finally {
            this.#isLoading = false;
            this.#view.showLoadingIndicator(false);
            this.#view.updateLoadMoreButtonVisibility();
        }
    }

    initMap() {
        const mapContainer = document.getElementById('map-content');

        if (!mapContainer) {
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
        if (!this.#isLoading && this.#hasMoreStories) {
            this.#currentPage++;
            this.loadStories(true);
        }
    }

    isUserAuthenticated() {
        return authModel.isAuthenticated();
    }

    destroy() {
        if (this.#map) {
            this.#map.remove();
            this.#map = null;
        }

        this.#isLoading = false;
    }
}
