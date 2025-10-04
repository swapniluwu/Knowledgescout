const IdempotencyKey = require('../models/IdempotencyKey');

const idempotencyCheck = async (req, res, next) => {
    if (req.method !== 'POST') return next();
    const idempotencyKey = req.headers['idempotency-key'];
    if (!idempotencyKey) return next();
    
    try {
        const existingResponse = await IdempotencyKey.findOne({ key: idempotencyKey });
        if (existingResponse) return res.json(existingResponse.response);
        
        const originalSend = res.send;
        res.send = function(data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                IdempotencyKey.create({ key: idempotencyKey, response: JSON.parse(data) }).catch(console.error);
            }
            originalSend.call(this, data);
        };
        next();
    } catch (error) {
        next();
    }
};

module.exports = idempotencyCheck;