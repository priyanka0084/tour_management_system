import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                error: 'No token provided' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        // Send specific error message for token expiration
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Token expired',
                expiredAt: error.expiredAt
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            error: 'Authentication failed' 
        });
    }
};

// Admin only middleware
export const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin only.' 
        });
    }
};