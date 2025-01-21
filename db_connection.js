// const mysql = require("mysql2");

// const database = mysql.createConnection({
//     host : "localhost",
//     user : "root",
//     password : "Robin@123",
//     database : "uk_police"
// });

// database.connect((err) => {
//     if (err) {
//         console.log("error : ", err);
//     } else {
//         console.log("Connected to Database!");
//     }
// })

// module.exports= database;

const sql = require("mssql");

// Database Configuration
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

// Create a connection pool
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


