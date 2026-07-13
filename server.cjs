process.loadEnvFile();
const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 9991;

// Import and mount routes
const userRoutes = require('./routes/user');
const imageRoutes = require('./routes/image');

app.use('/users', userRoutes(express));
app.use('/images', imageRoutes(express));

async function f() {
    const DB = require('./utils/db');
    console.log("Starting DB connection check...");
    let connection;
    try {
        connection = await DB();
        const result = await connection.execute(
            `SELECT 'Hello from Oracle DB!' AS message FROM dual`
        );
        console.log("DB check output:", result.rows[0]);
    } catch (err) {
        console.error("DB check failed:", err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}
f();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

