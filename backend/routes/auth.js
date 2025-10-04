const express = require('express');
const { register, login } = require('../controllers/authController');
const { rateLimit } = require('../middleware/auth');

const router = express.Router();

router.post('/register', rateLimit, register);
router.post('/login', rateLimit, login);

module.exports = router;