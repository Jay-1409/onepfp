const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const jwtUtil = require('../utils/jwt');
const s3Client = new S3Client({});
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
        if (!jwtUtil.verifyToken(token)) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }
        const s3Key = req.body.s3Key;
        if (!s3Key) {
            return res.status(400).json({
                error: "s3Key is required"
            });
        }
        try {
            const presignedUrl = await getPreSignedS3URL(s3Key);
            return res.json({ presignedUrl });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to generate upload URL" });
        }
    });
    return router;
};
module.exports = imageRoutes;