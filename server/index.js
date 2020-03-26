const cors = require('cors');
const { CronJob, CronTime } = require('cron');
const express = require('express');
const path = require('path');

const root = path.join(__dirname, '../');

// Env vars!
require('dotenv').config({ path: path.join(root, '.env') });

const { toggle, turnOn, turnOff, getStatus, isConnected } = require('./light');
const { getCronTime, settings } = require('./settings');

const app = express();
app.use('/', express.static(path.join(root, 'public')));
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8001;
app.listen(port, () => console.log(`${new Date().toLocaleString()}: Server listening on port ${port}`));

// Setup main cron job that is generated based off of settings
const scheduledOn = new CronJob(getCronTime(), turnOn, null, true, 'America/Los_Angeles');

// Turn off lights daily at 10:30 am
const scheduledOff = new CronJob('* 30 10 * * *', turnOff, null, true, 'America/Los_Angeles');

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

app.post('/toggle', (req, res) => {
  res.send(toggle());
});

app.get('/status', (req, res) => {
  getStatus().then(status => res.send(status));
});

app.get('/settings', (req, res) => {
  res.send(settings.JSON());
});

app.post('/settings', (req, res) => {
  // Update and save new settings
  settings.JSON(req.body);
  settings.sync();

  // Update cron job time and restart it
  scheduledOn.setTime(new CronTime(getCronTime()));
  scheduledOn.start();

  // Cancel anything that may have been running
  turnOff();

  res.sendStatus(200);
});
