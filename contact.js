'use strict';
document.getElementById('prescreen-form')?.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!this.reportValidity()) return;
  var name = document.getElementById('user-name').value.trim();
  var email = document.getElementById('user-email').value.trim();
  var intent = document.getElementById('user-intent').value.trim();
  if (!name || !intent) { document.getElementById('contact-status').textContent = 'Please add your preferred name and a short introduction.'; return; }
  var subject = encodeURIComponent('Prometheus Sanctuary Access Request: ' + name);
  var body = encodeURIComponent('Preferred Name / Handle: ' + name + '\nContact Email: ' + email + '\n\nWhat brings me to Prometheus Rising:\n' + intent + '\n\n[x] I have read and agree to the Circle Agreements and understand peer circles are educational mutual aid.');
  window.location.href = 'mailto:shastaandziggy@gmail.com?subject=' + subject + '&body=' + body;
  document.getElementById('contact-status').textContent = 'Finish sending in your email app. Nothing has been sent by this website.';
});
