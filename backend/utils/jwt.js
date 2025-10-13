import jwt from 'jsonwebtoken';

// Secret keys (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Generate Access Token (15 minutes expiry)
// Generate Access Token (1 hour for development, 15 mins for production)
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: process.env.NODE_ENV === 'production' ? '15m' : '1h' } // 1 hour in dev, 15 mins in prod
  );
};

// Generate Refresh Token (7 days expiry)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days
  );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};
