const mongoose = require('mongoose');

// In your Document model, ensure the content field can handle larger text
const documentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    content: { type: String, default: '' }, // Make sure this can store large text
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);