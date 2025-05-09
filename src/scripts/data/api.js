import CONFIG from '../config';

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/v1`,
  STORIES: `${CONFIG.BASE_URL}/v1/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/v1/stories/${id}`,
  ADD_STORY: `${CONFIG.BASE_URL}/v1/stories`,
  ADD_STORY_GUEST: `${CONFIG.BASE_URL}/v1/stories/guest`,
  REGISTER: `${CONFIG.BASE_URL}/v1/register`,
  LOGIN: `${CONFIG.BASE_URL}/v1/login`,
};

export async function getData() {
  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT);
  return await fetchResponse.json();
}

export async function getStories(page = 1, size = 10, withLocation = true, token = null) {
  const url = new URL(ENDPOINTS.STORIES);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  url.searchParams.append('location', withLocation ? '1' : '0');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch stories');
  }
  const data = await response.json();
  return data.listStory;
}

export async function getStoryDetail(id, token = null) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(ENDPOINTS.STORY_DETAIL(id), { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch story detail');
  }
  const data = await response.json();
  return data.story;
}

export async function addStory(storyData, token = null) {
  const formData = new FormData();
  formData.append('description', storyData.get('description'));

  if (storyData.get('lat') && storyData.get('lon')) {
    formData.append('lat', storyData.get('lat'));
    formData.append('lon', storyData.get('lon'));
  }

  if (storyData.get('photo')) {
    formData.append('photo', storyData.get('photo'));
  }

  if (token) {
    const response = await fetch(ENDPOINTS.ADD_STORY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add story');
    }

    return await response.json();
  } else {
    const response = await fetch(ENDPOINTS.ADD_STORY_GUEST, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add story');
    }

    return await response.json();
  }
}

export async function register(name, email, password) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function login(email, password) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message || 'Login failed');
  }
  return data.loginResult;
}
