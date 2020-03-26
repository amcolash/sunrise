const BezierEasing = require('bezier-easing');
const TuyAPI = require('tuyapi');
const { settings } = require('./settings');

// Mapping of dps values to human readable, check out for more info: https://github.com/codetheweb/homebridge-tuya/issues/16
const DPS = {
  Toggle: '1',
  Brightness: '3',
  Temperature: '4',
};

const state = {
  time: -1,
  last: -1,
  on: undefined,
};

const device = new TuyAPI({
  id: process.env.BULB_ID,
  key: process.env.BULB_KEY,
});

let lightOnTimeout;

// Singular global connection
connect();

// Add event listeners
device.on('connected', () => {
  console.log('Connected to device');

  // Turn things off after connecting
  if (state.on === undefined)
    setTimeout(() => {
      if (device.isConnected()) turnOff();
    }, 3000);
});

device.on('disconnected', () => {
  console.log('Disconnected from device.\nRetrying connection...');

  // Retry connection when failed
  setTimeout(connect, 3000);
});

device.on('error', error => {
  console.log('Error!', error);
});

function connect() {
  // Find device on network
  device
    .find()
    .then(() => {
      // Connect to device
      device.connect();
    })
    .catch(err => {
      console.error(err);

      // Retry connection if it fails
      setTimeout(connect, 3000);
    });
}

function turnOn(duration) {
  console.log('Turn On');

  if (!isConnected()) {
    console.error('Error: not connected');
    return;
  }

  state.on = true;

  // Clear things if currently turning on
  clearTimeout(lightOnTimeout);

  // Promise here since promises not working with set :(
  return new Promise((resolve, reject) => {
    // Set light to be on, 0% brightness, warm as possible. Promises do not seem to be working here :(
    device.set({ multiple: true, data: { [DPS.Toggle]: true, [DPS.Brightness]: 0, [DPS.Temperature]: 0 } });

    // Set up light fading state
    resetState();

    // Start fade in update loop
    update(duration || settings.get('duration'), resolve);
  });
}

function turnOff() {
  console.log('Turn Off');

  if (!isConnected()) {
    console.error('Error: not connected');
    return;
  }

  state.on = false;

  // Clear things if currently turning on
  clearTimeout(lightOnTimeout);

  // Turn off light
  device.set({ multiple: true, data: { [DPS.Toggle]: false, [DPS.Brightness]: 0 } });
}

function toggle() {
  if (state.on) {
    turnOff();
  } else {
    turnOn(settings.get('interval') * 2);
  }

  return state.on;
}

function getStatus() {
  return device.get({ schema: true });
}

function isConnected() {
  return device.isConnected();
}

function resetState() {
  // First cycle = 0
  state.time = -settings.get('interval');
  state.last = -1;
}

// https://cubic-bezier.com/
const easing = BezierEasing(0.63, 0.1, 0.19, 0.31);

function update(duration, resolve) {
  lightOnTimeout = setTimeout(() => {
    state.time += settings.get('interval');

    if (state.time <= duration) {
      // Normalize time from 0-1
      const norm = state.time / duration;
      const value = Math.floor(easing(norm) * settings.get('max'));

      if (state.last !== value) {
        device.set({ dps: [DPS.Brightness], set: value });
        state.last = value;
        console.log(value, state.time);
      }

      update(duration, resolve);
    } else {
      resolve();
    }
  }, settings.get('interval'));
}

module.exports = {
  toggle,
  turnOn,
  turnOff,
  getStatus,
  isConnected,
};
