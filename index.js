const express = require('express');

// Env vars!
require('dotenv').config();

const { turnOn, turnOff, getStatus } = require('./light');
const { settings } = require('./settings');

const app = express();
app.use('/', express.static('public'));
app.use(express.json());

const port = 3000;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.post('/lights_on', (req, res) => {
  console.log('Lights On');
  turnOn();
  res.sendStatus(200);
});

app.post('/lights_off', (req, res) => {
  console.log('Lights Off');
  turnOff();
  res.sendStatus(200);
});

app.get('/status', (req, res) => {
  getStatus().then(status => res.send(status));
});
