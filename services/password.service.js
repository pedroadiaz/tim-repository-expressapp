const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mysql = require('mysql2');

// AWS SES for sending emails
const AWS = require('aws-sdk');

// Configure AWS SES
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const tableName = "gmrgfeoc_simplereports";
const connectionPool = mysql.createPool({
    host: process.env.DATABASE_ENDPOINT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});

// Generate a temporary password
const generateTempPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Validate password meets requirements
const isValidPassword = (password) => {
    // At least one number, one letter, and at least 9 characters long
    const regex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{9,}$/;
    return regex.test(password);
};

// Generate password reset token
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Request password reset
exports.requestPasswordReset = (req, res) => {
    const { email } = req.body;
    
    // Check if email exists
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE email = ?", 
        [email], 
        (err, rows) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).render('forgot_password.html', { error: "An error occurred. Please try again." });
            }
            
            if (rows.length === 0) {
                return res.status(404).render('forgot_password.html', { error: "No account exists with that email address." });
            }
            
            const user = rows[0];
            const tempPassword = generateTempPassword();
            const hashedTempPassword = bcrypt.hashSync(tempPassword, 15);
            const resetToken = generateResetToken();
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour
            
            // Update user record
            connectionPool.query(
                "UPDATE " + tableName + ".users SET account_locked = TRUE, temp_password = ?, password_reset_token = ?, password_reset_expires = ? WHERE id = ?",
                [hashedTempPassword, resetToken, resetExpires, user.id],
                async (updateErr) => {
                    if (updateErr) {
                        console.error("Update error:", updateErr);
                        return res.status(500).render('forgot_password.html', { error: "An error occurred. Please try again." });
                    }
                    
                    // Send email with temp password
                    try {
                        const ses = new AWS.SES({ apiVersion: '2010-12-01' });
                        
                        const params = {
                            Destination: {
                                ToAddresses: [email]
                            },
                            Message: {
                                Body: {
                                    Html: {
                                        Charset: "UTF-8",
                                        Data: `
                                            <h1>Password Reset</h1>
                                            <p>You have requested to reset your password.</p>
                                            <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                                            <p>Please use this temporary password to log in and then set a new password.</p>
                                            <p>This temporary password will expire in 1 hour.</p>
                                            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}">Click here to reset your password</a></p>
                                        `
                                    },
                                    Text: {
                                        Charset: "UTF-8",
                                        Data: `
                                            Password Reset
                                            
                                            You have requested to reset your password.
                                            Your temporary password is: ${tempPassword}
                                            Please use this temporary password to log in and then set a new password.
                                            This temporary password will expire in 1 hour.
                                            
                                            To reset your password, visit: ${process.env.APP_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}
                                        `
                                    }
                                },
                                Subject: {
                                    Charset: "UTF-8",
                                    Data: "Password Reset"
                                }
                            },
                            Source: process.env.SES_EMAIL_FROM || "noreply@example.com"
                        };
                        
                        await ses.sendEmail(params).promise();
                        
                        return res.status(200).render('forgot_password.html', { 
                            success: "Password reset instructions have been sent to your email." 
                        });
                    } catch (emailErr) {
                        console.error("Email sending error:", emailErr);
                        return res.status(500).render('forgot_password.html', { 
                            error: "Failed to send reset email. Please try again or contact support." 
                        });
                    }
                }
            );
        }
    );
};

// Reset password page
exports.resetPasswordPage = (req, res) => {
    const { email, token } = req.query;
    
    if (!email || !token) {
        return res.redirect('/forgot-password');
    }
    
    // Check if token is valid
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE email = ? AND password_reset_token = ? AND password_reset_expires > NOW()",
        [email, token],
        (err, rows) => {
            if (err || rows.length === 0) {
                return res.status(400).render('forgot_password.html', { 
                    error: "Invalid or expired reset link. Please request a new one." 
                });
            }
            
            return res.render('reset_password.html', { email, token });
        }
    );
};

// Process reset password
exports.processResetPassword = (req, res) => {
    const { email, token, temp_password, new_password, confirm_password } = req.body;
    
    // Validate passwords
    if (new_password !== confirm_password) {
        return res.status(400).render('reset_password.html', { 
            error: "Passwords do not match.", 
            email, 
            token 
        });
    }
    
    if (!isValidPassword(new_password)) {
        return res.status(400).render('reset_password.html', { 
            error: "Password must contain at least one number, one letter, and be at least 9 characters long.", 
            email, 
            token 
        });
    }
    
    // Verify token and temp password
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE email = ? AND password_reset_token = ? AND password_reset_expires > NOW()",
        [email, token],
        (err, rows) => {
            if (err) {
                return res.status(500).render('reset_password.html', { 
                    error: "An error occurred. Please try again.", 
                    email, 
                    token 
                });
            }
            
            if (rows.length === 0) {
                return res.status(400).render('reset_password.html', { 
                    error: "Invalid or expired reset token. Please request a new password reset.", 
                    email, 
                    token 
                });
            }
            
            const user = rows[0];
            
            // Verify temp password
            if (!bcrypt.compareSync(temp_password, user.temp_password)) {
                return res.status(400).render('reset_password.html', { 
                    error: "Incorrect temporary password.", 
                    email, 
                    token 
                });
            }
            
            // Hash new password
            const hashedPassword = bcrypt.hashSync(new_password, 15);
            
            // Update user record
            connectionPool.query(
                "UPDATE " + tableName + ".users SET password = ?, account_locked = FALSE, temp_password = NULL, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
                [hashedPassword, user.id],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).render('reset_password.html', { 
                            error: "Failed to update password. Please try again.", 
                            email, 
                            token 
                        });
                    }
                    
                    return res.status(200).render('login.html', { 
                        success: "Your password has been reset successfully. You can now log in with your new password." 
                    });
                }
            );
        }
    );
};

module.exports = exports;