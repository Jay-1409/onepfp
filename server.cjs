process.loadEnvFile();
const express = require('express');
const app = express();

const port = process.env.PORT || 9991;
async function f() {
    const DB = require('./utils/db');
    console.log(process.env.ORACLE_PASSWORD, process.env.ORACLE_USERNAME, process.env.CONNECTION_STRING);
    const connection = await DB();
    const result = await connection.execute(
        `SELECT 'Hello from Oracle DB!' AS message FROM dual`
    );
    console.log(result);
}
f();
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
