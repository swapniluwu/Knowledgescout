const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    response: Object,
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);