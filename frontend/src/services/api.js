import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
};

// Documents API - Fixed endpoints to match backend
export const documentsAPI = {
    upload: (formData) => api.post('/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params = {}) => api.get('/docs', { params }),
    ask: (questionData) => api.post('/docs/ask', questionData),
    getContent: (id) => api.get(`/docs/${id}/content`),
    download: (id) => api.get(`/docs/${id}/download`, { responseType: 'blob' }),
};

export default api;