const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

console.log('S3 Service Initialized', process.env.AWS_S3_BUCKET);
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Upload a logo file to S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The file name
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<string>} - The S3 file URL
 */
async function uploadLogo(fileBuffer, fileName, mimeType) {
    try {
        const fileExtension = path.extname(fileName);
        const timestamp = Date.now();
        const s3Key = `logos/${timestamp}${fileExtension}`;

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileBuffer,
            ContentType: mimeType,
            ACL: 'public-read' // Make the file publicly accessible
        };

        const result = await s3.upload(uploadParams).promise();
        return result.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload logo to S3');
    }
}

/**
 * Delete a logo file from S3
 * @param {string} s3Url - The S3 URL of the file to delete
 * @returns {Promise<void>}
 */
async function deleteLogo(s3Url) {
    try {
        // Extract the key from the S3 URL
        const urlParts = s3Url.split('/');
        const key = urlParts.slice(-2).join('/'); // Get 'logos/filename.ext'

        const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(deleteParams).promise();
    } catch (error) {
        console.error('Error deleting from S3:', error);
        throw new Error('Failed to delete logo from S3');
    }
}

module.exports = {
    uploadLogo,
    deleteLogo
};