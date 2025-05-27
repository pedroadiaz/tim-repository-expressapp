const AWS = require('aws-sdk');

// Configure AWS Secrets Manager

console.log('Initializing AWS Secrets Manager...');
console.log("aws region: ", process.env.AWS_REGION);
const secretsManager = new AWS.SecretsManager({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const SECRET_NAME = 'simple_reports_development';

/**
 * Load secrets from AWS Secrets Manager and set them as environment variables
 * @returns {Promise<void>}
 */
async function loadSecrets() {
    try {
        console.log('Loading secrets from AWS Secrets Manager...');
        
        const result = await secretsManager.getSecretValue({
            SecretId: SECRET_NAME
        }).promise();
        
        if (!result.SecretString) {
            throw new Error('No secret string found');
        }
        
        const secrets = JSON.parse(result.SecretString);
        
        // Set environment variables from secrets
        process.env.DATABASE_ENDPOINT = secrets.DATABASE_ENDPOINT;
        process.env.DATABASE_USER = secrets.DATABASE_USER;
        process.env.DATABASE_PASSWORD = secrets.DATABASE_PASSWORD;
        process.env.EMAIL_FROM = secrets.EMAIL_FROM;
        process.env.EMAIL_USER = secrets.EMAIL_USER;
        process.env.EMAIL_PASSWORD = secrets.EMAIL_PASSWORD;
        process.env.STRIPE_SECRET_KEY = secrets.STRIPE_SECRET_KEY;
        process.env.STRIPE_PUBLISHABLE_KEY = secrets.STRIPE_PUBLISHABLE_KEY;
        process.env.STRIPE_PRICE_ID = secrets.STRIPE_PRICE_ID;
        
        console.log('Successfully loaded secrets from AWS Secrets Manager');
    } catch (error) {
        console.error('Error loading secrets from AWS Secrets Manager:', error);
        console.log('Falling back to local .env file...');
        
        // If secrets manager fails, continue with existing .env file
        // This allows for graceful degradation during development or if AWS is unavailable
    }
}

/**
 * Get a specific secret value (alternative method for individual secrets)
 * @param {string} secretKey - The key within the secret
 * @returns {Promise<string>} - The secret value
 */
async function getSecret(secretKey) {
    try {
        const result = await secretsManager.getSecretValue({
            SecretId: SECRET_NAME
        }).promise();
        
        const secrets = JSON.parse(result.SecretString);
        return secrets[secretKey];
    } catch (error) {
        console.error(`Error getting secret ${secretKey}:`, error);
        throw error;
    }
}

module.exports = {
    loadSecrets,
    getSecret
};