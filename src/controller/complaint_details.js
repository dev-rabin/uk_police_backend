const crypto = require('crypto');
const poolPromise = require("../../db_connection").poolPromise;
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Ensure this is a 32-byte key
const IV_LENGTH = 16; // AES requires 16-byte IV for CBC mode

// Ensure the key is 32 bytes long
if (Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes long (64 hex characters)");
}

// Helper function to encrypt data
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// Helper function to decrypt data
function decrypt(text) {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const ComplaintDetailsController = {
    addComplaintDetails: async (req, res) => {
        const { complaint_id, description } = req.body;

        // Encrypt the description before saving it
        const encryptedDescription = encrypt(description);

        const query = `
            INSERT INTO complaint_detail (complaint_id, description)
            OUTPUT INSERTED.complaint_detail_id
            VALUES (@complaint_id, @description)
        `;

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('complaint_id', complaint_id)
                .input('description', encryptedDescription)
                .query(query);

            res.status(200).json({
                success: true,
                message: "Complaint description Added Successfully!",
                data: result.recordset[0].complaint_detail_id,
            });
        } catch (err) {
            console.error("Error:", err);
            res.status(500).json({ success: false, message: "Internal Server Error!" });
        }
    },

    getFullComplaintDetails: async (req, res) => {
        const complaint_id = req.params.complaint_id;

        if (!complaint_id) {
            return res.status(400).json({
                success: false,
                message: "complaint_id is required.",
            });
        }

        const query = `
            SELECT 
                complaint.complaint_id,
                complaint.title,
                complaint.created_at AS complaint_created_at,
                complaint_detail.complaint_detail_id,
                complaint_detail.description,
                complaint_detail.created_at AS detail_created_at,
                images.image_id,
                images.url,
                images.name AS image_name
            FROM complaint
            INNER JOIN complaint_detail ON complaint.complaint_id = complaint_detail.complaint_id
            LEFT JOIN images ON complaint_detail.complaint_detail_id = images.complaint_detail_id
            WHERE complaint.complaint_id = @complaint_id;
        `;

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('complaint_id', complaint_id)
                .query(query);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No details found for the given complaint_id.",
                });
            }

            // Group data by complaint details
            const detailsMap = {};
            result.recordset.forEach(row => {
                if (!detailsMap[row.complaint_detail_id]) {
                    detailsMap[row.complaint_detail_id] = {
                        description: row.description,
                        created_at: row.detail_created_at,
                        images: []
                    };
                }

                if (row.image_id) {
                    detailsMap[row.complaint_detail_id].images.push({
                        image_id: row.image_id,
                        url: row.url,
                        name: row.image_name,
                    });
                }
            });

            // Decrypt descriptions before sending the response
            Object.values(detailsMap).forEach(detail => {
                if (detail.description) {
                    try {
                        detail.description = decrypt(detail.description);
                    } catch (decryptionErr) {
                        console.error("Decryption Error:", decryptionErr);
                        return res.status(500).json({
                            success: false,
                            message: "Error decrypting complaint description",
                        });
                    }
                }
            });

            const response = {
                title: result.recordset[0].title,
                created_at: result.recordset[0].complaint_created_at,
                details: Object.values(detailsMap), // Convert map to array
            };

            return res.status(200).json({
                success: true,
                message: "Full complaint details fetched successfully!",
                data: response,
            });
        } catch (err) {
            console.error("Error fetching full complaint details:", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error!",
            });
        }
    },
};

module.exports = ComplaintDetailsController;
