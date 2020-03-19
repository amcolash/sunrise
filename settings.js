const JSONdb = require('simple-json-db');
const settings = new JSONdb('./data.json');

function initSettings() {
  if (!settings.has('interval')) settings.set('interval', 1000);
  if (!settings.has('duration')) settings.set('duration', 30 * 60 * 1000);
  if (!settings.has('max')) settings.set('max', 255);
}

initSettings();

module.exports = {
  settings,
};
