import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';
import SavedStoriesPage from '../pages/saved-stories/saved-stories-page';

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add-story': AddStoryPage,
  '/story/:id': StoryDetailPage,
  '/saved-stories': SavedStoriesPage,
};

export default routes;
