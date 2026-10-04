'use strict';
const template = "To: prometheusrisingprotocol@gmail.com\nSubject: Prometheus Protocol Inquiry & Support Request\n\nHello Prometheus Team,\n\nI am contacting you regarding [Prescreening & Discord Access / Curriculum Question / Community Support]:\n\n";
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
