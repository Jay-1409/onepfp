const AWS = require("aws-sdk");

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