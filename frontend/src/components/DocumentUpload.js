import React, { useState } from 'react';
import { documentsAPI } from '../services/api';

const DocumentUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const allowedTypes = ['text/plain', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Please select a TXT or PDF file');
                return;
            }
            
            // Validate file size (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
    if (!file) {
        setError('Please select a file');
        return;
    }

    setUploading(true);
    setError('');

    try {
        const formData = new FormData();
        formData.append('file', file);

        // This will now call POST /api/docs/upload
        const response = await documentsAPI.upload(formData);
        
        // Reset form on success
        setFile(null);
        document.getElementById('file-input').value = '';
        
        alert('File uploaded successfully!');
        
    } catch (error) {
        console.error('Upload failed:', error);
        if (error.response?.data?.error?.message) {
            setError(`Upload failed: ${error.response.data.error.message}`);
        } else if (error.message) {
            setError(`Upload failed: ${error.message}`);
        } else {
            setError('Upload failed: Please check your connection and try again');
        }
    } finally {
        setUploading(false);
    }
};

    return (
        <div style={styles.container}>
            <h3>Upload Document</h3>
            
            <div style={styles.uploadArea}>
                <input
                    id="file-input"
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileSelect}
                    style={styles.fileInput}
                    disabled={uploading}
                />
                <p>Choose TXT or PDF File</p>
                
                {file && (
                    <div style={styles.fileInfo}>
                        <strong>Selected:</strong> {file.name} 
                        ({Math.round(file.size / 1024)} KB)
                    </div>
                )}
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            <button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                style={styles.uploadButton}
            >
                {uploading ? 'Uploading...' : 'Upload Document'}
            </button>

            <div style={styles.info}>
                <h4>Supported Files:</h4>
                <ul>
                    <li><strong>Text Files (.txt)</strong> - Full text extraction</li>
                    <li><strong>PDF Files (.pdf)</strong> - Basic text extraction</li>
                </ul>
                <p>
                    <strong>Note:</strong> For PDF files, only the extractable text content will be processed. 
                    Scanned PDFs or image-based PDFs may not work properly.
                </p>
                <p><strong>Max file size:</strong> 10MB</p>
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
    uploadArea: {
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '1rem',
        backgroundColor: 'white',
    },
    fileInput: {
        marginBottom: '1rem',
    },
    fileInfo: {
        marginTop: '1rem',
        padding: '0.5rem',
        backgroundColor: '#e8f4fd',
        borderRadius: '4px',
    },
    error: {
        color: '#e74c3c',
        backgroundColor: '#fdf2f2',
        padding: '0.75rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        border: '1px solid #f5c6cb',
    },
    uploadButton: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
    },
    info: {
        fontSize: '0.9rem',
        color: '#666',
        borderTop: '1px solid #eee',
        paddingTop: '1rem',
    },
};

export default DocumentUpload;