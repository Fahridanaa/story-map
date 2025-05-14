import authModel from '../data/auth-model';

export function updateNavigation() {
    const isAuthenticated = authModel.isAuthenticated();
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const addStoryLink = document.getElementById('add-story-link');
    const logoutLink = document.getElementById('logout-link');
    const savedStoryLink = document.getElementById('saved-stories-link')

    if (isAuthenticated) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (addStoryLink) addStoryLink.style.display = 'block';
        if (savedStoryLink) savedStoryLink.style.display = 'block'
        if (logoutLink) logoutLink.style.display = 'block';

    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (addStoryLink) addStoryLink.style.display = 'block';
        if (savedStoryLink) savedStoryLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }

    handleHomePageLoginPrompt(isAuthenticated);
}

function handleHomePageLoginPrompt(isAuthenticated) {
    if (window.location.hash !== '#/' && window.location.hash !== '') {
        return;
    }

    const mainContent = document.querySelector('#main-content');
    if (!mainContent || isAuthenticated) {
        return;
    }

    const loginPrompt = mainContent.querySelector('.login-prompt');
    if (loginPrompt) {
        return;
    }

    const homePage = document.querySelector('#home-page');
    if (homePage) {
        import('../pages/home/home-page').then(module => {
            const HomePage = module.default;
            const homePageInstance = new HomePage();
            homePageInstance.showLoginPrompt();
        });
    }
}
