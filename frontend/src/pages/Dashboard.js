import React from 'react';
import Header from '../components/Header';
import DocumentUpload from '../components/DocumentUpload';
import DocumentSearch from '../components/DocumentSearch';
import QuestionAsk from '../components/QuestionAsk';

const Dashboard = () => {
    return (
        <div>
            <Header />
            <div style={styles.container}>
                <h2>Document Q&A Dashboard</h2>
                <p>Upload text documents and ask questions about their content.</p>
                
                <DocumentUpload />
                <DocumentSearch />
                <QuestionAsk />
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
    },
};

export default Dashboard;