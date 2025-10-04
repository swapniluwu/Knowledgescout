const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: { code: "USER_EXISTS", message: "User already exists with this email" }
            });
        }

        const user = new User({ email, password, name });
        await user.save();
        const token = generateToken(user._id);

        res.status(201).json({
            user: { id: user._id, email: user.email, name: user.name },
            token
        });
    } catch (error) {
        res.status(500).json({
            error: { code: "REGISTRATION_FAILED", message: error.message }
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }
            });
        }

        const token = generateToken(user._id);
        res.json({
            user: { id: user._id, email: user.email, name: user.name },
            token
        });
    } catch (error) {
        res.status(500).json({
            error: { code: "LOGIN_FAILED", message: error.message }
        });
    }
};

module.exports = { register, login };