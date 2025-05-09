import { getStories, getStoryDetail, addStory } from './api';
import authModel from './auth-model';

export class StoryModel {
    async getStories(page = 1, size = 10, withLocation = true) {
        try {
            return await getStories(page, size, withLocation, authModel.getToken());
        } catch (error) {
            console.error('Error fetching stories:', error);
            throw error;
        }
    }

    async getStoryDetail(id) {
        try {
            return await getStoryDetail(id, authModel.getToken());
        } catch (error) {
            console.error('Error fetching story detail:', error);
            throw error;
        }
    }

    async addStory(storyData) {
        try {
            return await addStory(storyData, authModel.getToken());
        } catch (error) {
            console.error('Error adding story:', error);
            throw error;
        }
    }
}

const storyModel = new StoryModel();
export default storyModel;
