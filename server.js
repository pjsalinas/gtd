'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const slack_router = require('./routes/slack');

const app = express();

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html

// ============= Handle www Request ==============
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// ============= Handle Workflow Request ==============


// ============= Handle Slack Requests ==============
app.use(slack_router);



// listen for requests :)
process.env.PORT = 3000;
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
