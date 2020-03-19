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
});

device.on('disconnected', () => {
  console.log('Disconnected from device.\nRetrying connection...');

  // Retry connection when failed
  setTimeout(() => connect(), 3000);
});

device.on('error', error => {
  console.log('Error!', error);
});

function connect() {
  // Find device on network
  device.find().then(() => {
    // Connect to device
    device.connect();
  });
}

function turnOn() {
  console.log('Turn On');

  if (!isConnected()) {
    console.error('Error: not connected');
    return;
  }

  // Clear things if currently turning on
  clearTimeout(lightOnTimeout);

  // Promise here since promises not working with set :(
  return new Promise((resolve, reject) => {
    // Set light to be on, 0% brightness, warm as possible. Promises do not seem to be working here :(
    device.set({ multiple: true, data: { [DPS.Toggle]: true, [DPS.Brightness]: 0, [DPS.Temperature]: 0 } });

    // Set up light fading state
    resetState();

    // Start fade in update loop
    update(resolve);
  });
}

function turnOff() {
  console.log('Turn Off');

  if (!isConnected()) {
    console.error('Error: not connected');
    return;
  }

  // Clear things if currently turning on
  clearTimeout(lightOnTimeout);

  // Turn off light
  device.set({ multiple: true, data: { [DPS.Toggle]: false, [DPS.Brightness]: 0 } });
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

function update(resolve) {
  lightOnTimeout = setTimeout(() => {
    state.time += settings.get('interval');

    if (state.time <= settings.get('duration')) {
      // Normalize time from 0-1
      const norm = state.time / settings.get('duration');
      const value = Math.floor(easing(norm) * settings.get('max'));

      if (state.last !== value) {
        device.set({ dps: [DPS.Brightness], set: value });
        state.last = value;
        console.log(value, state.time);
      }

      update(resolve);
    } else {
      resolve();
    }
  }, settings.get('interval'));
}

module.exports = {
  turnOn,
  turnOff,
  getStatus,
  isConnected,
};
