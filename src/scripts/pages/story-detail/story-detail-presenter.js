export default class StoryDetailPresenter {
    #storyId;
    #model;
    #view;

    constructor(storyId, { model, view }) {
        this.#storyId = storyId;
        this.#model = model;
        this.#view = view;
    }

    async getStoryDetail() {
        try {
            if (!this.#storyId) {
                this.#view.showError('Invalid story ID. Please return to the stories list and try again.');
                return null;
            }

            const story = await this.#model.getStoryDetail(this.#storyId);
            this.#view.renderStoryDetail(story);
            return story;
        } catch (error) {
            console.error('Error loading story detail:', error);
            this.#view.showError('Failed to load story details. Please try again later.');
            return null;
        }
    }

    static extractStoryIdFromHash() {
        const hash = window.location.hash;
        let storyId = null;

        if (hash.includes('story-detail?id=')) {
            const queryString = hash.split('?')[1];
            const urlParams = new URLSearchParams(queryString);
            storyId = urlParams.get('id');
        } else if (hash.includes('story/')) {
            const parts = hash.split('/');
            storyId = parts[parts.length - 1];
        }

        return storyId;
    }
}
