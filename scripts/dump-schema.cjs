process.loadEnvFile();
const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');
const getDbConnection = require('../utils/db');

// Set fetchAsString so CLOBs are retrieved as plain strings
oracledb.fetchAsString = [oracledb.CLOB];

async function dumpSchema() {
    let connection;
    try {
        connection = await getDbConnection();
        
        // 1. Get all table names in the current schema
        const tablesResult = await connection.execute(
            `SELECT table_name FROM user_tables ORDER BY table_name`
        );
        
        const tables = tablesResult.rows.map(row => row[0]);
        if (tables.length === 0) {
            console.log("No tables found in the current schema.");
            return;
        }

        // 2. Ensure the output directory exists
        const outputDir = path.join(__dirname, '../db/schema');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`Found ${tables.length} tables. Exporting DDLs to ${outputDir}...`);

        // 3. Retrieve DDL for each table and write to file
        for (const table of tables) {
            try {
                const ddlResult = await connection.execute(
                    `SELECT DBMS_METADATA.GET_DDL('TABLE', :1) FROM DUAL`,
                    [table]
                );
                
                const ddl = ddlResult.rows[0][0].trim();
                const filePath = path.join(outputDir, `${table.toLowerCase()}.sql`);
                
                fs.writeFileSync(filePath, ddl + ';\n', 'utf8');
                console.log(`- Exported DDL for table: ${table}`);
            } catch (tableErr) {
                console.error(`- Failed to export DDL for table ${table}:`, tableErr.message);
            }
        }
        
        console.log("Database schema export completed successfully.");
    } catch (err) {
        console.error("Schema dump failed:", err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error("Error closing connection:", closeErr.message);
            }
        }
    }
}

dumpSchema();
