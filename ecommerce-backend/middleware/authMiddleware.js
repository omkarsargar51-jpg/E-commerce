// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, 'your_jwt_secret');
            
            // The request is now authenticated
            req.user = decoded.id;
            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };