const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const jwtUtil = require('../utils/jwt');
const s3Client = new S3Client({});
const getDbConnection = require('../utils/db');
const imageRoutes = (express) => {
    const router = express.Router();
    /**
     * @brief The user asks for a pre-signed AWS URL from the backend service.
     * @param {string} s3Key Contains the User_ID / Session_id / Image_id for that user.
     * @returns {Promise<string>} Pre-signed S3 upload URL
     */
    async function getPreSignedS3URL(s3Key) {
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            ContentType: "image/jpeg"
        });
        return await getSignedUrl(s3Client, command, { expiresIn: process.env.AWS_S3_UPLOAD_WINDOW_SECONDS || 300 });
    }
    /**
     * @brief POST endpoint to obtain pre-signed S3 upload URL.
     */
    router.post("/upload", async (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        let decoded;
        try {
            decoded = jwtUtil.verifyToken(token);
        } catch (err) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        if (!decoded) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        const user_id = decoded.user_id;
        if(!user_id) {
          return res.status(400).json({
                error: "Not all fields required for constructing the S3Key availiable, missing user_id"
            });
        }
        const session_id = decoded.session_id;
        if(!session_id) {
          return res.status(400).json({
                error: "Not all fields required for constructing the S3Key availiable, missing session_id"
            });
        }
        const image_id = req.body.image_id;
        if(!image_id) {
          return res.status(400).json({
                error: "Not all fields required for constructing the S3Key availiable, missing image_id"
            });
        }
        const s3Key = `${user_id}/${session_id}/${image_id}`;
        console.log("S3Key: ", s3Key);
        let connection;
        try {
            const presignedUrl = await getPreSignedS3URL(s3Key);
            try {
                connection = await getDbConnection();
                await connection.execute(
                    `INSERT INTO images (image_id, user_id, session_id, status)
                    VALUES (:image_id, :user_id, :session_id, :status)`,
                    {
                        image_id,
                        user_id,
                        session_id,
                        status: "pending"
                    },
                    { autoCommit: true }
                );
                console.log("Entry inserted in database");
                return res.json({ presignedUrl });
            } catch(err ) {
                return res.status(500).json({error : `Failed to insert entry in database: ${err.message}`});
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (closeErr) {
                        console.error("Error closing database connection:", closeErr);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: `Failed to generate upload URL: ${err.message}` });
        }
    });
    /**
     * @brief POST endpoint to set a completed image as the active profile photo.
     */
    router.post("/active", async (req, res) => {
        const { user_id, session_id, image_id } = req.body || {};
        if (!user_id || !session_id || !image_id) {
            return res.status(400).json({ error: "user_id, session_id, and image_id are required" });
        }
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized, token is required" });
        }
        let decoded;
        try {
            decoded = jwtUtil.verifyToken(token);
        } catch (err) {
            return res.status(401).json({ error: "Unauthorized, invalid token" });
        }
        if (!decoded || decoded.user_id !== user_id) {
            return res.status(401).json({ error: "Unauthorized, user id or session id does not match token" });
        }
        let connection;
        try {
            connection = await getDbConnection();
            const selectRes = await connection.execute(
                `SELECT status FROM images 
                 WHERE user_id = :user_id 
                   AND session_id = :session_id 
                   AND image_id = :image_id`,
                { user_id, session_id, image_id }
            );
            if (!selectRes.rows || selectRes.rows.length === 0) {
                return res.status(404).json({ error: "Image not found" });
            }
            const status = selectRes.rows[0][0];
            if (status === "pending") {
                return res.status(400).json({ error: "Please try again in some while or reupload the image" });
            }
            await connection.execute(
                `UPDATE images SET status = 'completed' 
                 WHERE user_id = :user_id AND status = 'active'`,
                { user_id }
            );
            await connection.execute(
                `UPDATE images SET status = 'active' 
                 WHERE user_id = :user_id 
                   AND session_id = :session_id 
                   AND image_id = :image_id`,
                { user_id, session_id, image_id }
            );
            const activeRes = await connection.execute(
                `SELECT 1 FROM active WHERE user_id = :user_id`,
                { user_id }
            );
            if (activeRes.rows && activeRes.rows.length > 0) {
                await connection.execute(
                    `UPDATE active 
                     SET session_id = :session_id, image_id = :image_id 
                     WHERE user_id = :user_id`,
                    { session_id, image_id, user_id }
                );
            } else {
                await connection.execute(
                    `INSERT INTO active (user_id, session_id, image_id) 
                     VALUES (:user_id, :session_id, :image_id)`,
                    { user_id, session_id, image_id }
                );
            }
            return res.json({ message: "Image set as active successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: `Failed to set active image: ${err.message}` });
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (closeErr) {
                    console.error("Error closing database connection:", closeErr);
                }
            }
        }
    });
    return router;
};
module.exports = imageRoutes;