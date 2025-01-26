const sql = require("mssql");
const dbConfig = {
    user: "sa",
    password: "12345678",
    server: "DESKTOP-EJVAT6O\\SQLEXPRESS",
    database: "uk_police",
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
        console.log("Connected to SQL Server");
        return pool;
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
        process.exit(1);
    });

module.exports = { poolPromise };


