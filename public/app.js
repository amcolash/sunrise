let ENDPOINT;

const toggle = document.getElementById('toggle');
const time = document.getElementById('time');
const duration = document.getElementById('duration');
const checkboxes = document.querySelectorAll('input[type=checkbox]');

let settings;

window.onload = function() {
  ENDPOINT = window.location.protocol + '//' + window.location.hostname + ':8001';

  updateSettings();

  toggle.onclick = () => axios.post(`${ENDPOINT}/lights_off`);
  time.onchange = () => sendSettings();
  duration.onchange = () => sendSettings();
  checkboxes.forEach(c => (c.onchange = () => sendSettings()));
};

function updateUI() {
  time.value = settings.time;

  // Clamp duration to acceptable value
  duration.value = Math.max(settings.duration / 60 / 1000, 5);

  checkboxes.forEach((c, i) => {
    c.checked = settings.days[i];
  });
}

function getSettings() {
  const days = [];
  checkboxes.forEach((c, i) => {
    days[i] = c.checked;
  });

  return {
    ...settings,
    time: time.value,
    duration: Number.parseInt(duration.value) * 60 * 1000,
    days,
  };
}

function updateSettings() {
  axios
    .get(`${ENDPOINT}/settings`)
    .then(res => {
      settings = res.data;
      updateUI();
    })
    .catch(() => {
      setTimeout(updateSettings, 3000);
    });
}

function sendSettings() {
  axios.post(`${ENDPOINT}/settings`, getSettings());
}

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}
