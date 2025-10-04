const jwt = require('jsonwebtoken');
const User = require('../models/user');

const rateLimitMap = new Map();

const rateLimit = (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - 60000;
    
    if (!rateLimitMap.has(userId)) rateLimitMap.set(userId, []);
    const requests = rateLimitMap.get(userId).filter(time => time > windowStart);
    rateLimitMap.set(userId, requests);
    
    if (requests.length >= 60) {
        return res.status(429).json({
            error: { code: "RATE_LIMIT", message: "Too many requests" }
        });
    }
    
    requests.push(now);
    next();
};

const requireAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                error: { code: "UNAUTHORIZED", message: "Authentication token required" }
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                error: { code: "INVALID_TOKEN", message: "Invalid authentication token" }
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            error: { code: "INVALID_TOKEN", message: "Invalid authentication token" }
        });
    }
};

module.exports = { requireAuth, rateLimit };