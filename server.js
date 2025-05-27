const app = require('./index');

// Wait for initialization before starting server
app.initPromise.then(() => {
    app.listen(process.env.SERVER_PORT || 3000, (err) => {
        if (err) throw err
        console.log(`Server is running on http://127.0.0.1:3000`)
    })
}).catch(err => {
    console.error('Failed to initialize app:', err);
    process.exit(1);
});

