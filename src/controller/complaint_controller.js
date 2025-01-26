const poolPromise = require("../../db_connection").poolPromise;

const ComplaintController = {
  // addComplaint: async (req, res) => {
  //   const {comaplaint_id, title, user_id, created_at } = req.body;

  //   const query = `INSERT INTO complaint (comaplaint_id,title, user_id,created_at) OUTPUT INSERTED.complaint_id VALUES (@comaplaint_id,@title, @user_id,@created_at)`;

  //   try {
  //     const pool = await poolPromise;
  //     const result = await pool.request()
  //     .input('comaplaint_id',comaplaint_id)
  //       .input('title', title)
  //       .input('user_id', user_id)
  //       .input('created_at',created_at)
  //       .query(query);
      
  //     res.status(200).json({ success: true, message: "Complaint Added Successfully!", data: result.recordset[0].complaint_id });
  //   } catch (err) {
  //     console.error("Error:", err);
  //     res.status(500).json({ success: false, message: "Internal Server Error!" });
  //   }
  // },

  addComplaint: async (req, res) => {
    const { complaint_id, title, user_id, created_at } = req.body;
    console.log("req body complaiont : ", req.body);
    
    const checkQuery = `SELECT complaint_id FROM complaint WHERE complaint_id = @complaint_id`;
    const insertQuery = `INSERT INTO complaint (complaint_id, title, user_id, created_at) 
                         OUTPUT INSERTED.complaint_id 
                         VALUES (@complaint_id, @title, @user_id, @created_at)`;

    try {
        const pool = await poolPromise;

        // Check if the `complaint_id` already exists in the database
        const checkResult = await pool.request()
            .input('complaint_id', complaint_id)
            .query(checkQuery);

        if (checkResult.recordset.length > 0) {
            // If `complaint_id` already exists, skip the insert operation
            return res.status(200).json({ success: false, message: "Duplicate complaint_id. Entry skipped." });
        }

        // If `complaint_id` doesn't exist, proceed with the insert
        const insertResult = await pool.request()
            .input('complaint_id', complaint_id)
            .input('title', title)
            .input('user_id', user_id)
            .input('created_at', created_at)
            .query(insertQuery);

        res.status(200).json({ success: true, message: "Complaint Added Successfully!", data: insertResult.recordset[0].complaint_id });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
},


  getComplaints: async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required."
      });
    }

    const query = `SELECT * FROM complaint WHERE user_id = @user_id`;

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('user_id', user_id)
        .query(query);

      res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },

  getComplaint: async (req, res) => {
    const { complaint_id } = req.params;

    const query = `SELECT * FROM complaint WHERE complaint_id = @complaint_id`;

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('complaint_id', complaint_id)
        .query(query);

      if (result.recordset.length === 0) {
        return res.status(404).json({ success: false, message: "Complaint not found!" });
      }

      res.status(200).json({ success: true, data: result.recordset[0] });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },

  deleteComplaint: async (req, res) => {
    const { complaint_id } = req.params;

    const query = `DELETE FROM complaint WHERE complaint_id = @complaint_id`;

    try {
      const pool = await poolPromise;
      await pool.request()
        .input('complaint_id', complaint_id)
        .query(query);

      res.status(200).json({ success: true, message: "Complaint Deleted Successfully!" });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },

  searchComplaints: async (req, res) => {
    const { searchTerm } = req.query;
  
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required."
      });
    }
  
    const query = `
      SELECT * FROM complaint
      WHERE title LIKE @searchTerm
      OR complaint_id IN (
        SELECT complaint_id FROM complaint_detail WHERE description LIKE @searchTerm
      )
    `;
  
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('searchTerm', `%${searchTerm}%`)
        .query(query);
  
      res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },
  

  filterComplaints: async (req, res) => {
    const { startDate, endDate, filterType, user_id, filterDate } = req.query;
  
    let query = "SELECT * FROM complaint WHERE 1=1";
    let values = [];
  
    if (user_id) {
      query += " AND user_id = @user_id";
      values.push({ name: 'user_id', value: user_id });
    }
  
    if (startDate && endDate) {
      if (startDate === endDate) {
        query += " AND CAST(created_at AS DATE) = CAST(@startDate AS DATE)";
        values.push({ name: 'startDate', value: startDate });
      } else {
        query += " AND created_at >= @startDate AND created_at <= @endDate";
        values.push({ name: 'startDate', value: startDate }, { name: 'endDate', value: endDate });
      }
    }
  
    else if (filterType === 'today') {
      query += " AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)";
    }
  
    else if (filterType === 'latest') {
      query += " ORDER BY created_at DESC OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY";
    }
  
    if (filterDate) {
      query += " AND CAST(created_at AS DATE) = @filterDate";
      values.push({ name: 'filterDate', value: filterDate });
    }
  
    try {
      const pool = await poolPromise;
      const request = pool.request();
      values.forEach(val => request.input(val.name, val.value));
  
      const result = await request.query(query);
      console.log("query : ", query);
      res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
  },
};

module.exports = ComplaintController;
