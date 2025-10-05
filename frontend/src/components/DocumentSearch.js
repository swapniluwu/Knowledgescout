import React, { useState } from 'react';
import { documentsAPI } from '../services/api';

const DocumentSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            console.log('Searching for:', query);
            const response = await documentsAPI.list({ q: query });
            console.log('Search response:', response);
            
            // Handle different response structures
            const items = response.data?.items || response.data || response.items || [];
            setResults(Array.isArray(items) ? items : []);
            
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div style={styles.container}>
            <h3>Search Documents</h3>
            <div style={styles.searchBox}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search document content..."
                    style={styles.input}
                    onKeyPress={handleKeyPress}
                />
                <button 
                    onClick={handleSearch} 
                    disabled={loading || !query.trim()}
                    style={{
                        ...styles.button,
                        ...(loading || !query.trim() ? styles.buttonDisabled : {})
                    }}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            
            <div style={styles.results}>
                {loading && <p style={styles.message}>Searching...</p>}
                
                {!loading && searched && results.length === 0 && (
                    <p style={styles.message}>No documents found matching your search.</p>
                )}
                
                {!loading && results.map((doc) => (
                    <div key={doc._id || doc.id} style={styles.document}>
                        <h4>{doc.originalName || doc.name || doc.filename || 'Untitled'}</h4>
                        <p>Size: {doc.fileSize ? `${doc.fileSize} bytes` : 'Unknown'}</p>
                        <p>Type: {doc.fileType || doc.mimetype || 'Unknown'}</p>
                        <p>Uploaded: {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Unknown date'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        margin: '2rem 0',
        padding: '1.5rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
    },
    searchBox: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: '0.75rem',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    button: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#bdc3c7',
        cursor: 'not-allowed',
    },
    results: {
        marginTop: '1rem',
    },
    document: {
        border: '1px solid #ddd',
        padding: '1rem',
        margin: '0.5rem 0',
        borderRadius: '4px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    message: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: '2rem',
    },
};

export default DocumentSearch;