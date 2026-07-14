const getDbConnection = require('../utils/db');
const { hashPassword, verifyPassword } = require('../utils/user')();
const jwtUtil = require('../utils/jwt');
const crypto = require("crypto");
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
            const session_id = crypto.randomBytes(16).toString("hex");
            try {
                await connection.execute(
                    `Insert into sessions values (
                        :1, 
                        :2
                    )`,
                    [user_id, session_id]
                );
            } catch (error) {
                return res.status(500).json({ error: `Error in inserting session details into the table: ${error.message}` });
            }
            const token = jwtUtil.signToken({ user_id, session_id });
            return res.status(200).json({ message: "Login successful", user_id, token });
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