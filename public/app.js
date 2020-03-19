let ENDPOINT;

const toggle = document.getElementById('toggle');

window.onload = function() {
  ENDPOINT = window.location.protocol + '//' + window.location.hostname + ':8001';

  toggle.onclick = () => {
    axios.post(`${ENDPOINT}/lights_off`);
  };
};

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}
