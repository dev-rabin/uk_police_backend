const poolPromise = require("../../db_connection").poolPromise;

const ImageController = {
    addImage: async (req, res) => {
        const { complaint_detail_id } = req.body;
    
        // Check if any files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image file is required.",
            });
        }
    
        const filesData = req.files.map(file => {
            const url = `/uploads/${file.filename}`;
            return {
                name: file.originalname, // Ensure to use the original file name
                url: url,
                complaint_detail_id: complaint_detail_id
            };
        });
    
        const query = `
            INSERT INTO images (name, url, complaint_detail_id)
            OUTPUT INSERTED.image_id
            VALUES (@name, @url, @complaint_detail_id);
        `;
    
        try {
            const pool = await poolPromise;
            const request = pool.request();
            
            const imageIds = [];
            for (let i = 0; i < filesData.length; i++) {
                const file = filesData[i];
    
                const result = await request
                    .input('name', file.name)
                    .input('url', file.url)
                    .input('complaint_detail_id', file.complaint_detail_id)
                    .query(query);
    
                // Assuming the result contains the inserted image_id
                imageIds.push({
                    id: result.recordset[0].image_id,
                    name: file.name,
                    url: file.url,
                    complaint_detail_id: file.complaint_detail_id
                });
            }
    
            return res.status(201).json({
                success: true,
                message: `${filesData.length} image(s) added successfully!`,
                data: imageIds,
            });
        } catch (err) {
            console.error("Error adding images:", err.message);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error!",
            });
        }
    },

    getImagesByComplaintId: async (req, res) => {
        const { complaint_detail_id } = req.params;

        // Validate input fields
        if (!complaint_detail_id) {
            return res.status(400).json({
                success: false,
                message: "Complaint details ID is required.",
            });
        }

        const query = `
            SELECT * FROM images WHERE complaint_detail_id = @complaint_detail_id;
        `;

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('complaint_detail_id', complaint_detail_id)
                .query(query);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No images found for the given complaint details ID.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Images fetched successfully!",
                data: result.recordset,
            });
        } catch (err) {
            console.error("Error fetching images:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error!",
            });
        }
    },

    deleteImage: async (req, res) => {
        const { image_id } = req.params;

        if (!image_id) {
            return res.status(400).json({
                success: false,
                message: "Image ID is required.",
            });
        }

        const query = `
            DELETE FROM images WHERE image_id = @image_id;
        `;

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('image_id', image_id)
                .query(query);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found or already deleted.",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Image deleted successfully!",
            });
        } catch (err) {
            console.error("Error deleting image:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error!",
            });
        }
    },
};

module.exports = ImageController;
