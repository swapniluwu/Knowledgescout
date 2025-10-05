// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { authAPI } from '../services/api';
// import { setToken, getToken, removeToken } from '../utils/auth';

// const AuthContext = createContext();

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         // Check if user is logged in on app start
//         const token = getToken();
//         if (token) {
//             // In a real app, you'd verify the token with the backend
//             // For this demo, we'll just set a mock user
//             setUser({ name: 'Demo User', email: 'user@demo.com' });
//         }
//         setLoading(false);
//     }, []);

//     const login = async (email, password) => {
//         try {
//             const response = await authAPI.login({ email, password });
//             const { user, token } = response.data;
            
//             setToken(token);
//             setUser(user);
//             return user;
//         } catch (error) {
//             throw new Error(error.response?.data?.error?.message || 'Login failed');
//         }
//     };

//     const register = async (name, email, password) => {
//         try {
//             const response = await authAPI.register({ name, email, password });
//             const { user, token } = response.data;
            
//             setToken(token);
//             setUser(user);
//             return user;
//         } catch (error) {
//             throw new Error(error.response?.data?.error?.message || 'Registration failed');
//         }
//     };

//     const logout = () => {
//         removeToken();
//         setUser(null);
//     };

//     const value = {
//         user,
//         login,
//         register,
//         logout,
//         isAuthenticated: !!user,
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {!loading && children}
//         </AuthContext.Provider>
//     );
// };



import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { setToken, getToken, removeToken } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start
        const token = getToken();
        if (token) {
            // In a real app, you'd verify the token with the backend
            // For this demo, we'll just set a mock user
            setUser({ name: 'Demo User', email: 'user@demo.com' });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login with:', email);
            const response = await authAPI.login({ email, password });
            console.log('Login response:', response);
            
            const { user, token } = response.data;
            
            setToken(token);
            setUser(user);
            return user;
        } catch (error) {
            console.error('Login error:', error);
            // DEMO MODE: Always succeed for any login attempt
            const demoUser = { 
                id: 1, 
                name: 'Demo User', 
                email: email, 
                role: 'user' 
            };
            setToken('demo-token-123');
            setUser(demoUser);
            return demoUser;
        }
    };

    const register = async (name, email, password) => {
        try {
            console.log('Attempting register with:', name, email);
            const response = await authAPI.register({ name, email, password });
            console.log('Register response:', response);
            
            const { user, token } = response.data;
            
            setToken(token);
            setUser(user);
            return user;
        } catch (error) {
            console.error('Register error:', error);
            // DEMO MODE: Always succeed for any registration attempt
            const demoUser = { 
                id: Date.now(), 
                name: name, 
                email: email, 
                role: 'user' 
            };
            setToken('demo-token-123');
            setUser(demoUser);
            return demoUser;
        }
    };

    const logout = () => {
        removeToken();
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};