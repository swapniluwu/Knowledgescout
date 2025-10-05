// import React, { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom'; // ADD THIS IMPORT

// const Login = () => {
//     const [isLogin, setIsLogin] = useState(true);
//     const [formData, setFormData] = useState({
//         email: '',
//         password: '',
//         name: ''
//     });
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const { login, register } = useAuth();
//     const navigate = useNavigate(); // ADD THIS HOOK

//     console.log('Login Component Rendered - isLogin:', isLogin);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');
        
//         console.log('Form submitted with data:', formData);

//         try {
//             if (isLogin) {
//                 console.log('Attempting login...');
//                 await login(formData.email, formData.password);
//                 console.log('Login successful!');
//                 navigate('/'); // NAVIGATE TO DASHBOARD
//             } else {
//                 console.log('Attempting register...');
//                 await register(formData.name, formData.email, formData.password);
//                 console.log('Registration successful!');
//                 navigate('/'); // NAVIGATE TO DASHBOARD
//             }
//         } catch (error) {
//             console.error('Auth error details:', error);
//             const errorMessage = error.response?.data?.error?.message || error.message || 'Something went wrong!';
//             setError(errorMessage);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value
//         });
//     };

//     const handleSwitchMode = () => {
//         console.log('Switching mode from', isLogin, 'to', !isLogin);
//         setIsLogin(!isLogin);
//         setError('');
//         setFormData({
//             email: '',
//             password: '',
//             name: ''
//         });
//     };

//     return (
//         <div style={styles.container}>
//             <div style={styles.formContainer}>
//                 <h2>{isLogin ? 'Login' : 'Register'}</h2>

//                 {error && (
//                     <div style={styles.error}>
//                         {error}
//                     </div>
//                 )}

//                 <form onSubmit={handleSubmit} style={styles.form}>
//                     {!isLogin && (
//                         <input
//                             type="text"
//                             name="name"
//                             placeholder="Full Name"
//                             value={formData.name}
//                             onChange={handleChange}
//                             required
//                             style={styles.input}
//                         />
//                     )}
//                     <input
//                         type="email"
//                         name="email"
//                         placeholder="Email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         required
//                         style={styles.input}
//                     />
//                     <input
//                         type="password"
//                         name="password"
//                         placeholder="Password"
//                         value={formData.password}
//                         onChange={handleChange}
//                         required
//                         style={styles.input}
//                     />
//                     <button 
//                         type="submit" 
//                         disabled={loading}
//                         style={{
//                             ...styles.button,
//                             backgroundColor: loading ? '#95a5a6' : '#3498db'
//                         }}
//                     >
//                         {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
//                     </button>
//                 </form>
                
//                 <p style={styles.switch}>
//                     {isLogin ? "Don't have an account? " : "Already have an account? "}
//                     <span 
//                         style={styles.switchLink}
//                         onClick={handleSwitchMode}
//                         onKeyPress={(e) => e.key === 'Enter' && handleSwitchMode()}
//                         tabIndex={0}
//                         role="button"
//                     >
//                         {isLogin ? 'Register' : 'Login'}
//                     </span>
//                 </p>

//                 {/* Demo Credentials */}
//                 <div style={styles.demo}>
//                     <h4>Demo Credentials:</h4>
//                     <p>Email: test@example.com</p>
//                     <p>Password: password123</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// const styles = {
//     container: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         minHeight: '100vh',
//         padding: '2rem',
//         backgroundColor: '#f5f5f5',
//     },
//     formContainer: {
//         width: '100%',
//         maxWidth: '400px',
//         padding: '2rem',
//         border: '1px solid #ddd',
//         borderRadius: '8px',
//         boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
//         backgroundColor: 'white',
//     },
//     form: {
//         display: 'flex',
//         flexDirection: 'column',
//     },
//     input: {
//         margin: '0.5rem 0',
//         padding: '0.75rem',
//         border: '1px solid #ccc',
//         borderRadius: '4px',
//         fontSize: '1rem',
//         outline: 'none',
//         transition: 'border-color 0.3s',
//     },
//     button: {
//         margin: '1rem 0',
//         padding: '0.75rem',
//         backgroundColor: '#3498db',
//         color: 'white',
//         border: 'none',
//         borderRadius: '4px',
//         fontSize: '1rem',
//         cursor: 'pointer',
//         transition: 'background-color 0.3s',
//     },
//     switch: {
//         textAlign: 'center',
//         marginTop: '1rem',
//         color: '#666',
//     },
//     switchLink: {
//         color: '#3498db',
//         cursor: 'pointer',
//         textDecoration: 'underline',
//         fontWeight: 'bold',
//     },
//     error: {
//         backgroundColor: '#f8d7da',
//         color: '#721c24',
//         padding: '0.75rem',
//         borderRadius: '4px',
//         marginBottom: '1rem',
//         border: '1px solid #f5c6cb',
//     },
//     demo: {
//         marginTop: '1rem',
//         padding: '1rem',
//         backgroundColor: '#f8f9fa',
//         borderRadius: '4px',
//         border: '1px solid #e9ecef',
//     },
// };

// export default Login;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        console.log('Login attempted with:', email, password);
        
        // DIRECT DEMO LOGIN - NO API CALLS, NO ERROR HANDLING
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Creating demo user...');
            
            // Store token directly
            localStorage.setItem('token', 'demo-token-12345');
            localStorage.setItem('user', JSON.stringify({
                id: 1,
                email: email,
                name: 'Demo User',
                role: 'user'
            }));
            
            console.log('Token stored, redirecting...');
            
            // Force redirect to dashboard
            window.location.href = '/dashboard';
            
        } catch (error) {
            console.log('Error occurred, redirecting anyway...');
            // Redirect no matter what
            window.location.href = '/dashboard';
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = () => {
        setEmail('demo@example.com');
        setPassword('password123');
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Login to KnowledgeScout</h2>
                <p style={{color: '#666', marginBottom: '20px'}}>
                    Demo Mode - Any credentials will work
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter any email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter any password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login & Enter App'}
                    </button>
                </form>
                
                <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <button 
                        onClick={handleQuickLogin}
                        className="demo-btn"
                    >
                        Auto-fill Demo Credentials
                    </button>
                </div>
                
                <div className="demo-info">
                    <h4>How to use:</h4>
                    <p>1. Enter ANY email and password</p>
                    <p>2. Click "Login & Enter App"</p>
                    <p>3. You'll be redirected to the main app</p>
                </div>
            </div>
        </div>
    );
};

export default Login;