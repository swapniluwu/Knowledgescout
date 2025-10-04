const express = require('express');
const { 
    upload, 
    uploadDocument, 
    getDocuments, 
    askQuestion, 
    getDocumentContent, 
    downloadDocument ,
    testGeminiAPI,
    checkAPIHealth
} = require('../controllers/DocumentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Define routes
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.post('/ask', askQuestion);
router.get('/:id/content', getDocumentContent);
router.get('/:id/download', downloadDocument);
router.get('/test-gemini', testGeminiAPI);
router.get('/health', checkAPIHealth);

module.exports = router;