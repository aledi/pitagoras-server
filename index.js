var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var api = new ParseServer({
  databaseURI: process.env.MONGODB_URI,
  cloud: path.join(__dirname, '/cloud/main.js'),
  appId: process.env.APP_ID,
  appName: process.env.APP_NAME,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL
});

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/pitagoras';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Pitagoras Parse Server');
});

var port = process.env.PORT || 1337;

app.listen(port, function() {
    console.log('pitagoras-server running on port ' + port + '.');
});
