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



import axios from 'axios';

// Demo mode - set to true for now, false when backend is ready
const IS_DEMO_MODE = true;

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

// Mock data functions
const mockLogin = async (credentials) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    token: 'demo-jwt-token-12345',
                    user: { 
                        id: 1, 
                        email: credentials.email, 
                        name: 'Demo User',
                        role: 'admin'
                    }
                }
            });
        }, 1000);
    });
};

const mockRegister = async (userData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
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
            });
        }, 1000);
    });
};

const mockGetDocuments = async (params = {}) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
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
                    },
                    { 
                        id: 3, 
                        title: 'Meeting Notes.txt', 
                        uploadedAt: '2024-10-03',
                        size: '0.5 MB'
                    }
                ]
            });
        }, 800);
    });
};

const mockAskQuestion = async (questionData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    answer: `Mock response: "${questionData.question}" - This is a demo answer. In real app, AI would analyze your document.`,
                    confidence: 0.85,
                    sources: ['Document Section 2.1', 'Document Section 3.4']
                }
            });
        }, 1500);
    });
};

const mockUploadDocument = async (formData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                data: {
                    id: Date.now(),
                    title: formData.get('document')?.name || 'uploaded-file.pdf',
                    message: 'Document uploaded successfully (demo mode)'
                }
            });
        }, 2000);
    });
};

// Auth API
export const authAPI = {
    register: (userData) => IS_DEMO_MODE ? mockRegister(userData) : api.post('/auth/register', userData),
    login: (credentials) => IS_DEMO_MODE ? mockLogin(credentials) : api.post('/auth/login', credentials),
};

// Documents API - Fixed endpoints to match backend
export const documentsAPI = {
    upload: (formData) => IS_DEMO_MODE ? mockUploadDocument(formData) : api.post('/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params = {}) => IS_DEMO_MODE ? mockGetDocuments(params) : api.get('/docs', { params }),
    ask: (questionData) => IS_DEMO_MODE ? mockAskQuestion(questionData) : api.post('/docs/ask', questionData),
    getContent: (id) => IS_DEMO_MODE ? Promise.resolve({ data: 'Mock document content...' }) : api.get(`/docs/${id}/content`),
    download: (id) => IS_DEMO_MODE ? Promise.resolve({ data: new Blob() }) : api.get(`/docs/${id}/download`, { responseType: 'blob' }),
};

export default api;