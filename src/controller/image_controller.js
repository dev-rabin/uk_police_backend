const poolPromise = require("../../db_connection").poolPromise;

const ImageController = {
    addImage: async (req, res) => {
        const { image_id, complaint_detail_id, created_at } = req.body;
        console.log("image reqquets body : ", req.body);
        console.log("image request file : ", req.file);
        
        // Ensure at least one file is uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image file is required.",
            });
        }
    
        const filesData = req.files.map(file => ({
            name: file.originalname, // Use the original file name
            url: `/uploads/${file.filename}`,
            complaint_detail_id: complaint_detail_id
        }));
    
        const checkQuery = `SELECT image_id FROM images WHERE image_id = @image_id`;
        const insertQuery = `
            INSERT INTO images (image_id, name, url, complaint_detail_id, created_at)
            OUTPUT INSERTED.image_id
            VALUES (@image_id, @name, @url, @complaint_detail_id, @created_at)
        `;
    
        try {
            const pool = await poolPromise;
            const imageIds = [];
    
            for (let i = 0; i < filesData.length; i++) {
                const file = filesData[i];
    
                // Create a new request object for each iteration
                const request = pool.request();
    
                // Check if `image_id` already exists in the database
                const checkResult = await request
                    .input('image_id', image_id)
                    .query(checkQuery);
    
                if (checkResult.recordset.length > 0) {
                    // Skip duplicate `image_id` entries
                    console.log(`Duplicate image_id: ${image_id} - Skipping.`);
                    continue;
                }
    
                // Create a fresh request object for the insert query
                const insertRequest = pool.request();
                const insertResult = await insertRequest
                    .input('image_id', image_id)
                    .input('name', file.name)
                    .input('url', file.url)
                    .input('complaint_detail_id', file.complaint_detail_id)
                    .input('created_at', created_at)
                    .query(insertQuery);
    
                imageIds.push({
                    id: insertResult.recordset[0].image_id,
                    name: file.name,
                    url: file.url,
                    complaint_detail_id: file.complaint_detail_id
                });
            }
    
            // If no images were inserted
            if (imageIds.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: "No new images were added. All were duplicates.",
                });
            }
    
            return res.status(201).json({
                success: true,
                message: `${imageIds.length} image(s) added successfully!`,
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
