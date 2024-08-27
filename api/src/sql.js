const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function connectAndQuery(query, params = []) {
    let pool;
    try {
        pool = await sql.connect(config);
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        throw error;
    } finally {
        if (pool) {
            pool.close();
        }
    }
} 

module.exports.connectAndQuery = connectAndQuery;
