const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2');
const path = require('path');

const tableName = "gmrgfeoc_simplereports";
const connectionPool = mysql.createPool({
    host: process.env.DATABASE_ENDPOINT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});

// Define referral codes and their corresponding trial days
const REFERRAL_CODES = {
    'seismeseslibre': 180,    // 6 months free
    'gratisyear': 365,        // 1 year free
    'timsfriendfree': -1      // unlimited free access
};

/**
 * Process a new user registration with referral code
 * @param {Object} user - User object with id, email and referral code
 * @returns {Promise<Object>} - Updated user data with trial info
 */
exports.processNewUserRegistration = async (userId, email, referralCode) => {
    return new Promise((resolve, reject) => {
        let trialDays = 15; // Default trial period
        let unlimitedAccess = false;
        
        // Check if referral code exists and is valid
        if (referralCode && REFERRAL_CODES[referralCode]) {
            const days = REFERRAL_CODES[referralCode];
            if (days === -1) {
                unlimitedAccess = true;
                trialDays = null;
            } else {
                trialDays = days;
            }
        }
        
        // Calculate trial end date
        let trialEndDate = null;
        if (trialDays) {
            trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + trialDays);
        }
        
        // Update user with trial information
        connectionPool.query(
            "UPDATE " + tableName + ".users SET trial_days = ?, trial_end_date = ?, unlimited_access = ? WHERE id = ?",
            [trialDays, trialEndDate, unlimitedAccess, userId],
            async (err, result) => {
                if (err) {
                    console.error("Error updating user with trial info:", err);
                    return reject(err);
                }
                
                // If unlimited access, no need to create Stripe customer
                if (unlimitedAccess) {
                    return resolve({
                        userId,
                        trialDays,
                        trialEndDate,
                        unlimitedAccess,
                        needsPaymentMethod: false
                    });
                }
                
                try {
                    // Create Stripe customer
                    const customer = await stripe.customers.create({
                        email: email,
                        metadata: {
                            userId: userId
                        }
                    });
                    
                    // Update user with Stripe customer ID
                    connectionPool.query(
                        "UPDATE " + tableName + ".users SET stripe_customer_id = ? WHERE id = ?",
                        [customer.id, userId],
                        (updateErr) => {
                            if (updateErr) {
                                console.error("Error updating user with Stripe customer ID:", updateErr);
                                return reject(updateErr);
                            }
                            
                            resolve({
                                userId,
                                stripeCustomerId: customer.id,
                                trialDays,
                                trialEndDate,
                                unlimitedAccess,
                                needsPaymentMethod: true
                            });
                        }
                    );
                } catch (stripeErr) {
                    console.error("Error creating Stripe customer:", stripeErr);
                    reject(stripeErr);
                }
            }
        );
    });
};

/**
 * Create a checkout session for collecting payment method
 * @param {string} customerId - Stripe customer ID
 * @param {string} userId - User ID in our database
 * @param {number} trialDays - Number of trial days
 * @returns {Promise<Object>} - Checkout session
 */
exports.createCheckoutSession = async (customerId, userId, trialDays) => {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    
    // Convert to Unix timestamp (seconds)
    const trialEnd = Math.floor(trialEndDate.getTime() / 1000);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        subscription_data: {
            trial_end: trialEnd,
        },
        success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/payment-cancel`,
        metadata: {
            userId: userId
        }
    });
    
    return session;
};

/**
 * Process successful checkout completion
 * @param {string} sessionId - Checkout session ID
 * @returns {Promise<Object>} - Updated user data
 */
exports.processCheckoutSuccess = async (sessionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Retrieve checkout session
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['subscription']
            });
            
            // Get user ID from metadata
            const userId = session.metadata.userId;
            const subscriptionId = session.subscription.id;
            
            // Update user with subscription ID
            connectionPool.query(
                "UPDATE " + tableName + ".users SET stripe_subscription_id = ? WHERE id = ?",
                [subscriptionId, userId],
                (err) => {
                    if (err) {
                        console.error("Error updating user with subscription ID:", err);
                        return reject(err);
                    }
                    
                    resolve({
                        userId,
                        subscriptionId
                    });
                }
            );
        } catch (err) {
            console.error("Error processing checkout success:", err);
            reject(err);
        }
    });
};

/**
 * Handle webhook events from Stripe
 * @param {Object} event - Stripe event object
 * @returns {Promise<Object>} - Result of handling the event
 */
exports.handleWebhookEvent = async (event) => {
    switch (event.type) {
        case 'customer.subscription.created':
            return await handleSubscriptionCreated(event.data.object);
        
        case 'customer.subscription.updated':
            return await handleSubscriptionUpdated(event.data.object);
        
        case 'customer.subscription.deleted':
            return await handleSubscriptionDeleted(event.data.object);
        
        case 'invoice.payment_succeeded':
            return await handleInvoicePaymentSucceeded(event.data.object);
        
        case 'invoice.payment_failed':
            return await handleInvoicePaymentFailed(event.data.object);
        
        default:
            console.log(`Unhandled event type: ${event.type}`);
            return { status: 'ignored' };
    }
};

/**
 * Handle subscription created event
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<Object>} - Result of handling the event
 */
async function handleSubscriptionCreated(subscription) {
    return new Promise((resolve, reject) => {
        // Get customer ID
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID
        connectionPool.query(
            "SELECT * FROM " + tableName + ".users WHERE stripe_customer_id = ?",
            [customerId],
            (err, rows) => {
                if (err) {
                    console.error("Error finding user by Stripe customer ID:", err);
                    return reject(err);
                }
                
                if (rows.length === 0) {
                    console.error("No user found with Stripe customer ID:", customerId);
                    return reject(new Error("User not found"));
                }
                
                const user = rows[0];
                
                // Update user with subscription ID
                connectionPool.query(
                    "UPDATE " + tableName + ".users SET stripe_subscription_id = ? WHERE id = ?",
                    [subscription.id, user.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.error("Error updating user with subscription ID:", updateErr);
                            return reject(updateErr);
                        }
                        
                        resolve({
                            status: 'success',
                            userId: user.id,
                            subscriptionId: subscription.id
                        });
                    }
                );
            }
        );
    });
}

/**
 * Handle subscription updated event
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<Object>} - Result of handling the event
 */
async function handleSubscriptionUpdated(subscription) {
    return new Promise((resolve, reject) => {
        // Get subscription status
        const status = subscription.status;
        const isPaid = status === 'active' || status === 'trialing';
        
        // Update user with subscription status
        connectionPool.query(
            "UPDATE " + tableName + ".users SET is_paid = ? WHERE stripe_subscription_id = ?",
            [isPaid, subscription.id],
            (err) => {
                if (err) {
                    console.error("Error updating user with subscription status:", err);
                    return reject(err);
                }
                
                resolve({
                    status: 'success',
                    subscriptionId: subscription.id,
                    subscriptionStatus: status,
                    isPaid
                });
            }
        );
    });
}

/**
 * Handle subscription deleted event
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<Object>} - Result of handling the event
 */
async function handleSubscriptionDeleted(subscription) {
    return new Promise((resolve, reject) => {
        // Update user to mark as not paid
        connectionPool.query(
            "UPDATE " + tableName + ".users SET is_paid = FALSE WHERE stripe_subscription_id = ?",
            [subscription.id],
            (err) => {
                if (err) {
                    console.error("Error updating user with subscription deletion:", err);
                    return reject(err);
                }
                
                resolve({
                    status: 'success',
                    subscriptionId: subscription.id,
                    isPaid: false
                });
            }
        );
    });
}

/**
 * Handle invoice payment succeeded event
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<Object>} - Result of handling the event
 */
async function handleInvoicePaymentSucceeded(invoice) {
    // If it's a subscription invoice
    if (invoice.subscription) {
        return new Promise((resolve, reject) => {
            // Update user to mark as paid
            connectionPool.query(
                "UPDATE " + tableName + ".users SET is_paid = TRUE WHERE stripe_subscription_id = ?",
                [invoice.subscription],
                (err) => {
                    if (err) {
                        console.error("Error updating user with payment success:", err);
                        return reject(err);
                    }
                    
                    resolve({
                        status: 'success',
                        subscriptionId: invoice.subscription,
                        isPaid: true
                    });
                }
            );
        });
    }
    
    return { status: 'ignored' };
}

/**
 * Handle invoice payment failed event
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<Object>} - Result of handling the event
 */
async function handleInvoicePaymentFailed(invoice) {
    // If it's a subscription invoice
    if (invoice.subscription) {
        return new Promise((resolve, reject) => {
            // Note: We might not want to immediately mark as not paid for first failure
            // This depends on your business rules
            resolve({
                status: 'noted',
                subscriptionId: invoice.subscription,
                message: 'Payment failed - action may be needed'
            });
        });
    }
    
    return { status: 'ignored' };
}

/**
 * Check if user needs to see a trial expiration warning
 * @param {Object} user - User object from database
 * @returns {Promise<Object>} - Warning info if needed
 */
exports.checkTrialWarning = async (user) => {
    // Don't show warning for unlimited access or if already paid
    if (user.unlimited_access || user.is_paid) {
        return { showWarning: false };
    }
    
    // If no trial end date, no warning needed
    if (!user.trial_end_date) {
        return { showWarning: false };
    }
    
    // Calculate days remaining
    const now = new Date();
    const trialEnd = new Date(user.trial_end_date);
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    
    // Only show warning if 5 or fewer days remaining
    if (daysRemaining <= 5 && daysRemaining > 0) {
        // Check if we've already shown a warning today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (user.last_reminder_date === today) {
            return { showWarning: false };
        }
        
        // Update last reminder date
        return new Promise((resolve, reject) => {
            connectionPool.query(
                "UPDATE " + tableName + ".users SET last_reminder_date = ? WHERE id = ?",
                [today, user.id],
                (err) => {
                    if (err) {
                        console.error("Error updating last reminder date:", err);
                        return reject(err);
                    }
                    
                    resolve({
                        showWarning: true,
                        daysRemaining,
                        trialEndDate: user.trial_end_date
                    });
                }
            );
        });
    }
    
    return { showWarning: false };
};

/**
 * Create a customer portal session for managing subscription
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} - Portal session
 */
exports.createCustomerPortalSession = async (customerId) => {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_URL}/settings`,
    });
    
    return session;
};

module.exports = exports;