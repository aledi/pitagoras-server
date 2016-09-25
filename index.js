'use strict';

var express = require('express');
var app = express();
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var path = require('path');
var port = process.env.PORT || 1337;

app.use('/pitagoras', new ParseServer({
    databaseURI: process.env.MONGODB_URI,
    cloud: path.join(__dirname, '/cloud/main.js'),
    appId: process.env.APP_ID,
    appName: process.env.APP_NAME,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL,
    publicServerURL: process.env.SERVER_URL
}));

var apps = [{
    serverURL: process.env.SERVER_URL,
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    appName: process.env.APP_NAME
}];

// Mount dashboard
app.use('/dashboard', new ParseDashboard({
    apps: apps,
    users: [{user: 'admin', pass: process.env.DASHBOARD_PASS}]
}));

// Redirect route to dashboard
app.use('/', function (req, res) {
    res.redirect('/dashboard');
});

app.listen(port, function () {
    console.log('pitagoras-server running on port ' + port + '.');
});
