// import axios from 'axios';

// const API_BASE = 'http://localhost:5000/api';

// // Create axios instance
// const api = axios.create({
//     baseURL: API_BASE,
// });

// // Add token to requests
// api.interceptors.request.use((config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// // Response interceptor to handle errors
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             // Token expired or invalid
//             localStorage.removeItem('token');
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );

// // Auth API
// export const authAPI = {
//     register: (userData) => api.post('/auth/register', userData),
//     login: (credentials) => api.post('/auth/login', credentials),
// };

// // Documents API - Fixed endpoints to match backend
// export const documentsAPI = {
//     upload: (formData) => api.post('/docs/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//     }),
//     list: (params = {}) => api.get('/docs', { params }),
//     ask: (questionData) => api.post('/docs/ask', questionData),
//     getContent: (id) => api.get(`/docs/${id}/content`),
//     download: (id) => api.get(`/docs/${id}/download`, { responseType: 'blob' }),
// };

// export default api;



// frontend/src/services/api.js - PURE MOCK VERSION

// Mock delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data functions
const mockLogin = async (credentials) => {
    await delay(800);
    return {
        data: {
            token: 'demo-jwt-token-12345',
            user: { 
                id: 1, 
                email: credentials.email, 
                name: 'Demo User',
                role: 'admin'
            }
        }
    };
};

const mockRegister = async (userData) => {
    await delay(800);
    return {
        data: {
            token: 'demo-jwt-token-12345',
            user: { 
                id: 2, 
                email: userData.email, 
                name: userData.name || 'New User',
                role: 'user'
            },
            message: 'Registration successful (demo mode)'
        }
    };
};

const mockGetDocuments = async () => {
    await delay(600);
    return {
        data: [
            { 
                id: 1, 
                title: 'Project Report.pdf', 
                uploadedAt: '2024-10-01',
                size: '2.4 MB'
            },
            { 
                id: 2, 
                title: 'Research Paper.docx', 
                uploadedAt: '2024-10-02',
                size: '1.8 MB'
            }
        ]
    };
};

const mockAskQuestion = async (questionData) => {
    await delay(1200);
    return {
        data: {
            answer: `Demo response: "${questionData.question}" - This is a mock answer showing the app works.`,
            confidence: 0.85
        }
    };
};

const mockUploadDocument = async (formData) => {
    await delay(1500);
    return {
        data: {
            id: Date.now(),
            title: 'uploaded-file.pdf',
            message: 'Document uploaded successfully (demo mode)'
        }
    };
};

// Export mock APIs
export const authAPI = {
    register: mockRegister,
    login: mockLogin,
};

export const documentsAPI = {
    upload: mockUploadDocument,
    list: mockGetDocuments,
    ask: mockAskQuestion,
    getContent: () => Promise.resolve({ data: 'Mock document content...' }),
    download: () => Promise.resolve({ data: new Blob() }),
};