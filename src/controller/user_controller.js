const bcrypt = require("bcrypt");
const poolPromise = require("../../db_connection").poolPromise;

const UserController = {
  addUser: async (req, res) => {
    const { first_name, last_name, collar_id, password } = req.body;

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const pool = await poolPromise;

      const query = `
        INSERT INTO [user] (first_name, last_name, collar_id, password)
        VALUES (@first_name, @last_name, @collar_id, @password);
      `;

      // Execute the query
      await pool.request()
        .input("first_name", first_name)
        .input("last_name", last_name)
        .input("collar_id", collar_id)
        .input("password", hashedPassword)
        .query(query);

      res.status(200).json({ success: true, message: "User Added Successfully!" });
    } catch (err) {
      console.error("Error adding user:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },

  // Login User
  loginUser: async (req, res) => {
    const { collar_id, password } = req.body;

    try {
      const pool = await poolPromise;
      const query = `
        SELECT * FROM [user]
        WHERE collar_id = @collar_id;
      `;

      const result = await pool.request()
        .input("collar_id", collar_id)
        .query(query);

      const user = result.recordset[0];

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found!" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (match) {
        res.status(200).json({ success: true, message: "Login Successful!", user });
      } else {
        res.status(401).json({ success: false, message: "Invalid Credentials!" });
      }
    } catch (err) {
      console.error("Error logging in user:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },
};

module.exports = UserController;
