const AWS = require("aws-sdk");
const jwtUtil = require('../utils/jwt');
const imageRoutes = (express) => {
    const router = express.Router();

    /**
     * @brief The user asks for a pre-signed AWS URL from the backend service.
     * @param {string} s3Key Contains the User_ID / Session_id / Image_id for that user.
     * @returns {string} Pre-signed S3 upload URL
     */
    function getPreSignedS3URL(s3Key) {
        const s3 = new AWS.S3();
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            Expires: 60 * 5,
            ContentType: "image/jpeg"
        };
        return s3.getSignedUrl("putObject", params);
    }

    router.post("/upload", (req, res) => {
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
        const presignedUrl = getPreSignedS3URL(s3Key);
        res.json({ presignedUrl });
    });

    return router;
};

module.exports = imageRoutes;