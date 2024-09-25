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

const admin = "[user]";
const tableName = "table_simplereports";
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
app.get(prefix + "/upgrade", checkAuthenticated, (req, res) => {
    res.render('upgrade.html', {user: req.user})
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

app.post(prefix + '/register', (req, res) => {
    console.log("Registering")
    console.log(req.body)
    console.log(req.body.username)
    console.log(req.body.password)
    console.log(req.body.confirmPassword)
    console.log(req.body.referralCode)

    if (req.body.password !== req.body.confirmPassword) {
        console.log("Passwords don't match")
        return res.status(400).json({success: false, message: "Passwords don't match"})
    }

    connectionPool.query("SELECT * FROM gmrgfeoc_simplereports.users WHERE email = ?", [req.body.username], (err, rows) => {
        console.log("Checking if user exists")
        if (err) {
            console.log("There was an error - the sql connection itself isn't passing")
            return res.status(500).json({success: false, error: err})
        }
        if (rows.length !== 0) {
            console.log("User already exists")
            return res.status(400).json({success: false, message: "User already exists"})
        }

        let hashedPassword = bcrypt.hashSync(req.body.password, 15)
        console.log("Hashed password")
        console.log(hashedPassword)


        let referralCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        connectionPool.query("INSERT INTO gmrgfeoc_simplereports.users (email, password, referredBy, referralCode) VALUES (?, ?, ?, ?)", [req.body.username, hashedPassword, req.body.referralCode, referralCode], (err, rows) => {
            if (err) {
                console.log("There was an error with sql")
                return res.status(500).json({error: err})
            }
            console.log("User registered")



            res.redirect(prefix + "/login")
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