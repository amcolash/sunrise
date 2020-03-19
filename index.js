const cors = require('cors');
const { CronJob } = require('cron');
const express = require('express');

// Env vars!
require('dotenv').config();

const { turnOn, turnOff, getStatus, isConnected } = require('./light');
const { getCronTime, settings } = require('./settings');

const app = express();
app.use('/', express.static('public'));
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8001;
app.listen(port, () => console.log(`Server listening on port ${port}`));

const job = new CronJob(getCronTime(), turnOn, null, true, 'America/Los_Angeles');

// Middleware to intercept all requests and deny if not connected to device
app.use((req, res, next) => {
  if (!isConnected()) {
    res.status(403);
    res.send('No connection to device!');
    return;
  }

  next();
});

app.post('/lights_on', (req, res) => {
  turnOn();
  res.sendStatus(200);
});

app.post('/lights_off', (req, res) => {
  turnOff();
  res.sendStatus(200);
});

app.get('/status', (req, res) => {
  getStatus().then(status => res.send(status));
});

app.get('/settings', (req, res) => {
  res.send(settings.JSON());
});

app.post('/settings', (req, res) => {
  settings.JSON(req.body);
  settings.sync();
  res.sendStatus(200);
});
