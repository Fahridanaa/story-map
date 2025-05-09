export class StoryCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    setStory(story) {
        this.story = story;
        this.render();
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

                .view-details-link {
                    display: inline-block;
                    margin-top: 1rem;
                    color: #4a6fa5;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .view-details-link:hover {
                    color: #166088;
                    text-decoration: underline;
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
                <img class="story-image" src="${this.story.photoUrl}" alt="Story image: ${this.story.description.substring(0, 50)}..." style="view-transition-name: story-image-${this.story.id}" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Image+Not+Available';">

                <div class="story-content">
                    <h2 class="story-title">Story by ${this.story.name}</h2>
                    <p class="story-description">${this.story.description}</p>

                    <div class="story-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Location: ${this.story.lat}, ${this.story.lon}</span>
                    </div>

                    <a class="view-details-link" href="#/story/${this.story.id}" data-story-id="${this.story.id}">View Details</a>
                </div>
            </div>
        `;
    }
}

customElements.define('story-card', StoryCard);
