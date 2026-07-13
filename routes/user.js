const crypto = require('crypto');
const getDbConnection = require('../utils/db');

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

const UserRoutes = (express) => {
    const router = express.Router();

    // Signup API: Accepts both POST /signup and PUT /singup (to support the user's spelling/HTTP method)
    const handleSignup = async (req, res) => {
        const { user_id, password } = req.body || {};

        if (!user_id || !password) {
            return res.status(400).json({ error: "user_id and password are required" });
        }

        let connection;
        try {
            connection = await getDbConnection();
            const hashedPassword = await hashPassword(password);

            await connection.execute(
                `INSERT INTO users (user_id, password) VALUES (:1, :2)`,
                [user_id, hashedPassword]
            );

            console.log(`User ${user_id} created successfully`);
            return res.status(201).json({ message: "User created successfully" });
        } catch (err) {
            console.error("Signup error:", err);
            // Oracle unique constraint violation code is ORA-00001
            if (err.message && err.message.includes("ORA-00001")) {
                return res.status(409).json({ error: "User already exists" });
            }
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeErr) {
                    console.error("Error closing database connection:", closeErr);
                }
            }
        }
    };

    router.post("/signup", handleSignup);
    router.put("/singup", handleSignup);

    // Login API: Accepts POST /login
    router.post("/login", async (req, res) => {
        const { user_id, password } = req.body || {};

        if (!user_id || !password) {
            return res.status(400).json({ error: "user_id and password are required" });
        }

        let connection;
        try {
            connection = await getDbConnection();
            
            const result = await connection.execute(
                `SELECT password FROM users WHERE user_id = :1`,
                [user_id]
            );

            if (!result.rows || result.rows.length === 0) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const storedHash = result.rows[0][0];
            const isValid = await verifyPassword(password, storedHash);

            if (!isValid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            return res.status(200).json({ message: "Login successful", user_id });
        } catch (err) {
            console.error("Login error:", err);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeErr) {
                    console.error("Error closing database connection:", closeErr);
                }
            }
        }
    });

    return router;
};

module.exports = UserRoutes;