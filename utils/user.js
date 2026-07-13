const crypto = require('crypto');

const userUtils = () => {
    /**
     * @brief Checks if the user is present in the database.
     * @param {object} userDetail The user detail containing user_id.
     * @param {object} connection The DB connection.
     * @returns {Promise<boolean>}
     */
    async function isUserPresent(userDetail, connection) {
        const user_id = userDetail.user_id;
        const result = await connection.execute(
            `SELECT user_id FROM users WHERE user_id = :1`,
            [user_id]
        );
        if (!result.rows || result.rows.length === 0) {
            return false;
        }
        return true;
    }

    // Helper to securely hash a password using scrypt
    function hashPassword(password) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString('hex');
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) return reject(err);
                resolve(salt + ":" + derivedKey.toString('hex'));
            });
        });
    }

    // Helper to verify a password against a stored hash
    function verifyPassword(password, hash) {
        return new Promise((resolve, reject) => {
            const parts = hash.split(':');
            if (parts.length !== 2) return resolve(false);
            const [salt, key] = parts;
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
                if (err) return reject(err);
                resolve(derivedKey.toString('hex') === key);
            });
        });
    }

    return {
        isUserPresent,
        hashPassword,
        verifyPassword
    };
};

module.exports = userUtils;