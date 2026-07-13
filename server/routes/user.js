export const userRoutes = (express)=>{
    const router = express.Router();
    /**
     * @breif The user asks for a pre signed AWS URL from the backend service.
     * @param req.body.S3Key Contains the User_ID,/ Session_id/ Image_id for that user.
     * @returns 
     */
    function getPreSignedS3URL(s3Key){
        const s3 = new AWS.S3();
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            Expires: 60 * 5,
        };
        return s3.getSignedUrl('putObject', params);
    }
    
    router.get("/upload", (req, res) => {
        const s3Key = req.body.s3Key;
        const presignedUrl = getPreSignedS3URL(s3Key);
        res.json({ presignedUrl });
    });
}