const JSONdb = require('simple-json-db');
const settings = new JSONdb('./data.json');

function initSettings() {
  if (!settings.has('interval')) settings.set('interval', 1000);
  if (!settings.has('duration')) settings.set('duration', 30 * 60 * 1000);
  if (!settings.has('max')) settings.set('max', 255);
  if (!settings.has('time')) settings.set('time', '08:30');

  // S, M, T, W, T, F, S
  if (!settings.has('days')) settings.set('days', [false, true, true, true, true, true, false]);
}

initSettings();

function getCronTimeInternal() {
  let days = '';
  settings.get('days').forEach((d, i) => {
    if (d) {
      if (days.length > 0) days += ',';
      days += i;
    }
  });

  const splitTime = settings.get('time').split(':');
  const hour = splitTime[0] || 8;
  const minute = splitTime[1] || 30;

  if (splitTime.length < 2) {
    console.error('Broken time, using defaults', splitTime, settings.get('time'));
  }

  return { hour, minute, days };
}

function getCronTimeOn() {
  const { hour, minute, days } = getCronTimeInternal();

  const cron = `0 ${minute} ${hour} * * ${days}`;
  // console.log('CronTime', cron);
  return cron;
}

// This is not very reliable in a lot of scenarios, making lots of assumptions like not wrapping days, dst, etc
function getCronTimeOff() {
  const { hour, minute, days } = getCronTimeInternal();

  // Turn off 15 minutes after max brightness
  const delay = 15;
  const offset = settings.get('duration') / 60000 + delay;

  // Find seconds of different values so that we can do time-based math
  const secondsTime = hour * 3600 + minute * 60;
  const secondsOffset = offset * 60;
  const finalSeconds = secondsTime + secondsOffset;

  // Figure out the actual hours/minutes for cron
  const finalHour = Math.floor(finalSeconds / 3600);
  const finalMinute = (finalSeconds - 3600 * finalHour) / 60;

  const cron = `0 ${finalMinute} ${finalHour} * * ${days}`;
  // console.log('CronTime', cron, secondsTime, secondsOffset, finalSeconds, finalHour, finalMinute, hour, minute);
  return cron;
}

module.exports = {
  getCronTimeOn,
  getCronTimeOff,
  settings,
};
