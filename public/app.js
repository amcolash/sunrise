let ENDPOINT;

const toggle = document.getElementById('toggle');
const time = document.getElementById('time');
const duration = document.getElementById('duration');
const checkboxes = document.querySelectorAll('input[type=checkbox]');

window.onload = function() {
  ENDPOINT = window.location.protocol + '//' + window.location.hostname + ':8001';

  axios.get(`${ENDPOINT}/settings`).then(res => {
    updateUI(res.data);
  });

  toggle.onclick = () => {
    axios.post(`${ENDPOINT}/lights_off`);
  };
};

function updateUI(settings) {
  time.value = settings.time;

  // Clamp duration to acceptable value
  duration.value = Math.max(settings.duration / 1000 / 60, 5);

  checkboxes.forEach((c, i) => {
    c.checked = settings.days[i];
  });
}

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}
