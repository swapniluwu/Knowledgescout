import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';

const QuestionAsk = () => {
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState([]);
    const [aiAnswer, setAiAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [searchType, setSearchType] = useState('ai'); // 'ai' or 'keyword'

    // Add CSS animations safely
    useEffect(() => {
        if (!document.getElementById('question-ask-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'question-ask-styles';
            styleSheet.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .question-ask-input:focus {
                    border-color: #3498db !important;
                    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1) !important;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }, []);

    const handleAsk = async () => {
        if (!question.trim()) {
            setError('Please enter a question');
            return;
        }

        setLoading(true);
        setError('');
        setHasSearched(true);
        setAiAnswer('');
        setAnswers([]);

        try {
            const response = await documentsAPI.ask({ 
                query: question, 
                k: 5,
                useAI: searchType === 'ai'
            });
            
            setAnswers(response.data.answers);
            setAiAnswer(response.data.ai_answer);
            setSearchType(response.data.search_type);
            
        } catch (error) {
            console.error('Ask failed:', error);
            const errorMessage = error.response?.data?.error?.message || 
                               error.message || 
                               'Failed to get answers. Please try again.';
            setError(errorMessage);
            setAnswers([]);
            setAiAnswer('');
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuestion('');
        setAnswers([]);
        setAiAnswer('');
        setError('');
        setHasSearched(false);
    };

    const toggleSearchType = () => {
        setSearchType(prev => prev === 'ai' ? 'keyword' : 'ai');
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Ask Questions About Your Documents</h3>
            <p style={styles.subtitle}>
                Get AI-powered answers from your uploaded documents with semantic understanding
            </p>
            
            {/* Search Type Toggle */}
            <div style={styles.searchTypeToggle}>
                <label style={styles.toggleLabel}>
                    Search Type:
                </label>
                <div style={styles.toggleContainer}>
                    <button
                        onClick={toggleSearchType}
                        style={{
                            ...styles.toggleButton,
                            ...(searchType === 'ai' ? styles.toggleActive : {})
                        }}
                    >
                        {searchType === 'ai' ? '🤖 AI Semantic' : 'AI Semantic'}
                    </button>
                    <button
                        onClick={toggleSearchType}
                        style={{
                            ...styles.toggleButton,
                            ...(searchType === 'keyword' ? styles.toggleActive : {})
                        }}
                    >
                        {searchType === 'keyword' ? '🔍 Keyword' : 'Keyword'}
                    </button>
                </div>
            </div>

            {/* Search Input */}
            <div style={styles.askBox}>
                <div style={styles.inputContainer}>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => {
                            setQuestion(e.target.value);
                            setError('');
                        }}
                        placeholder="Example: What are the main points about machine learning?"
                        style={styles.input}
                        onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                        disabled={loading}
                        className="question-ask-input"
                    />
                    {question && (
                        <button 
                            onClick={clearSearch}
                            style={styles.clearButton}
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button 
                    onClick={handleAsk} 
                    disabled={loading || !question.trim()}
                    style={{
                        ...styles.button,
                        backgroundColor: loading ? '#95a5a6' : (!question.trim() ? '#bdc3c7' : '#2ecc71'),
                        cursor: loading || !question.trim() ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? (
                        <>
                            <div style={styles.spinner}></div>
                            {searchType === 'ai' ? 'AI Thinking...' : 'Searching...'}
                        </>
                    ) : (
                        searchType === 'ai' ? 'Ask AI' : 'Search'
                    )}
                </button>
            </div>

            {error && (
                <div style={styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {loading && (
                <div style={styles.loading}>
                    <div style={styles.loadingSpinner}></div>
                    <p>
                        {searchType === 'ai' 
                            ? 'AI is analyzing your documents...' 
                            : 'Searching through your documents...'
                        }
                    </p>
                </div>
            )}
            
            <div style={styles.answers}>
                {/* AI Answer */}
                {aiAnswer && (
                    <div style={styles.aiAnswer}>
                        <div style={styles.aiAnswerHeader}>
                            <h4>🤖 AI Answer</h4>
                            <span style={styles.aiBadge}>
                                {searchType === 'ai' ? 'AI Powered' : 'Enhanced Search'}
                            </span>
                        </div>
                        <div style={styles.aiAnswerText}>
                            {aiAnswer.split('\n').map((line, index) => (
                                <p key={index} style={styles.answerParagraph}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {answers.length > 0 && (
                    <div style={styles.resultsHeader}>
                        <h4>
                            Found {answers.length} relevant document{answers.length !== 1 ? 's' : ''} for: 
                            <span style={styles.queryText}> "{question}"</span>
                        </h4>
                        <div style={styles.searchInfo}>
                            {searchType === 'ai' ? '🤖 AI Semantic Search' : '🔍 Keyword Search'}
                        </div>
                    </div>
                )}
                
                {answers.map((answer, index) => (
                    <div key={`${answer.document_id}-${index}`} style={styles.answer}>
                        <div style={styles.answerHeader}>
                            <div>
                                <h4 style={styles.documentName}>
                                    📄 {answer.document_name}
                                </h4>
                                <span style={styles.documentType}>
                                    {answer.document_type}
                                </span>
                            </div>
                            <div style={styles.confidenceBadge}>
                                {Math.round(answer.confidence * 100)}% Match
                            </div>
                        </div>
                        <p style={styles.content}>{answer.content_snippet}</p>
                        <div style={styles.meta}>
                            <span style={styles.pageInfo}>
                                📖 Page {answer.page_reference}
                            </span>
                            <span style={styles.docId}>
                                ID: {answer.document_id.substring(0, 8)}...
                            </span>
                        </div>
                    </div>
                ))}
                
                {hasSearched && answers.length === 0 && !loading && !error && (
                    <div style={styles.noResults}>
                        <div style={styles.noResultsIcon}>🔍</div>
                        <h4>No relevant information found</h4>
                        <p>We couldn't find any relevant information in your documents.</p>
                        <ul style={styles.suggestions}>
                            <li>Try rephrasing your question</li>
                            <li>Use more specific keywords</li>
                            <li>Make sure you've uploaded relevant documents</li>
                            <li>Try switching to {searchType === 'ai' ? 'keyword' : 'AI'} search</li>
                        </ul>
                    </div>
                )}

                {!hasSearched && !loading && (
                    <div style={styles.placeholder}>
                        <div style={styles.placeholderIcon}>💡</div>
                        <h4>Ready to ask questions?</h4>
                        <p>Enter a question above to search through your uploaded documents.</p>
                        
                        <div style={styles.searchTypeInfo}>
                            <div style={styles.searchTypeCard}>
                                <strong>🤖 AI Semantic Search</strong>
                                <p>Understands meaning and context, finds conceptually similar content</p>
                            </div>
                            <div style={styles.searchTypeCard}>
                                <strong>🔍 Keyword Search</strong>
                                <p>Finds exact word matches, faster for specific terms</p>
                            </div>
                        </div>

                        <div style={styles.exampleQuestions}>
                            <strong>Try asking:</strong>
                            <ul>
                                <li>"What are the main technical skills required?"</li>
                                <li>"Explain the project methodology used"</li>
                                <li>"What are the key findings from the research?"</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        margin: '2rem 0',
        padding: '2rem',
        border: '1px solid #e1e8ed',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    title: {
        margin: '0 0 0.5rem 0',
        color: '#2c3e50',
        fontSize: '1.5rem',
        fontWeight: '600',
    },
    subtitle: {
        margin: '0 0 1.5rem 0',
        color: '#7f8c8d',
        fontSize: '1rem',
    },
    searchTypeToggle: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
    },
    toggleLabel: {
        fontWeight: '600',
        color: '#2c3e50',
        minWidth: '100px',
    },
    toggleContainer: {
        display: 'flex',
        backgroundColor: '#e9ecef',
        borderRadius: '8px',
        padding: '4px',
    },
    toggleButton: {
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontSize: '0.9rem',
    },
    toggleActive: {
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: '600',
    },
    askBox: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'flex-start',
    },
    inputContainer: {
        flex: 1,
        position: 'relative',
    },
    input: {
        width: '100%',
        padding: '0.75rem 2.5rem 0.75rem 1rem',
        border: '2px solid #e1e8ed',
        borderRadius: '8px',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.3s',
    },
    clearButton: {
        position: 'absolute',
        right: '0.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        fontSize: '1.2rem',
        color: '#95a5a6',
        cursor: 'pointer',
        padding: '0.25rem',
    },
    button: {
        padding: '0.75rem 1.5rem',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '140px',
        justifyContent: 'center',
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid transparent',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    error: {
        backgroundColor: '#fee',
        color: '#c53030',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #fed7d7',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#7f8c8d',
        gap: '1rem',
    },
    loadingSpinner: {
        width: '24px',
        height: '24px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    answers: {
        marginTop: '1rem',
    },
    aiAnswer: {
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
    },
    aiAnswerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    aiBadge: {
        backgroundColor: '#0ea5e9',
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    aiAnswerText: {
        lineHeight: '1.6',
        color: '#334155',
    },
    answerParagraph: {
        margin: '0.5rem 0',
    },
    resultsHeader: {
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #f1f2f6',
    },
    queryText: {
        color: '#2ecc71',
        fontWeight: '600',
    },
    searchInfo: {
        fontSize: '0.9rem',
        color: '#7f8c8d',
        marginTop: '0.5rem',
    },
    answer: {
        border: '1px solid #e1e8ed',
        padding: '1.5rem',
        margin: '1rem 0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        transition: 'all 0.3s ease',
    },
    answerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
    },
    documentName: {
        margin: '0 0 0.25rem 0',
        color: '#2c3e50',
        fontSize: '1.1rem',
    },
    documentType: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
        backgroundColor: '#edf2f7',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
    },
    confidenceBadge: {
        backgroundColor: '#2ecc71',
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        minWidth: '80px',
        textAlign: 'center',
    },
    content: {
        margin: '0 0 1rem 0',
        color: '#34495e',
        lineHeight: '1.6',
        fontSize: '1rem',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '6px',
        borderLeft: '4px solid #3498db',
    },
    meta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: '#7f8c8d',
    },
    pageInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    docId: {
        fontFamily: 'monospace',
        backgroundColor: '#edf2f7',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
    },
    noResults: {
        textAlign: 'center',
        padding: '3rem 2rem',
        color: '#7f8c8d',
    },
    noResultsIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    suggestions: {
        textAlign: 'left',
        maxWidth: '400px',
        margin: '1rem auto',
        padding: '0',
        lineHeight: '1.6',
    },
    placeholder: {
        textAlign: 'center',
        padding: '3rem 2rem',
        color: '#7f8c8d',
    },
    placeholderIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    searchTypeInfo: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        margin: '2rem 0',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    searchTypeCard: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
    },
    exampleQuestions: {
        marginTop: '1.5rem',
        textAlign: 'left',
        maxWidth: '400px',
        margin: '1.5rem auto 0',
    },
};

export default QuestionAsk;