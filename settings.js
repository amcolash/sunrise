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

function getCronTime() {
  let days = '';
  settings.get('days').forEach((d, i) => {
    if (d) {
      if (days.length > 0) days += ',';
      days += i;
    }
  });

  const splitTime = settings.get('time').split(':');
  const hour = splitTime[0];
  const min = splitTime[1];

  const cron = `0 ${min} ${hour} * * ${days}`;
  // console.log('CronTime', cron);
  return cron;
}

module.exports = {
  getCronTime,
  settings,
};
