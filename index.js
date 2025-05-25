global.CONSTANTS = Object.freeze({
    paypal_clientId: process.env.PAYPAL_CLIENT_ID,
    paypal_secret: process.env.PAYPAL_SECRET
});

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
const admin = "[user]";
const tableName = "gmrgfeoc_simplereports";
const connectionPool = mysql.createPool({
    host: process.env.DATABASE_ENDPOINT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});


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
        if (bcrypt.compareSync(password, rows[0].password)) {
            console.log("Authenticated");


            return done(null, rows[0])
        }

        console.log("Incorrect password");
        return done(null, false, {message: "Incorrect username or password"})
    });

}

checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {return next()}
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


passport.deserializeUser((user, done) => {
    return done(null, user)
})


let count = 1

printData = (req, res, next) => {


    next()
}

app.use(printData)


const reportService = require('./services/reports.service.js');
const reportsService = require('./services/reports.service.js');
const passwordService = require('./services/password.service.js');

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
    reportsService.getUser(req, res);
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
app.get(prefix + '/app/getConsentStatus', checkAuthenticated, (req, res) => {
    reportService.getConsentStatus(req, res);
});
app.post(prefix + '/app/setConsentStatus', checkAuthenticated, (req, res) => {
    reportService.setConsentStatus(req, res);
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
                try {
                    // Create checkout session
                    const checkoutSession = await stripeService.createCheckoutSession(
                        stripeCustomerId,
                        userId,
                        trialDays
                    );
                    
                    // Redirect to Stripe checkout
                    return res.redirect(checkoutSession.url);
                } catch (stripeErr) {
                    console.error("Error creating checkout session:", stripeErr);
                    return res.redirect(prefix + "/main");
                }
            } else {
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
app.get(prefix + "/settings", checkAuthenticated, (req, res) => {
    res.render('settings.html', {user: req.user})
});

app.get(prefix + "/paypal", checkAuthenticated, (req, res) => {
    reportService.createSubscription(req, res);
});
app.get(prefix + "/paypalcheck", checkAuthenticated, (req, res) => {
    reportService.checkSubscriptionAndUpgradeUser(req, res);
});

app.get(prefix + "/main", checkAuthenticated, (req, res) => {



    res.render('index.html', {user: req.user})
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
        "SELECT * FROM " + tableName + ".users WHERE email = ? AND password_reset_token = ? AND password_reset_expires > NOW()",
        [email, token],
        (err, rows) => {
            if (err || rows.length === 0) {
                return res.redirect('/forgot-password?error=' + encodeURIComponent("Invalid or expired reset link. Please request a new one."));
            }
            
            // Token is valid, send the reset password page
            return res.sendFile(path.join(__dirname + '/views', 'reset_password.html'));
        }
    );
});

app.post(prefix + '/reset-password', (req, res) => {
    passwordService.processResetPassword(req, res);
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

const uploadLogos = multer({dest: './public/user-uploaded/logos/'});
app.post(prefix + '/app/uploadLogo', uploadLogos.single('logo'), (req, res) => {


    if (!req.file.mimetype.startsWith("image")) {
        return res.status(400).json({success: false, message: "Only image files are allowed!"})
    }


    const ext = path.extname(req.file.originalname);
    const newFilenamePath = req.file.path + ext;
    const newPublicFilenamePath = "/user-uploaded/logos/" + req.file.filename + ext;
    console.log(newFilenamePath);
    fs.rename(req.file.path, newFilenamePath, (err) => {
        if (err) {
            console.log(err)
            return res.status(500).json({success: false, message: "Error saving file"})
        }
        res.status(200).json({success: true, filename: newPublicFilenamePath})
    });
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


module.exports = app;