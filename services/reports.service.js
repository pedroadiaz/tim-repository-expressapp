const express = require('express')
const path = require('path');
const absPath = path.join(__dirname, './views');

const mysql = require('mysql2');
const url = require('url');
const fetch = require('node-fetch');
const uuidv4 = require('uuid').v4;

const admin = "[user]";
const tableName = "gmrgfeoc_simplereports";
const connectionPool = mysql.createPool({
    host: process.env.DATABASE_ENDPOINT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});

module.exports = {


    getUser: (req, res) => {
        console.log("Getting user details");
        console.log(req.body);
        console.log(req.user);

        connectionPool.query("SELECT * FROM " + tableName + ".users WHERE id = ?", [req.user.id], (err, rows) => {

            if (rows.length == 0) {
                return res.status(404).json({status: "Not found"});
            }
            
            // Format data for client consumption
            const userData = {
                email: rows[0].email,
                accountType: rows[0].accountType,
                lastDeletedReport: rows[0].lastDeletedReport,
                
                // Subscription-related fields
                stripe_customer_id: rows[0].stripe_customer_id,
                stripe_subscription_id: rows[0].stripe_subscription_id,
                trial_end_date: rows[0].trial_end_date,
                trial_days: rows[0].trial_days,
                is_paid: rows[0].is_paid === 1, // Convert to boolean
                unlimited_access: rows[0].unlimited_access === 1, // Convert to boolean
            };

            return res.status(200).json(userData);
        });
    },
    getReportEntriesByUser: (req, res) => {
        console.log("Getting report entries by user");
        connectionPool.query("SELECT * FROM " + tableName + ".report_entry WHERE userId = ? AND deleted = 0", [req.user.id], (err, rows) => {
            return res.status(200).json({data: rows});
        });
    },
    addReportEntry: (req, res) => {
        console.log("TODO: RATE LIMITING AND CREATION LIMITS");
        console.log("Adding report entry");
        console.log(req.body);
        uuid = uuidv4();

        connectionPool.query("INSERT INTO `" + tableName + "`.`report_entry` (`id`, `uuid`, `userId`, `title`, `cachedTitle`, `createdOn`) VALUES (NULL, ?, ?, ?, ?, CURRENT_TIMESTAMP);", [uuid, req.user.id, req.body.title, req.body.cachedTitle], (err, rows) => {
            if (err) {
                return res.status(500).json({status: err});
            }

            let ownerInsertedRowId = rows.insertId;

            connectionPool.query("INSERT INTO `" + tableName + "`.`report` (`id`, `ownerId`) VALUES (NULL, ?);", [ownerInsertedRowId], (err, rows) => {
                if (err) {
                    return res.status(500).json({status: err});
                }

                return res.status(200).json({uuid: uuid, cachedTitle: req.body.cachedTitle});
            });
        });
    },
    getReport: (req, res) => {
        console.log("Getting report");
        console.log(req.body);
        console.log(req.user);
        console.log(req.params);

        connectionPool.query("SELECT * FROM " + tableName + ".report_entry WHERE uuid = ?", [req.body.uuid], (err, rows) => {
            if (rows.length == 0 || rows[0].deleted == 1) {
                return res.status(404).json({status: "Not found"});
            }

            if (rows[0].userId != req.user.id) {
                return res.status(403).json({status: "Forbidden"});
            }

            let reportId = rows[0].id;
            connectionPool.query("SELECT * FROM " + tableName + ".report WHERE ownerId = ?", [reportId], (err, rows) => {
                if (rows.length == 0) {
                    return res.status(404).json({status: "Not found"});
                }

                return res.status(200).json({rows});
            });
        });
    },
    deleteReportByUuid: (req, res) => {
        console.log("Deleting report by uuid");
        connectionPool.query("SELECT * FROM " + tableName + ".report_entry WHERE uuid = ?", [req.body.uuid], (err, rows) => {
            if (rows.length == 0 || rows[0].deleted == 1) {
                return res.status(404).json({status: "Not found"});
            }

            if (rows[0].userId != req.user.id) {
                return res.status(403).json({status: "Forbidden"});
            }



            connectionPool.query("UPDATE " + tableName + ".report_entry SET deleted = 1 WHERE uuid = ?", [req.body.uuid], (err, rows) => {
                if (err) {
                    return res.status(500).json({status: err});
                }


                connectionPool.query("UPDATE " + tableName + ".users SET lastDeletedReport = ? WHERE id = ?", [req.body.uuid, req.user.id], (err, rows) => {
                    if (err) {
                        return res.status(500).json({status: err});
                    }

                    return res.status(200).json({status: "success"});
                });
            });
        });
    },
    restoreDeletionByUsersLastDeleted: (req, res) => {
        console.log("Restoring deletion by users last deleted");
        connectionPool.query("SELECT * FROM " + tableName + ".users WHERE id = ?", [req.user.id], (err, rows) => {
            if (rows.length == 0) {
                return res.status(404).json({status: "not_found"});
            }

            let lastDeletedReport = rows[0].lastDeletedReport;

            if (lastDeletedReport == null || lastDeletedReport == "") {
                return res.status(404).json({status: "no_last_deleted"});
            }

            connectionPool.query("UPDATE " + tableName + ".report_entry SET deleted = 0 WHERE uuid = ?", [lastDeletedReport], (err, rows) => {
                if (err) {
                    return res.status(500).json({status: err});
                }

                connectionPool.query("UPDATE " + tableName + ".users SET lastDeletedReport = NULL WHERE id = ?", [req.user.id], (err, rows) => {
                    if (err) {
                        return res.status(500).json({status: err});
                    }

                    return res.status(200).json({status: "success"});
                });
            });
        });
    },
    createSubscription: (req, res) => {


        connectionPool.query("SELECT * FROM " + tableName + ".users WHERE id = ?", [req.user.id], (err, rows) => {
            if (err) {
                console.log("There was an error - the sql connection itself isn't passing")
                return res.status(500).json({status: err})
            }
            if (rows.length === 0) {
                console.log("No user found");
                return res.status(400).json({message: "No user found with that ID?"})
            }
            console.log(rows[0])

            if (rows[0].accountType !== 0) {
                return res.status(400).json({message: "Account already upgraded"})
            }

            let subscriptionPlanId = 'P-3A574567YJ692630XMZ7RRVI';
            let auth = Buffer.from(global.CONSTANTS.paypal_clientId + ':' + global.CONSTANTS.paypal_secret).toString('base64');

            fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + auth
                },
                body: JSON.stringify({
                    "plan_id": subscriptionPlanId,
                    "application_context": {

                        "return_url": "http://localhost:3000/upgrade?success=true",
                        "cancel_url": "http://localhost:3000/upgrade?success=false&cancel=true",
                        "brand_name": "Simple Reports",
                        "locale": "en-US",
                        "user_action": "SUBSCRIBE_NOW",
                        "payment_method": {
                            "payer_selected": "PAYPAL",
                            "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                        }
                    }
                })
            }).then(response => response.json())
                .then(data => {
                    if (data.status !== "APPROVAL_PENDING") {
                        return res.status(500).json({status: "Error creating subscription"})
                    }

                    connectionPool.query("UPDATE " + tableName + ".users SET subscriptionId = ? WHERE id = ?", [data.id, req.user.id], (err, rows) => {
                        if (err) {
                            console.log("There was an error with sql")
                            console.log(err)
                            return res.status(500).json({status: "Error updating user subscriptionId"})
                        }
                        console.log("User subscriptionId updated")
                    });
                    res.redirect(data.links[0].href)
                });
        });
    },
    checkSubscriptionAndUpgradeUser: (req, res) => {
        connectionPool.query("SELECT * FROM " + tableName + ".users WHERE id = ?", [req.user.id], (err, rows) => {
            if (rows.length == 0) {
                return res.status(404).json({status: "Not found"});
            }

            if (rows[0].accountType != 0) {
                console.log("Already upgraded");
                return res.status(200).json({status: "already_upgraded"});
            }

            let subscriptionId = rows[0].subscriptionId;
            let clientId = global.CONSTANTS.paypal_clientId;
            let secret = global.CONSTANTS.paypal_secret;
            fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions/' + subscriptionId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64')
                }
            }).then(response => response.json())
                .then(data => {
                    console.log(data);

                    if (data.status == "ACTIVE") {
                        let theDate = data.billing_info.next_billing_time;
                        let expireDate = new Date(theDate);
                        expireDate.setDate(expireDate.getDate() + 1);
                        console.log(expireDate);
                        let formattedDate = expireDate.toISOString().slice(0, 19).replace('T', ' ');

                        connectionPool.query("UPDATE " + tableName + ".users SET accountType = 1, accountRenewal = ?, firstName = ?, lastName = ? WHERE id = ?", [formattedDate, data.subscriber.name.given_name, data.subscriber.name.surname, req.user.id], (err, rows) => {
                            if (err) {
                                return res.status(500).json({status: err});
                            }

                            return res.status(200).json({status: "success"});
                        });
                    } else {
                        return res.status(403).json({status: "Forbidden"});
                    }
                });
        });
    },
    adminGetAllUsers: (req, res) => {
        console.log("Verifying admin");
        if (req.user.admin !== true) {
            return res.status(403).json({status: "Forbidden"});
        }

        let pagePerLimit = 10;

        connectionPool.query("SELECT COUNT(*) AS totalUsers FROM " + tableName + ".users", (err, rows) => {
            console.log(rows);
            if (err) {
                return res.status(500).json({status: err});
            }

            let totalUsers = rows[0].totalUsers;
            let totalPages = Math.ceil(totalUsers / pagePerLimit);
            let page = req.query.page ? req.query.page : 1;
            let skip = (page - 1) * pagePerLimit;

            connectionPool.query("SELECT * FROM " + tableName + ".users ORDER BY id DESC LIMIT ? OFFSET ?", [pagePerLimit, skip], (err, rows) => {
                if (err) {
                    return res.status(500).json({status: err});
                }
                console.log("Success");

                return res.status(200).json({rows, totalPages});
            });
        });
    },
    adminSaveNotes: (req, res) => {
        console.log("Saving notes");
        console.log(req.body);
        console.log(req.user);
        console.log(req.params);

        if (req.user.admin !== true) {
            return res.status(403).json({status: "Forbidden"});
        }

        connectionPool.query("UPDATE " + tableName + ".users SET userNote = ? WHERE id = ?", [req.body.notes, req.body.userId], (err, rows) => {
            if (err) {
                return res.status(500).json({status: err});
            }

            return res.status(200).json({success: true});
        });
    },
    getConsentStatus: (req, res) => {
        console.log("Getting consent status for current user");

        connectionPool.query("SELECT disclaimerAgree FROM " + tableName + ".users WHERE id = ?", [req.user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({status: err});
            }

            return res.status(200).json({status: rows[0].disclaimerAgree});
        });
    },
    setConsentStatus: (req, res) => {
        console.log("Setting consent status for current user");

        connectionPool.query("UPDATE " + tableName + ".users SET disclaimerAgree = 1 WHERE id = ?", [req.user.id], (err, rows) => {
            if (err) {
                return res.status(500).json({status: err});
            }

            return res.status(200).json({status: "success"});
        });
    }
}
