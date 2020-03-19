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
  busy: false,
};

const device = new TuyAPI({
  id: process.env.BULB_ID,
  key: process.env.BULB_KEY,
});

// Add event listeners
device.on('connected', () => {
  console.log('Connected to device');
});

device.on('disconnected', () => {
  console.log('Disconnected from device.');
});

device.on('error', error => {
  console.log('Error!', error);
});

function turnOn() {
  state.busy = true;

  // Promise here since promises not working with set :(
  return new Promise((resolve, reject) => {
    // Find device on network
    device.find().then(() => {
      // Connect to device
      device.connect().then(() => {
        // Set light to be on, 0% brightness, warm as possible. Promises do not seem to be working here :(
        device.set({ multiple: true, data: { [DPS.Toggle]: true, [DPS.Brightness]: 0, [DPS.Temperature]: 0 } });

        // Set up light fading state
        reset();

        // Start fade in update loop
        update(resolve);
      });
    });
  });
}

function turnOff() {
  state.busy = true;

  // Find device on network
  device.find().then(() => {
    // Connect to device
    device.connect().then(() => {
      // Turn off light
      device.set({ dps: [DPS.Brightness], set: 0 });

      // Wait a moment, then disconnect
      setTimeout(() => {
        device.disconnect();
        state.busy = false;
      }, 2000);
    });
  });
}

function reset() {
  // First cycle = 0
  state.time = -settings.get('interval');
  state.last = -1;
}

// https://cubic-bezier.com/
const easing = BezierEasing(0.63, 0.1, 0.19, 0.31);

function update(resolve) {
  setTimeout(() => {
    state.time += settings.get('interval');

    if (state.time <= settings.get('duration')) {
      // Normalize time from 0-1
      const norm = state.time / settings.get('duration');
      const value = Math.floor(easing(norm) * settings.get('max'));

      if (state.last !== value) {
        device.set({ dps: [DPS.Brightness], set: value });
        state.last = value;
        console.log(value);
      }

      update(resolve);
    } else {
      device.disconnect();
      state.busy = false;
      setTimeout(() => resolve(), 2000);
    }
  }, settings.get('interval'));
}

function getState() {
  return state;
}

module.exports = {
  turnOn,
  turnOff,
  getState,
};
