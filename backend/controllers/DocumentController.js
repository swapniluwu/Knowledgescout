const Document = require('../models/document');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['text/plain', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only TXT and PDF files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Helper function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('PDF text extraction failed:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

// Helper function to extract text from file based on type
const extractFileContent = async (filePath, mimetype) => {
    try {
        if (mimetype === 'text/plain') {
            return fs.readFileSync(filePath, 'utf8');
        } else if (mimetype === 'application/pdf') {
            return await extractTextFromPDF(filePath);
        }
        return '';
    } catch (error) {
        console.error('Content extraction failed:', error);
        return '';
    }
};

// Check if Gemini is available
const isGeminiAvailable = () => {
    return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza');
};

// Free tier rate limiting
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 15; // Conservative limit for free tier

const checkRateLimit = async () => {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - lastResetTime > 60000) {
        requestCount = 0;
        lastResetTime = now;
        console.log('🔄 Rate limit counter reset');
    }
    
    // Check if we're approaching the limit
    if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - (now - lastResetTime);
        console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime/1000)} seconds`);
        await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Extra buffer
        requestCount = 0;
        lastResetTime = Date.now();
    }
    
    requestCount++;
    console.log(`📊 API requests this minute: ${requestCount}/${MAX_REQUESTS_PER_MINUTE}`);
};

// Get available Gemini models - FREE TIER ONLY
const getGeminiModels = () => {
    return {
        embedding: "models/embedding-001",
        generation: ["gemini-pro"] // Only free tier model
    };
};

// Generate embeddings using Gemini
const generateEmbeddings = async (text) => {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error('Empty text provided for embedding');
        }

        if (!isGeminiAvailable()) {
            throw new Error('Gemini API key not configured');
        }

        // Rate limiting for free tier
        await checkRateLimit();

        const models = getGeminiModels();
        const model = genAI.getGenerativeModel({ model: models.embedding });
        
        console.log(`🔄 Generating embedding for ${text.length} chars`);
        const result = await model.embedContent(text);
        
        if (!result.embedding || !result.embedding.values) {
            throw new Error('Invalid response from Gemini API');
        }

        console.log(`✅ Generated embedding (${result.embedding.values.length} dimensions)`);
        return result.embedding.values;
    } catch (error) {
        console.error('❌ Embedding generation failed:', error.message);
        
        // Handle free tier specific errors
        if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
            throw new Error('Free API quota exceeded. Please try again in a minute.');
        }
        
        if (error.message.includes('API key') || error.message.includes('401')) {
            throw new Error('Invalid Gemini API key. Please check your configuration.');
        }
        
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
};

// Try Gemini models for text generation (free tier only)
const tryGeminiModels = async (prompt) => {
    const models = getGeminiModels();
    const errors = [];

    for (const modelName of models.generation) {
        try {
            console.log(`🔄 Trying FREE TIER model: ${modelName}`);
            
            // Rate limiting
            await checkRateLimit();
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 500,  // Conservative for free tier
                    temperature: 0.3,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ Success with FREE TIER model: ${modelName}`);
            return text;
        } catch (error) {
            console.warn(`❌ FREE TIER Model ${modelName} failed:`, error.message);
            errors.push({ model: modelName, error: error.message });
            
            // If it's a quota error, stop trying
            if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
                throw new Error('Free API quota exceeded. Please try again in a minute.');
            }
            
            if (error.message.includes('API key') || error.message.includes('401')) {
                throw new Error('Invalid Gemini API key.');
            }
        }
    }

    throw new Error(`Free tier models unavailable: ${errors[0]?.error || 'Unknown error'}`);
};

// Split text into chunks for processing
const splitTextIntoChunks = async (text, chunkSize = 800, chunkOverlap = 100) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        });
        
        const chunks = await splitter.splitText(text);
        console.log(`📄 Split text into ${chunks.length} chunks`);
        return chunks.filter(chunk => chunk.length > 50);
    } catch (error) {
        console.error('Text splitting failed, using simple split:', error);
        // Fallback: simple chunking
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
            if (i + chunkSize > text.length) break;
            const chunk = text.substring(i, i + chunkSize);
            if (chunk.length > 50) chunks.push(chunk);
        }
        return chunks;
    }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) {
        return 0;
    }
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
};

// Enhanced keyword search with better relevance scoring
const enhancedKeywordSearch = async (query, documents, k = 5) => {
    console.log(`🔍 Starting KEYWORD search for: "${query}"`);
    
    const queryTerms = query.toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 2)
        .map(term => term.replace(/[^\w]/g, ''));
    
    console.log(`📝 Search terms:`, queryTerms);

    const scoredDocs = documents.map(doc => {
        let totalScore = 0;
        const content = doc.content ? doc.content.toLowerCase() : '';
        const filename = doc.originalName ? doc.originalName.toLowerCase() : '';
        
        // Calculate relevance score
        queryTerms.forEach(term => {
            let termScore = 0;
            
            // Filename matches are very valuable
            const filenameMatches = (filename.match(new RegExp(term, 'g')) || []).length;
            termScore += filenameMatches * 20;
            
            // Content matches with context
            const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
            termScore += contentMatches * 2;
            
            // Bonus for exact phrase match
            if (content.includes(query.toLowerCase())) {
                termScore += 30;
            }
            
            totalScore += termScore;
        });
        
        // Find the most relevant snippet around the search terms
        let bestSnippet = '';
        let bestSnippetScore = 0;
        
        if (content && queryTerms.length > 0) {
            // Look for sentences containing the query terms
            const sentences = content.split(/[.!?]+/).filter(s => s.length > 20);
            
            for (const sentence of sentences) {
                let sentenceScore = 0;
                let matchedTerms = 0;
                
                queryTerms.forEach(term => {
                    if (sentence.toLowerCase().includes(term)) {
                        sentenceScore += 10;
                        matchedTerms++;
                        sentenceScore += (sentence.toLowerCase().match(new RegExp(term, 'g')) || []).length * 2;
                    }
                });
                
                // Bonus for matching multiple terms in one sentence
                if (matchedTerms > 1) {
                    sentenceScore += matchedTerms * 5;
                }
                
                if (sentenceScore > bestSnippetScore) {
                    bestSnippetScore = sentenceScore;
                    bestSnippet = sentence.trim();
                }
            }
        }
        
        // If no good sentence found, find context around first occurrence
        if (!bestSnippet && content) {
            for (const term of queryTerms) {
                const termIndex = content.toLowerCase().indexOf(term);
                if (termIndex !== -1) {
                    const start = Math.max(0, termIndex - 100);
                    const end = Math.min(content.length, termIndex + 200);
                    bestSnippet = content.substring(start, end);
                    if (start > 0) bestSnippet = '...' + bestSnippet;
                    if (end < content.length) bestSnippet = bestSnippet + '...';
                    break;
                }
            }
        }
        
        // Final fallback
        if (!bestSnippet && content) {
            bestSnippet = content.substring(0, 300) + '...';
        }
        
        return {
            document: doc,
            score: totalScore,
            snippet: bestSnippet,
            confidence: Math.min(totalScore / (queryTerms.length * 10), 1.0)
        };
    });
    
    const filteredResults = scoredDocs
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    
    console.log(`✅ Keyword search found ${filteredResults.length} results`);
    
    return filteredResults.map(result => ({
        document: result.document,
        similarity: result.confidence,
        relevant_chunk: result.snippet,
        using_keyword: true
    }));
};

// Improved semantic search with free tier optimizations
const semanticSearch = async (query, documents, k = 3) => {
    console.log(`🔍 Starting SEMANTIC search for: "${query}"`);
    console.log(`📚 Searching through ${documents.length} documents`);

    if (!isGeminiAvailable()) {
        console.log('❌ Gemini not available, falling back to keyword search');
        throw new Error('Gemini API not configured');
    }

    try {
        // Generate query embedding
        console.log('🔄 Generating query embedding...');
        const queryEmbedding = await generateEmbeddings(query);
        console.log('✅ Query embedding generated');

        const results = [];
        
        // Limit documents processed for free tier
        const documentsToProcess = documents.slice(0, 5);
        
        for (const doc of documentsToProcess) {
            if (!doc.content || doc.content.length < 100) {
                console.log(`⏩ Skipping document ${doc.originalName} - insufficient content`);
                continue;
            }

            console.log(`📖 Processing document: ${doc.originalName}`);
            
            try {
                // Split document into meaningful chunks
                const chunks = await splitTextIntoChunks(doc.content, 600, 100);
                console.log(`   Divided into ${chunks.length} chunks`);
                
                let bestChunk = '';
                let bestSimilarity = -1;
                let processedChunks = 0;
                
                // Process fewer chunks for free tier
                for (const chunk of chunks.slice(0, 3)) {
                    if (chunk.length < 100) continue;
                    
                    try {
                        processedChunks++;
                        const chunkEmbedding = await generateEmbeddings(chunk);
                        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
                        
                        if (similarity > bestSimilarity) {
                            bestSimilarity = similarity;
                            bestChunk = chunk;
                        }
                    } catch (chunkError) {
                        console.warn(`   ❌ Failed to process chunk:`, chunkError.message);
                        continue;
                    }
                }
                
                // Only include results with reasonable similarity
                if (bestChunk && bestSimilarity > 0.3) {
                    console.log(`   🎯 Document matched with similarity: ${bestSimilarity.toFixed(3)}`);
                    results.push({
                        document: doc,
                        similarity: bestSimilarity,
                        relevant_chunk: bestChunk,
                        processed_chunks: processedChunks
                    });
                } else {
                    console.log(`   ❌ No good match found (best similarity: ${bestSimilarity.toFixed(3)})`);
                }
                
            } catch (docError) {
                console.error(`❌ Failed to process document ${doc.originalName}:`, docError.message);
                continue;
            }
        }
        
        console.log(`✅ Semantic search completed: ${results.length} results found`);
        
        // Sort by similarity and return top k
        const sortedResults = results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);
            
        return sortedResults;
        
    } catch (error) {
        console.error('❌ Semantic search failed:', error.message);
        throw error;
    }
};

// Improved AI answer generation for free tier
const generateAIAnswer = async (query, relevantChunks, searchMethod = 'semantic') => {
    console.log(`🤖 Generating AI answer for: "${query}"`);
    console.log(`📋 Using ${relevantChunks.length} relevant chunks`);

    if (!isGeminiAvailable()) {
        return `**🔧 AI Search Setup Required**\n\nI found ${relevantChunks.length} relevant sections in your documents!\n\nTo get AI-powered answers:\n\n1. Get a **FREE** Gemini API key from: https://aistudio.google.com/\n2. Add this to your .env file:\n   GEMINI_API_KEY=your_free_key_here\n3. Restart the server\n\nIt's completely free for moderate usage!`;
    }

    try {
        // Prepare shorter context for free tier limits
        const context = relevantChunks
            .map((chunk, index) => `[Document ${index + 1}]\n${chunk.substring(0, 400)}...`)
            .join('\n\n');
        
        const prompt = `Based STRICTLY on these document excerpts, answer the user's question concisely.

QUESTION: ${query}

DOCUMENT EXCERPTS:
${context}

INSTRUCTIONS:
- Answer using ONLY information from the documents above
- If the answer isn't found, say "The documents don't contain specific information about this"
- Be factual and reference which document the information came from
- Keep the answer under 300 words

ANSWER:`;

        console.log('🔄 Calling FREE TIER Gemini API...');
        
        const answer = await tryGeminiModels(prompt);
        
        console.log('✅ AI answer generated successfully with free tier');
        return answer;
        
    } catch (error) {
        console.error('❌ Free tier AI failed:', error.message);
        
        // User-friendly free tier error messages
        if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
            return `**🔄 Free API Limit Reached**\n\nI found ${relevantChunks.length} relevant sections in your documents!\n\nThe free Gemini API quota has been reached. This usually resets within minutes.\n\n💡 Quick solutions:\n• Wait 1-2 minutes and try again\n• Use keyword search for immediate results\n• Review the search results below\n\nFree tier is perfect for testing and moderate usage!`;
        }
        
        if (error.message.includes('API key') || error.message.includes('401')) {
            return `**🔑 API Key Issue**\n\nPlease check your Gemini API key in the .env file.\n\nGet a FREE key from: https://aistudio.google.com/`;
        }
        
        return `**🤖 AI Service Temporary Issue**\n\nI found ${relevantChunks.length} relevant sections!\n\nThe AI service is currently experiencing issues. Please:\n\n• Try again in a moment\n• Use keyword search for now\n• Review the search results below\n\nThis is usually temporary with free tier services.`;
    }
};

// Extract page reference from chunk position
const extractPageReference = (content, chunk) => {
    if (!content || !chunk) return 1;
    
    const chunkStart = content.indexOf(chunk.substring(0, 200));
    if (chunkStart === -1) return 1;
    
    return Math.floor(chunkStart / 1500) + 1;
};

const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: { code: "FIELD_REQUIRED", field: "file", message: "File is required" }
            });
        }

        console.log(`📤 Uploading document: ${req.file.originalname}`);

        // Extract content based on file type
        let content = '';
        if (req.file.mimetype === 'text/plain' || req.file.mimetype === 'application/pdf') {
            content = await extractFileContent(req.file.path, req.file.mimetype);
        }

        // Validate content was extracted
        if (!content || content.length < 10) {
            throw new Error('Could not extract meaningful content from the file');
        }

        console.log(`✅ Extracted ${content.length} characters from document`);

        // Generate embeddings for the document if Gemini is available
        let embeddings = [];
        if (content.length > 100 && isGeminiAvailable()) {
            try {
                const chunks = await splitTextIntoChunks(content, 800, 150);
                // Store embeddings for first few chunks (limited for free tier)
                const chunkPromises = chunks.slice(0, 2).map(async (chunk) => {
                    try {
                        return await generateEmbeddings(chunk);
                    } catch (embedError) {
                        console.warn('Failed to generate embedding for one chunk:', embedError.message);
                        return null;
                    }
                });
                
                embeddings = (await Promise.all(chunkPromises)).filter(embedding => embedding !== null);
                console.log(`✅ Generated ${embeddings.length} document embeddings`);
            } catch (embeddingError) {
                console.error('Embedding generation failed, continuing without embeddings:', embeddingError);
            }
        }

        const document = new Document({
            user: req.user._id,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            content: content,
            embeddings: embeddings
        });

        await document.save();
        
        // Clean up uploaded file after successful processing
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.log(`✅ Document saved successfully: ${document._id}`);
        
        res.status(201).json({
            id: document._id,
            filename: document.originalName,
            size: document.fileSize,
            type: document.fileType,
            uploaded_at: document.uploadDate,
            content_length: content.length,
            embeddings_created: embeddings.length,
            ai_ready: isGeminiAvailable(),
            free_tier: true
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('❌ Upload failed:', error);
        res.status(500).json({
            error: { 
                code: "UPLOAD_FAILED", 
                message: error.message 
            }
        });
    }
};

const getDocuments = async (req, res) => {
    try {
        const { limit = 10, offset = 0, q = '' } = req.query;
        const query = { user: req.user._id };
        
        if (q) {
            query.$or = [
                { content: { $regex: q, $options: 'i' } },
                { originalName: { $regex: q, $options: 'i' } }
            ];
        }

        const documents = await Document.find(query)
            .select('filename originalName fileSize fileType uploadDate content')
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .sort({ uploadDate: -1 });

        const total = await Document.countDocuments(query);
        
        res.json({
            items: documents,
            total,
            next_offset: parseInt(offset) + documents.length < total ? parseInt(offset) + parseInt(limit) : null,
            ai_enabled: isGeminiAvailable(),
            free_tier: true
        });
    } catch (error) {
        console.error('Get documents failed:', error);
        res.status(500).json({
            error: { code: "FETCH_FAILED", message: error.message }
        });
    }
};

const askQuestion = async (req, res) => {
    try {
        const { query, k = 3, useAI = true } = req.body;
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: { code: "FIELD_REQUIRED", field: "query", message: "Query must be at least 2 characters long" }
            });
        }

        const cleanQuery = query.trim();
        console.log(`\n🎯 NEW QUESTION: "${cleanQuery}"`);
        console.log(`⚡ AI Search requested: ${useAI}`);
        console.log(`🔧 Gemini available: ${isGeminiAvailable()}`);

        // Get user's documents
        const documents = await Document.find({
            user: req.user._id
        }).select('originalName content fileType uploadDate');

        console.log(`📂 Found ${documents.length} documents to search`);

        if (documents.length === 0) {
            return res.json({
                query: cleanQuery,
                answers: [],
                ai_answer: "No documents found to search through. Please upload some documents first.",
                total_found: 0,
                search_type: 'none',
                search_method: 'no_documents',
                ai_enabled: isGeminiAvailable(),
                free_tier: true
            });
        }

        let searchResults = [];
        let aiAnswer = null;
        let searchMethod = 'keyword';
        let searchError = null;

        if (useAI && isGeminiAvailable()) {
            try {
                console.log('🚀 Attempting FREE TIER semantic search...');
                searchResults = await semanticSearch(cleanQuery, documents, k);
                searchMethod = 'semantic';
                console.log(`✅ Semantic search completed: ${searchResults.length} results`);
                
            } catch (semanticError) {
                console.error('❌ Semantic search failed, falling back to keyword:', semanticError.message);
                searchError = semanticError.message;
                searchResults = await enhancedKeywordSearch(cleanQuery, documents, k);
                searchMethod = 'keyword_fallback';
            }
        } else {
            console.log('🔍 Using keyword search (AI disabled or unavailable)');
            searchResults = await enhancedKeywordSearch(cleanQuery, documents, k);
            searchMethod = 'keyword';
        }

        // Generate AI answer if we have results and AI is requested
        if (useAI && searchResults.length > 0) {
            console.log('🤖 Generating AI answer...');
            const relevantChunks = searchResults.map(result => result.relevant_chunk);
            aiAnswer = await generateAIAnswer(cleanQuery, relevantChunks, searchMethod);
        } else if (useAI && searchResults.length === 0) {
            aiAnswer = "I couldn't find any relevant information in your documents to answer this question. The documents may not contain information about this topic, or you might need to try different keywords.";
        } else {
            aiAnswer = "Keyword search completed. For more intelligent, context-aware answers, enable AI Semantic search.";
        }

        // Format answers for response
        const answers = searchResults.map((result, index) => {
            const confidence = Math.round(result.similarity * 100);
            return {
                document_id: result.document._id,
                document_name: result.document.originalName,
                document_type: result.document.fileType,
                content_snippet: result.relevant_chunk.substring(0, 250) + 
                               (result.relevant_chunk.length > 250 ? '...' : ''),
                confidence: confidence,
                page_reference: extractPageReference(result.document.content, result.relevant_chunk),
                upload_date: result.document.uploadDate,
                search_method: result.using_keyword ? 'keyword' : 'semantic'
            };
        });

        // Enhanced response with free tier info
        const response = {
            query: cleanQuery,
            answers,
            ai_answer: aiAnswer,
            total_found: answers.length,
            search_type: useAI ? 'ai_semantic' : 'keyword',
            search_method: searchMethod,
            search_error: searchError,
            documents_searched: documents.length,
            ai_enabled: isGeminiAvailable(),
            free_tier: true,
            rate_limit_info: "Free tier: ~15 requests/minute",
            timestamp: new Date().toISOString()
        };

        console.log(`✅ Search completed: ${answers.length} results using ${searchMethod}`);
        console.log(`📊 Top result confidence: ${answers[0]?.confidence || 0}%`);
        
        res.json(response);

    } catch (error) {
        console.error('❌ Ask question failed completely:', error);
        res.status(500).json({
            error: { 
                code: "SEARCH_FAILED", 
                message: "Search service encountered an error. Free tier may be rate limited.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                ai_enabled: isGeminiAvailable(),
                free_tier: true
            }
        });
    }
};

// Get document content
const getDocumentContent = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ 
            _id: id, 
            user: req.user._id 
        });

        if (!document) {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Document not found" }
            });
        }

        res.json({
            id: document._id,
            filename: document.originalName,
            type: document.fileType,
            content: document.content,
            size: document.fileSize,
            uploaded_at: document.uploadDate
        });
    } catch (error) {
        console.error('Get document content failed:', error);
        res.status(500).json({
            error: { code: "FETCH_FAILED", message: error.message }
        });
    }
};

// Download original file
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ 
            _id: id, 
            user: req.user._id 
        });

        if (!document) {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Document not found" }
            });
        }

        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({
                error: { code: "FILE_NOT_FOUND", message: "Original file not found" }
            });
        }

        res.download(document.filePath, document.originalName);
    } catch (error) {
        console.error('Download document failed:', error);
        res.status(500).json({
            error: { code: "DOWNLOAD_FAILED", message: error.message }
        });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findOne({ 
            _id: id, 
            user: req.user._id 
        });

        if (!document) {
            return res.status(404).json({
                error: { code: "NOT_FOUND", message: "Document not found" }
            });
        }

        // Delete file from filesystem if it exists
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        // Delete from database
        await Document.findByIdAndDelete(id);

        res.json({
            message: "Document deleted successfully",
            id: id
        });
    } catch (error) {
        console.error('Delete document failed:', error);
        res.status(500).json({
            error: { code: "DELETE_FAILED", message: error.message }
        });
    }
};

// Free tier health check
const checkAPIHealth = async (req, res) => {
    try {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            tier: 'FREE',
            limits: {
                requests_per_minute: MAX_REQUESTS_PER_MINUTE,
                models_available: ['gemini-pro', 'embedding-001'],
                current_usage: `${requestCount}/${MAX_REQUESTS_PER_MINUTE} requests this minute`
            },
            services: {
                database: 'OK',
                file_system: 'OK',
                gemini_api: isGeminiAvailable() ? 'FREE_TIER_ACTIVE' : 'UNAVAILABLE'
            },
            features: {
                ai_semantic_search: isGeminiAvailable(),
                keyword_search: true,
                file_processing: true,
                free_forever: true
            }
        };

        if (isGeminiAvailable()) {
            try {
                // Test with free tier model only
                await checkRateLimit();
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await model.generateContent("health check");
                const response = await result.response;
                health.services.gemini_api = 'ACTIVE';
                health.gemini_test = 'SUCCESS';
            } catch (error) {
                health.services.gemini_api = 'LIMITED';
                health.gemini_error = error.message;
                
                if (error.message.includes('quota') || error.message.includes('rate limit')) {
                    health.gemini_error = 'Free tier quota limited - normal for high usage';
                }
            }
        }

        res.json(health);
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message
        });
    }
};

// Test Gemini API endpoint for free tier
const testGeminiAPI = async (req, res) => {
    try {
        if (!isGeminiAvailable()) {
            return res.status(400).json({
                status: 'SETUP_REQUIRED',
                message: 'Gemini API is not configured',
                setup_instructions: {
                    step1: 'Visit https://aistudio.google.com/ (free)',
                    step2: 'Click "Get API key" and create a new key',
                    step3: 'Add to your .env file: GEMINI_API_KEY=your_free_key_here',
                    step4: 'Restart the server',
                    note: 'Completely free for moderate usage!'
                }
            });
        }

        console.log('🧪 Testing FREE TIER Gemini API...');
        
        const tests = {
            embedding: { status: 'PENDING', model: "models/embedding-001" },
            generation: { status: 'PENDING', model: "gemini-pro" }
        };

        // Test embedding model
        try {
            await checkRateLimit();
            const embeddingModel = genAI.getGenerativeModel({ model: "models/embedding-001" });
            const embeddingResult = await embeddingModel.embedContent("test query");
            tests.embedding.status = 'SUCCESS';
            tests.embedding.dimensions = embeddingResult.embedding.values.length;
            console.log('✅ Embedding test passed');
        } catch (error) {
            tests.embedding.status = 'FAILED';
            tests.embedding.error = error.message;
            console.error('❌ Embedding test failed:', error.message);
        }

        // Test generation model
        try {
            await checkRateLimit();
            const textModel = genAI.getGenerativeModel({ 
                model: "gemini-pro",
                generationConfig: {
                    maxOutputTokens: 20,
                    temperature: 0.1,
                }
            });
            
            const textResult = await textModel.generateContent("Say OK for free tier test");
            const response = await textResult.response;
            tests.generation.status = 'SUCCESS';
            tests.generation.response = response.text();
            console.log('✅ Generation test passed');
        } catch (error) {
            tests.generation.status = 'FAILED';
            tests.generation.error = error.message;
            console.error('❌ Generation test failed:', error.message);
        }

        const allPassed = tests.embedding.status === 'SUCCESS' && tests.generation.status === 'SUCCESS';
        
        res.json({
            status: allPassed ? 'SUCCESS' : 'PARTIAL',
            message: allPassed ? 'Free tier Gemini API is working perfectly!' : 'Some free tier features limited',
            tests,
            free_tier_info: {
                available_models: ['gemini-pro', 'embedding-001'],
                rate_limits: `${MAX_REQUESTS_PER_MINUTE} requests/minute`,
                cost: 'Completely free for moderate usage',
                upgrade_url: 'https://aistudio.google.com/pricing'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Free tier API test failed:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Free tier API test failed',
            error: error.message,
            suggestion: 'Check your free API key at https://aistudio.google.com/'
        });
    }
};

module.exports = { 
    upload, 
    uploadDocument, 
    getDocuments, 
    askQuestion, 
    getDocumentContent,
    downloadDocument,
    deleteDocument,
    checkAPIHealth,
    testGeminiAPI
};