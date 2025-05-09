import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';

const routes = {
  '/': new HomePage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add-story': new AddStoryPage(),
  '/story-detail': new StoryDetailPage(),
  '/story/:id': new StoryDetailPage(),
};

export default routes;
