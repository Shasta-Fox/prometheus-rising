'use strict';
const template = "To: shastaandziggy@gmail.com\nSubject: Prometheus Circle Prescreening Request\n\nHello Shasta,\n\nI would like to request prescreening for the Prometheus drop-in peer circles. Please send the intake information and access guidelines.";
document.getElementById('copy-template').addEventListener('click', async function () {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(template);
    status.textContent = 'Template copied to clipboard.';
    document.getElementById('copy-fallback').hidden = true;
  } catch {
    const field = document.getElementById('template-text');
    document.getElementById('copy-fallback').hidden = false;
    field.value = template; field.focus(); field.select();
    status.textContent = 'Automatic copying is unavailable. Select and copy the template below.';
  }
});
