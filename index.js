const prefix = "";
const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')

const cors = require('cors')
const app = express()
const path = require('path');
const helmet = require('helmet');

const passport = require('passport')
const session = require('express-session')
const LocalStrategy = require('passport-local').Strategy


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const Secret = 'THISISAVERYBIGSECRETX281';

const mysql = require('mysql2');
const url = require('url');
const fetch = require('node-fetch');

require('dotenv').config();

// Load secrets from AWS Secrets Manager synchronously before anything else
const secretsService = require('./services/secrets.service.js');

// Block startup until secrets are loaded
async function initializeApp() {
    try {
        await secretsService.loadSecrets();
        console.log('Secrets loaded successfully from AWS Secrets Manager');
    } catch (err) {
        console.error('Warning: Could not load secrets from AWS, using local .env:', err.message);
    }
}

const admin = "[user]";
const tableName = "gmrgfeoc_simplereports";

// Use the shared database service
const dbService = require('./services/database.service.js');

// Create a connection pool interface that uses the database service
const connectionPool = {
    query: (query, params, callback) => dbService.query(query, params, callback)
};

// Export the initialization promise so server.js can wait for it
module.exports.initPromise = initializeApp();


app.use(helmet({
    contentSecurityPolicy: false,
    hidePoweredBy: true
}));

app.use(session({
    secret: Secret,
    resave: false,
    saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cors())

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// Update auth function to check if account is locked
authUser = (user, password, done) => {
    console.log("Authenticating")

    connectionPool.query("SELECT * FROM " + tableName + ".users WHERE email = ?", [user], (err, rows) => {
        console.log("Authenticating")
        console.log(rows)

        if (err) {
            console.log("There was an error - the sql connection itself isn't passing")
            console.log(err)
            return done(null, false, {message: "Incorrect username or password"});
        }
        if (rows.length === 0) {
            console.log("No user found");
            return done(null, false, {message: "Incorrect username or password"});
        }
        
        // Check if account is locked
        if (rows[0].account_locked) {
            console.log("Account is locked");
            return done(null, false, {message: "Account is locked. Please reset your password."});
        }
        
        // Check temp password if exists
        if (rows[0].temp_password && bcrypt.compareSync(password, rows[0].temp_password)) {
            console.log("Authenticated with temp password");
            return done(null, rows[0]);
        }
        
        if (bcrypt.compareSync(password, rows[0].password)) {
            console.log("Authenticated");
            return done(null, rows[0])
        }

        console.log("Incorrect password");
        return done(null, false, {message: "Incorrect username or password"})
    });
}


authUser = (user, password, done) => {
    console.log("Authenticating")

    connectionPool.query("SELECT * FROM " + tableName + ".users WHERE email = ?", [user], (err, rows) => {
        console.log("Authenticating")
        console.log(rows)

        if (err) {
            console.log("There was an error - the sql connection itself isn't passing")
            console.log(err)
            return done(null, false, {message: "Incorrect username or password"});
        }
        if (rows.length === 0) {
            console.log("No user found");
            return done(null, false, {message: "Incorrect username or password"});
        }
        
        // Check temp password if exists
        if (rows[0].temp_password && bcrypt.compareSync(password, rows[0].temp_password)) {
            console.log("Authenticated with temp password");
            return done(null, rows[0]);
        }
        
        // Check if account is locked
        if (rows[0].account_locked) {
            console.log("Account is locked");
            return done(null, false, {message: "Account is locked. Please reset your password."});
        }
        
        if (bcrypt.compareSync(password, rows[0].password)) {
            console.log("Authenticated");
            return done(null, rows[0])
        }

        console.log("Incorrect password");
        return done(null, false, {message: "Incorrect username or password"})
    });
}



checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        // Check if user is using a temp password
        if (req.user && req.user.temp_password) {
            // Allow access to password change endpoints
            if (req.path === '/app/changePassword' || 
                req.path === '/app/changePasswordFromTemp' || 
                req.path === '/change-password-required' ||
                req.path === '/logout') {
                return next();
            }
            // Redirect to password change page
            return res.redirect(prefix + "/change-password-required");
        }
        return next();
    }
    res.redirect(prefix + "/login")
}

passport.use(new LocalStrategy(authUser))
passport.use(
    new JWTstrategy(
        {
            secretOrKey: Secret,
            jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
        },
        async (token, done) => {
            console.log("Successful auth with JWT strategy")
            try {
                return done(null, token.user);
            } catch (error) {
                done(error);
            }
        }
    )
);
passport.serializeUser((user, done) => {
    console.log("Serializing")
    connectionPool.query("SELECT * FROM " + tableName + ".admins WHERE userId = ?", [user.id], (err, rows) => {
        if (err) {
            console.log("There was an error - the sql connection itself isn't passing")
            return done(null, false, {status: "Fatal"});
        }
        if (rows.length === 0) {
            console.log("No admin found");
            user.admin = false
        } else {
            console.log("Admin found")
            user.admin = true
        }


        done(null, {id: user.id, admin: user.admin})
    });



})


passport.deserializeUser((userSession, done) => {
    // Fetch full user data from database
    connectionPool.query("SELECT * FROM " + tableName + ".users WHERE id = ?", [userSession.id], (err, rows) => {
        if (err || rows.length === 0) {
            return done(err, false);
        }
        
        const user = rows[0];
        user.admin = userSession.admin; // Preserve admin status from session
        
        return done(null, user);
    });
})


let count = 1

printData = (req, res, next) => {


    next()
}

app.use(printData)


const reportService = require('./services/reports.service.js');
const passwordService = require('./services/password.service.js');
const stripeService = require('./services/stripe.service.js');

app.get(prefix + "/app/isloggedin", (req, res) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({success: true});
    } else {
        return res.status(200).json({success: false});
    }
});

app.get(prefix + "/api/isloggedin", (req, res, next) => {
    console.log('Checking JWT token');
    next();
}, passport.authenticate('jwt', {session: false}), (req, res) => {
    res.status(200).json({success: true});
});






app.get(prefix + "/app/getUser", checkAuthenticated, (req, res) => {
    reportService.getUser(req, res);
});
app.get(prefix + "/app/getReportEntriesByUser", checkAuthenticated, (req, res) => {
    reportService.getReportEntriesByUser(req, res)
});
app.post(prefix + "/app/addReportEntry", checkAuthenticated, (req, res) => {
    reportService.addReportEntry(req, res)
});
app.post(prefix + "/app/getReport", checkAuthenticated, (req, res) => {
    reportService.getReport(req, res)
});
app.post(prefix + "/app/deleteReportByUuid", checkAuthenticated, (req, res) => {
    reportService.deleteReportByUuid(req, res)
});
app.post(prefix + "/app/restoreDeletion", checkAuthenticated, (req, res) => {
    reportService.restoreDeletionByUsersLastDeleted(req, res)
});
app.post(prefix + "/app/changePassword", checkAuthenticated, (req, res) => {
    passwordService.changePassword(req, res);
});
app.post(prefix + "/app/changePasswordFromTemp", checkAuthenticated, (req, res) => {
    passwordService.changePasswordFromTemp(req, res);
});
app.get(prefix + '/app/getConsentStatus', checkAuthenticated, (req, res) => {
    reportService.getConsentStatus(req, res);
});
app.post(prefix + '/app/setConsentStatus', checkAuthenticated, (req, res) => {
    reportService.setConsentStatus(req, res);
});
// Special middleware for saveReportLayout to handle sendBeacon requests
app.post(prefix + '/app/saveReportLayout', 
    express.raw({type: 'application/octet-stream', limit: '10mb'}),
    express.json(),
    checkAuthenticated, 
    (req, res) => {
        // Parse the body if it's raw (from sendBeacon)
        if (Buffer.isBuffer(req.body)) {
            try {
                const bodyString = req.body.toString();
                req.body = JSON.parse(bodyString);
                console.log("Parsed sendBeacon request body");
            } catch (parseError) {
                console.error("Error parsing raw body:", parseError);
                return res.status(400).json({status: "Invalid request format"});
            }
        }
        
        reportService.saveReportLayout(req, res);
    }
);
app.get(prefix + '/app/getReportLayout', checkAuthenticated, (req, res) => {
    reportService.getReportLayout(req, res);
});
// EULA page and handling
app.get(prefix + "/eula", checkAuthenticated, (req, res) => {
    // Get params from URL
    const userId = req.query.userId;
    const needsPayment = req.query.needsPayment === 'true';
    const stripeCustomerId = req.query.stripeCustomerId;
    const trialDays = parseInt(req.query.trialDays || '15', 10);
    
    // Render EULA page with userId
    res.render('eula.html', {
        userId: userId,
        needsPayment: needsPayment,
        stripeCustomerId: stripeCustomerId,
        trialDays: trialDays
    });
});

// Accept EULA
app.post(prefix + "/accept-eula", checkAuthenticated, async (req, res) => {
    const userId = req.body.userId;
    const needsPayment = req.body.needsPayment === 'true';
    const stripeCustomerId = req.body.stripeCustomerId;
    const trialDays = parseInt(req.body.trialDays || '15', 10);
    
    console.log("EULA acceptance - userId:", userId, "needsPayment:", needsPayment, "stripeCustomerId:", stripeCustomerId, "trialDays:", trialDays);
    
    // Record EULA acceptance in database
    connectionPool.query(
        "UPDATE " + tableName + ".users SET eula_accepted = TRUE, eula_accepted_date = NOW() WHERE id = ?",
        [userId],
        async (err) => {
            if (err) {
                console.error("Error recording EULA acceptance:", err);
                return res.redirect(prefix + "/main");
            }
            
            // If user needs payment, create checkout session and redirect to Stripe
            if (needsPayment && stripeCustomerId) {
                console.log("Creating Stripe checkout session...");
                try {
                    // Create checkout session
                    const checkoutSession = await stripeService.createCheckoutSession(
                        stripeCustomerId,
                        userId,
                        trialDays
                    );
                    
                    console.log("Redirecting to Stripe checkout:", checkoutSession.url);
                    // Redirect to Stripe checkout
                    return res.redirect(checkoutSession.url);
                } catch (stripeErr) {
                    console.error("Error creating checkout session:", stripeErr);
                    return res.redirect(prefix + "/main");
                }
            } else {
                console.log("No payment needed or missing stripeCustomerId, redirecting to main");
                // No payment needed, redirect to main page
                return res.redirect(prefix + "/main");
            }
        }
    );
});

// Decline EULA
app.post(prefix + "/decline-eula", checkAuthenticated, (req, res) => {
    // Log out the user
    req.logout(function (err) {
        if (err) {
            console.log("There was an error logging out")
            return res.status(500).json({success: false, message: "Error logging out"})
        }
        
        // Redirect to login page
        return res.redirect(prefix + "/login?error=" + encodeURIComponent("You must accept the EULA to use SimpleReports"));
    });
});

app.get(prefix + "/upgrade", checkAuthenticated, (req, res) => {
    // Check for success or error messages
    const success = req.query.success;
    const error = req.query.error;
    
    res.render('upgrade.html', {
        user: req.user,
        success: success,
        error: error
    });
});

// Create Stripe checkout session
app.post(prefix + "/create-checkout-session", checkAuthenticated, async (req, res) => {
    try {
        // Get user data
        connectionPool.query(
            "SELECT * FROM " + tableName + ".users WHERE id = ?", 
            [req.user.id],
            async (err, rows) => {
                if (err || rows.length === 0) {
                    return res.redirect('/upgrade?error=' + encodeURIComponent("Error retrieving user data"));
                }
                
                const user = rows[0];
                
                // If user already has unlimited access or is paid, redirect
                if (user.unlimited_access === 1 || user.is_paid === 1) {
                    return res.redirect('/upgrade?success=' + encodeURIComponent("You already have an active subscription"));
                }
                
                try {
                    // Create or get Stripe customer
                    let customerId = user.stripe_customer_id;
                    
                    if (!customerId) {
                        // Create new customer
                        const stripeResult = await stripeService.processNewUserRegistration(
                            user.id, 
                            user.email, 
                            user.referredBy
                        );
                        
                        customerId = stripeResult.stripeCustomerId;
                    }
                    
                    // Create checkout session
                    const trialDays = user.trial_days || 15;
                    const checkoutSession = await stripeService.createCheckoutSession(
                        customerId,
                        user.id,
                        trialDays
                    );
                    
                    // Redirect to Stripe checkout
                    return res.redirect(checkoutSession.url);
                } catch (stripeErr) {
                    console.error("Error creating checkout session:", stripeErr);
                    return res.redirect('/upgrade?error=' + encodeURIComponent("Error creating checkout session"));
                }
            }
        );
    } catch (err) {
        console.error("Error in create-checkout-session route:", err);
        return res.redirect('/upgrade?error=' + encodeURIComponent("An unexpected error occurred"));
    }
});
app.get(prefix + "/settings", checkAuthenticated, (req, res) => {
    // Get full user data from database
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE id = ?", 
        [req.user.id],
        async (err, rows) => {
            if (err || rows.length === 0) {
                return res.render('settings.html', { user: req.user });
            }
            
            const user = rows[0];
            
            return res.render('settings.html', { 
                user: req.user,
                userData: user,
                hasStripeAccount: !!user.stripe_customer_id,
                hasSubscription: !!user.stripe_subscription_id,
                unlimitedAccess: user.unlimited_access,
                trialEndDate: user.trial_end_date ? new Date(user.trial_end_date).toLocaleDateString() : null,
                isPaid: user.is_paid
            });
        }
    );
});

app.get(prefix + "/paypal", checkAuthenticated, (req, res) => {
    reportService.createSubscription(req, res);
});
app.get(prefix + "/paypalcheck", checkAuthenticated, (req, res) => {
    reportService.checkSubscriptionAndUpgradeUser(req, res);
});

app.get(prefix + "/main", checkAuthenticated, (req, res) => {
    // Get full user data from database
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE id = ?", 
        [req.user.id],
        async (err, rows) => {
            if (err || rows.length === 0) {
                return res.render('index.html', { user: req.user });
            }
            
            const user = rows[0];
            
            try {
                // Check if user needs trial warning
                const warningInfo = await stripeService.checkTrialWarning(user);
                
                // Pass warning info to template
                return res.render('index.html', { 
                    user: req.user,
                    showTrialWarning: warningInfo.showWarning,
                    trialDaysRemaining: warningInfo.daysRemaining
                });
            } catch (err) {
                console.error("Error checking trial warning:", err);
                return res.render('index.html', { user: req.user });
            }
        }
    );
});
app.get(prefix + '/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/views', 'login.html'));
});
app.post(prefix + "/login", passport.authenticate('local', {
    successRedirect: prefix + "/main",
    failureRedirect: prefix + "/login",
}));
app.post(
    prefix + '/loginapi',
    async (req, res, next) => {
        passport.authenticate(
            'local',
            async (err, user, info) => {
                try {
                    if (err || !user) {
                        const error = new Error('An error occurred.');

                        return next(error);
                    }

                    req.login(
                        user,
                        {session: false},
                        async (error) => {
                            if (error) return next(error);
                            console.log("Did app login")
                            console.log(user)
                            const body = {_id: user.id, email: user.name};
                            const token = jwt.sign({user: body}, Secret, {expiresIn: '30 days'});

                            return res.json({token});
                        }
                    );
                } catch (error) {
                    return next(error);
                }
            }
        )(req, res, next);
    }
);


app.get(prefix + '/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log("There was an error logging out")
            return res.status(500).json({success: false, message: "Error logging out"})
        }
        console.log("Logged out")


        res.redirect(prefix + "/login")
    })
});

// Forgot password routes
app.get(prefix + '/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname + '/views', 'forgot_password.html'));
});

app.post(prefix + '/forgot-password', (req, res) => {
    passwordService.requestPasswordReset(req, res);
});

app.get(prefix + '/reset-password', (req, res) => {
    const { email, token } = req.query;
    
    if (!email || !token) {
        return res.redirect('/forgot-password');
    }
    
    // Check if token is valid
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE email = ? AND password_reset_token = ? AND password_reset_expires > UTC_TIMESTAMP()",
        [email, token],
        (err, rows) => {
            if (err || rows.length === 0) {
                console.log("Reset password validation failed. Error:", err, "Rows:", rows?.length);
                return res.redirect('/forgot-password?error=' + encodeURIComponent("Invalid or expired reset link. Please request a new one."));
            }
            
            // Token is valid, send the reset password page
            return res.sendFile(path.join(__dirname + '/views', 'reset_password.html'));
        }
    );
});

app.get(prefix + '/change-password-required', checkAuthenticated, (req, res) => {
    // Only show this page if user has a temp password
    if (!req.user.temp_password) {
        return res.redirect(prefix + '/main');
    }
    res.render('change_password_required.html', { user: req.user });
});

app.post(prefix + '/reset-password', (req, res) => {
    passwordService.processResetPassword(req, res);
});

// Stripe payment success and cancel routes
app.get(prefix + '/payment-success', async (req, res) => {
    const sessionId = req.query.session_id;
    
    if (!sessionId) {
        return res.redirect(prefix + "/main");
    }
    
    try {
        // Process checkout success
        await stripeService.processCheckoutSuccess(sessionId);
        
        // Redirect to main page
        return res.redirect(prefix + "/main");
    } catch (err) {
        console.error("Error processing payment success:", err);
        return res.redirect(prefix + "/main");
    }
});

app.get(prefix + '/payment-cancel', (req, res) => {
    // Just redirect to main page
    return res.redirect(prefix + "/main");
});

// Stripe customer portal
app.get(prefix + '/billing-portal', checkAuthenticated, async (req, res) => {
    // Get user from database
    connectionPool.query(
        "SELECT * FROM " + tableName + ".users WHERE id = ?", 
        [req.user.id],
        async (err, rows) => {
            if (err || rows.length === 0) {
                return res.redirect(prefix + "/settings");
            }
            
            const user = rows[0];
            
            // If user doesn't have a Stripe customer ID, redirect to settings
            if (!user.stripe_customer_id) {
                return res.redirect(prefix + "/settings");
            }
            
            try {
                // Create customer portal session
                const session = await stripeService.createCustomerPortalSession(user.stripe_customer_id);
                
                // Redirect to portal
                return res.redirect(session.url);
            } catch (err) {
                console.error("Error creating customer portal session:", err);
                return res.redirect(prefix + "/settings");
            }
        }
    );
});

// Stripe webhook endpoint
app.post(prefix + '/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        // Verify webhook signature
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        // Handle the event
        await stripeService.handleWebhookEvent(event);
        res.json({received: true});
    } catch (err) {
        console.error(`Error handling webhook event: ${err.message}`);
        res.status(500).send(`Server Error: ${err.message}`);
    }
});

app.post(prefix + '/register', (req, res) => {
    console.log("Registering")
    console.log(req.body)
    console.log(req.body.username)
    console.log(req.body.password)
    console.log(req.body.confirmPassword)
    console.log(req.body.referralCode)

    // Validate password format (one number, one special character, at least 9 characters long)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[a-zA-Z]).{9,}$/;
    if (!passwordRegex.test(req.body.password)) {
        console.log("Password doesn't meet requirements");
        return res.redirect(prefix + '/login?registerError=' + encodeURIComponent("Password must contain at least one number, one special character, and be at least 9 characters long"));
    }

    if (req.body.password !== req.body.confirmPassword) {
        console.log("Passwords don't match");
        return res.redirect(prefix + '/login?registerError=' + encodeURIComponent("Passwords don't match"));
    }

    connectionPool.query("SELECT * FROM gmrgfeoc_simplereports.users WHERE email = ?", [req.body.username], (err, rows) => {
        console.log("Checking if user exists")
        if (err) {
            console.log("There was an error - the sql connection itself isn't passing")
            return res.status(500).json({success: false, error: err})
        }
        if (rows.length !== 0) {
            console.log("User already exists")
            return res.redirect(prefix + '/login?registerError=' + encodeURIComponent("Email address already exists. Please use a different email."))
        }

        let hashedPassword = bcrypt.hashSync(req.body.password, 15)
        console.log("Hashed password")
        console.log(hashedPassword)


        let referralCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        connectionPool.query("INSERT INTO gmrgfeoc_simplereports.users (email, password, referredBy, referralCode) VALUES (?, ?, ?, ?)", [req.body.username, hashedPassword, req.body.referralCode, referralCode], async (err, result) => {
            if (err) {
                console.log("There was an error with sql")
                return res.status(500).json({error: err})
            }
            console.log("User registered");
            
            try {
                // Get the new user ID
                const userId = result.insertId;
                
                // Process user registration with Stripe (create customer, handle referral code)
                const stripeResult = await stripeService.processNewUserRegistration(
                    userId, 
                    req.body.username, 
                    req.body.referralCode
                );
                
                // Log the user in
                req.login({ id: userId }, (loginErr) => {
                    if (loginErr) {
                        console.log("Error logging in after registration:", loginErr);
                        return res.redirect(prefix + "/login");
                    }
                    
                    // Redirect to EULA page
                    return res.redirect(prefix + "/eula?userId=" + userId + "&needsPayment=" + 
                        (stripeResult.needsPaymentMethod ? "true" : "false") + 
                        "&stripeCustomerId=" + (stripeResult.stripeCustomerId || "") + 
                        "&trialDays=" + (stripeResult.trialDays || ""));
                });
            } catch (stripeErr) {
                console.error("Error processing Stripe registration:", stripeErr);
                // If Stripe fails, still consider registration successful but redirect to login
                return res.redirect(prefix + "/login");
            }
        });
    });
});

app.get(prefix + '/report/:guid', checkAuthenticated, (req, res) => {
    res.render('reportdetails.html', {reportUuid: req.params.guid, user: req.user})
});

const s3Service = require('./services/s3.service.js');

const uploadLogos = multer({
    storage: multer.memoryStorage(), // Store in memory instead of disk
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

app.post(prefix + '/app/uploadLogo', uploadLogos.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({success: false, message: "No file uploaded"});
        }

        if (!req.file.mimetype.startsWith("image")) {
            return res.status(400).json({success: false, message: "Only image files are allowed!"});
        }

        // Upload to S3
        const s3Url = await s3Service.uploadLogo(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        res.status(200).json({success: true, filename: s3Url});
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({success: false, message: "Error uploading file to S3"});
    }
});

app.use(prefix + '/user-uploaded', express.static('public/user-uploaded'));


app.get(prefix, (req, res) => {
    res.redirect(prefix + "/main")
})



app.get(prefix + '/admin', checkAuthenticated, (req, res) => {
    if (req.user.admin !== true) {
        return res.status(403).json({success: false, message: "Forbidden"})
    }

    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    res.render('admin_dashboard.html', {user: req.user, page: page});
});
app.get(prefix + '/admin/users', checkAuthenticated, (req, res) => {
    reportService.adminGetAllUsers(req, res);
});
app.post(prefix + '/admin/saveNotes', checkAuthenticated, (req, res) => {
    reportService.adminSaveNotes(req, res);
});


// Export both app and initPromise
app.initPromise = module.exports.initPromise;
module.exports = app;