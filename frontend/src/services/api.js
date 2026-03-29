import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with defaults
const api = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await axios.post(`${API}/api/auth/refresh`, {}, { withCredentials: true });
        return api.request(error.config);
      } catch (e) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh')
};

// ========== PROPERTIES ==========
export const propertiesAPI = {
  create: (data) => api.post('/properties', data),
  getAll: (params) => api.get('/properties', { params }),
  getOne: (id) => api.get(`/properties/${id}`),
  getByUser: (userId, params) => api.get(`/users/${userId}/properties`, { params })
};

// ========== POSTS ==========
export const postsAPI = {
  create: (data) => api.post('/posts', data),
  getFeed: (params) => api.get('/posts/feed', { params }),
  like: (postId) => api.post(`/posts/${postId}/like`),
  save: (postId) => api.post(`/posts/${postId}/save`),
  getByUser: (userId, params) => api.get(`/users/${userId}/posts`, { params })
};

// ========== COMMENTS ==========
export const commentsAPI = {
  create: (data) => api.post('/comments', data),
  getByPost: (postId, params) => api.get(`/comments/${postId}`, { params })
};

// ========== AREAS ==========
export const areasAPI = {
  create: (data) => api.post('/areas', data),
  getAll: (params) => api.get('/areas', { params }),
  follow: (areaId) => api.post(`/areas/${areaId}/follow`)
};

// ========== USERS ==========
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', null, { params: data }),
  follow: (userId) => api.post(`/users/${userId}/follow`)
};

// ========== FILES ==========
export const filesAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getUrl: (path) => `${API}/api/files/${path}`
};

// ========== PAYMENTS ==========
export const paymentsAPI = {
  createCheckout: (packageId) => api.post('/payments/checkout', null, { 
    params: { 
      package_id: packageId, 
      origin_url: window.location.origin 
    } 
  }),
  getStatus: (sessionId) => api.get(`/payments/status/${sessionId}`)
};

export default api;
