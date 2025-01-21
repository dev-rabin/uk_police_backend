const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "public")));
app.use("/api/uploads", express.static("uploads"));

// Root Route with Database Ping
app.get("/", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT 1 AS isAlive");
        if (result.recordset[0].isAlive === 1) {
            res.send("Server is Online!");
        } else {
            res.send("Server is down!");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server is down!");
    }
});

// Import Routes
const UserRouter = require("./src/routes/user_route");
app.use("/api", UserRouter);

const ComplaintRouter = require("./src/routes/complaint_route");
app.use("/api", ComplaintRouter);

const ComplaintDetailRouter = require("./src/routes/complaint_detail_route");
app.use("/api", ComplaintDetailRouter);

const ImageRouter = require("./src/routes/image_routes");
const { poolPromise } = require("./db_connection");
app.use("/api", ImageRouter);

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
