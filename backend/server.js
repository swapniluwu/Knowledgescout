require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS for production
app.use(cors({
    origin: [
        'https://your-frontend.netlify.app', // You'll update this later
        'http://localhost:3000'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically (Render provides ephemeral storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', documentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(), 
        service: 'KnowledgeScout API',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/_meta', (req, res) => {
    res.json({ name: "KnowledgeScout", version: "1.0.0", description: "Document Q&A System", problem_statement: 5 });
});

app.get('/.well-known/hackathon.json', (req, res) => {
    res.json({
        name: "KnowledgeScout", problem_statement: 5, team: "Solo", stack: "MERN",
        features: ["Document upload", "Text search", "Q&A system", "Pagination", "Rate limiting"]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            error: { code: "FILE_TOO_LARGE", message: "File size exceeds 10MB limit" } 
        });
    }
    
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong!" } });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});

// Start server - IMPORTANT FOR RENDER
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;