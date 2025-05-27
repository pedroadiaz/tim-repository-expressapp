const bcrypt = require('bcrypt');
const crypto = require('crypto');
const dbService = require('./database.service.js');
const path = require('path');

// Nodemailer for sending emails
const nodemailer = require('nodemailer');

// Lazy initialization for email transporter
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
    return transporter;
}

const tableName = "gmrgfeoc_simplereports";
// Use database service for all queries
const connectionPool = {
    query: (query, params, callback) => dbService.query(query, params, callback)
};

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
    // At least one number, one special character, and at least 9 characters long
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{9,}$/;
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
                return res.redirect('/forgot-password?error=' + encodeURIComponent("An error occurred. Please try again."));
            }
            
            if (rows.length === 0) {
                return res.redirect('/forgot-password?error=' + encodeURIComponent("No account exists with that email address."));
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
                        return res.redirect('/forgot-password?error=' + encodeURIComponent("An error occurred. Please try again."));
                    }
                    
                    // Send email with temp password
                    try {
                        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
                        
                        const mailOptions = {
                            from: process.env.EMAIL_FROM,
                            to: email,
                            subject: "Password Reset",
                            html: `
                                <h1>Password Reset</h1>
                                <p>You have requested to reset your password.</p>
                                <p>Your temporary password is: <strong>${tempPassword}</strong></p>
                                <p>Please use this temporary password to log in and then set a new password.</p>
                                <p>This temporary password will expire in 1 hour.</p>
                                <p><a href="${resetUrl}">Click here to reset your password</a></p>
                            `,
                            text: `
                                Password Reset
                                
                                You have requested to reset your password.
                                Your temporary password is: ${tempPassword}
                                Please use this temporary password to log in and then set a new password.
                                This temporary password will expire in 1 hour.
                                
                                To reset your password, visit: ${resetUrl}
                            `
                        };
                        
                        await getTransporter().sendMail(mailOptions);
                        
                        return res.redirect('/forgot-password?success=' + encodeURIComponent("Password reset instructions have been sent to your email."));
                    } catch (emailErr) {
                        console.error("Email sending error:", emailErr);
                        return res.redirect('/forgot-password?error=' + encodeURIComponent("Failed to send reset email. Please try again or contact support."));
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
                return res.redirect('/forgot-password?error=' + encodeURIComponent("Invalid or expired reset link. Please request a new one."));
            }
            
            return res.sendFile(path.join(__dirname, '../views', 'reset_password.html'));
        }
    );
};

// Process reset password
exports.processResetPassword = (req, res) => {
    const { email, token, temp_password, new_password, confirm_password } = req.body;
    
    // Validate passwords
    if (new_password !== confirm_password) {
        return res.redirect(`/reset-password?error=${encodeURIComponent("Passwords do not match.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
    }
    
    if (!isValidPassword(new_password)) {
        return res.redirect(`/reset-password?error=${encodeURIComponent("Password must contain at least one number, one special character, and be at least 9 characters long.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
    }
    
    // Verify token and temp password
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE email = ? AND password_reset_token = ? AND password_reset_expires > NOW()",
        [email, token],
        (err, rows) => {
            if (err) {
                return res.redirect(`/reset-password?error=${encodeURIComponent("An error occurred. Please try again.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
            }
            
            if (rows.length === 0) {
                return res.redirect(`/reset-password?error=${encodeURIComponent("Invalid or expired reset token. Please request a new password reset.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
            }
            
            const user = rows[0];
            
            // Verify temp password
            if (!bcrypt.compareSync(temp_password, user.temp_password)) {
                return res.redirect(`/reset-password?error=${encodeURIComponent("Incorrect temporary password.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
            }
            
            // Hash new password
            const hashedPassword = bcrypt.hashSync(new_password, 15);
            
            // Update user record
            connectionPool.query(
                "UPDATE " + tableName + ".users SET password = ?, account_locked = FALSE, temp_password = NULL, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
                [hashedPassword, user.id],
                (updateErr) => {
                    if (updateErr) {
                        return res.redirect(`/reset-password?error=${encodeURIComponent("Failed to update password. Please try again.")}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
                    }
                    
                    return res.redirect('/login?success=' + encodeURIComponent("Your password has been reset successfully. You can now log in with your new password."));
                }
            );
        }
    );
};

module.exports = exports;