const jwt = require('jsonwebtoken');

const jwtUtil = {
    /**
     * Signs a payload to create a JWT token.
     * @param {object} payload The payload to sign (e.g. { user_id })
     * @param {string} [expiresIn] The expiry duration (default: '24h')
     * @returns {string} The signed JWT token
     */
    signToken: (payload, expiresIn = '24h') => {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';
        return jwt.sign(payload, secret, { expiresIn });
    },

    /**
     * Verifies a JWT token.
     * @param {string} token The JWT token to verify
     * @returns {object} The decoded payload if valid
     */
    verifyToken: (token) => {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key';
        return jwt.verify(token, secret);
    }
};

module.exports = jwtUtil;
