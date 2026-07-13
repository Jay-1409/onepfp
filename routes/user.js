const oracledb = require("oracledb");

oracledb.autoCommit = true;

const DB = async () => {
    try {
        const connection = await oracledb.getConnection({
            user: process.env.ORACLE_USERNAME,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.CONNECTION_STRING
        });
        console.log("Database connected successfully");
        return connection;
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
};

module.exports = DB;