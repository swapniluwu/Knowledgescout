import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header style={styles.header}>
            <h1>KnowledgeScout</h1>
            <div style={styles.userInfo}>
                {user && (
                    <>
                        <span>Welcome, {user.name}</span>
                        <button onClick={logout} style={styles.logoutBtn}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: '#2c3e50',
        color: 'white',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    logoutBtn: {
        padding: '0.5rem 1rem',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default Header;