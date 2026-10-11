'use strict';
/* Prometheus Rising — Course page: path planner, seat request, and filters.
   The page works without this script: the paths, map, tuition table, ledger, and readings are plain HTML. */
(function () {
  var EMAIL = 'prometheusrisingprotocol@gmail.com';
  var PAYPAL = 'https://paypal.me/ShastaLFox';  /* PayPal.me link for tuition: the one place to change it */

  var GROUPS = [
    { id: 'F', label: 'Foundations', title: 'Foundations', weeks: [1, 2, 3], free: true },
    { id: 'M1', label: 'Module 1', title: 'The Pharmacology of Lived Experience', weeks: [4, 5] },
    { id: 'M2', label: 'Module 2', title: 'Dismantling the Single Story', weeks: [6, 7] },
    { id: 'M3', label: 'Module 3', title: 'Congenital Disability & Lifelong Pain', weeks: [8, 9] },
    { id: 'M4', label: 'Module 4', title: 'Peer Mentorship & Communitas', weeks: [10, 11] },
    { id: 'M5', label: 'Module 5', title: 'Trauma, Culture & Cumulative Harm', weeks: [12, 13] },
    { id: 'M6', label: 'Module 6', title: 'Community Accountability & Repair', weeks: [14] },
    { id: 'M7', label: 'Module 7', title: 'Ethics, Scope & Reflexive Practice', weeks: [15] }
  ];
  var F_TITLES = { 1: 'F1, What Harm Reduction Is', 2: 'F2, Reading the Evidence', 3: 'F3, First Response and First Conversation' };

  var SEATS = [
    { id: 'scholarship', name: 'Scholarship', price: 0, note: 'First Nations learners and anyone facing financial hardship. A short statement is all we ask.' },
    { id: 'community-50', name: 'Community', price: 50, note: 'Choose the amount that fits. No questions asked.' },
    { id: 'community-100', name: 'Community', price: 100, note: 'Choose the amount that fits. No questions asked.' },
    { id: 'community-150', name: 'Community', price: 150, note: 'Choose the amount that fits. No questions asked.' },
    { id: 'standard', name: 'Standard', price: 300, note: 'Working professionals paying for themselves.' },
    { id: 'employer', name: 'Employer-paid', price: 350, note: 'An agency or employer pays. Invoice provided.' },
    { id: 'sustainer', name: 'Sustainer', price: 600, note: 'Pays for your seat and one scholarship seat.' }
  ];

  var PATHS = {
    volunteer: {
      label: 'Volunteer', sessions: 3, weeks: 3, defaultSeat: null,
      includes: 'Foundations, cohort weeks 1-3',
      outcome: 'You leave with a Foundations certificate of completion and the preparation the program recommends before outreach and kit distribution.'
    },
    peer: {
      label: 'Peer', sessions: 15, weeks: 15, defaultSeat: 'community-100',
      includes: 'Foundations and the twelve-week curriculum, cohort weeks 1-15',
      outcome: 'You leave with a certificate of completion, a scope statement written for peer work, and an invitation to apply to co-facilitate Prometheus peer circles.'
    },
    clinician: {
      label: 'Clinician', sessions: 15, weeks: 15, defaultSeat: 'standard',
      includes: 'Foundations, the twelve-week curriculum, and seven clinical readings, cohort weeks 1-15',
      outcome: 'You leave with a certificate of completion and a plan for bringing harm reduction into your own practice. The course offers no continuing education credits.'
    }
  };

  var LIVE_HOURS = 1.5;   /* one 90-minute session */
  var TOTAL_HOURS = 2.5;  /* session plus about an hour of reading, practice, and reflection */

  function $(id) { return document.getElementById(id); }
  function money(n) { return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); }
  /* Split a price into n payments that add up exactly, to the cent: $100 in 3 is $33.34, $33.33, $33.33. */
  function parts(total, n) {
    var cents = Math.round(total * 100), base = Math.floor(cents / n), extra = cents - base * n, out = [];
    for (var i = 0; i < n; i++) { out.push((base + (i < extra ? 1 : 0)) / 100); }
    return out;
  }
  function payUrl(amount) { return PAYPAL.replace(/\/+$/, '') + '/' + (Math.round(amount * 100) % 100 ? amount.toFixed(2) : String(Math.round(amount))) + 'USD'; }
  function planText(seat, plan) {
    if (plan === 1) { return 'in full, ' + money(seat.price); }
    return plan + ' payments: ' + parts(seat.price, plan).map(money).join(', ');
  }
  function hours(n) { return (Math.round(n * 10) / 10).toString(); }
  function seatById(id) { for (var i = 0; i < SEATS.length; i++) { if (SEATS[i].id === id) { return SEATS[i]; } } return null; }

  /* ---------- Planner ---------- */
  var ui = document.querySelector('.planner-ui');
  if (ui) {
    var state = { path: 'peer', seat: PATHS.peer.defaultSeat, es: false, plan: 1 };
    var seatTouched = false;

    var seatList = $('seat-list');
    var seatFree = $('seat-free');
    var track = $('track');
    var stats = $('plan-stats');
    var outcome = $('plan-outcome');
    var live = $('plan-live');
    var optEs = $('opt-es');
    var mailBtn = $('plan-mail');
    var copyBtn = $('plan-copy');
    var linkBtn = $('plan-link');
    var status = $('plan-status');
    var fallback = $('plan-fallback');
    var fallbackText = $('plan-text');
    var payField = $('pay-field');
    var payBox = $('pay-box');
    var payLead = $('pay-lead');
    var payBtn = $('pay-btn');
    var payLater = $('pay-later');

    SEATS.forEach(function (s) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'seat';
      input.value = s.id;
      var box = document.createElement('span');
      box.className = 'seat';
      var b = document.createElement('b'); b.textContent = s.name;
      var strong = document.createElement('strong'); strong.textContent = money(s.price);
      var small = document.createElement('small'); small.textContent = s.note;
      box.appendChild(b); box.appendChild(strong); box.appendChild(small);
      label.appendChild(input); label.appendChild(box);
      seatList.appendChild(label);
    });

    var readHash = function () {
      if (location.hash.indexOf('#plan=') !== 0) { return false; }
      var params = new URLSearchParams(location.hash.slice(1));
      var p = params.get('plan');
      if (!Object.prototype.hasOwnProperty.call(PATHS, p)) { return false; }
      state.path = p;
      var s = params.get('seat');
      if (seatById(s)) { state.seat = s; seatTouched = true; }
      else { state.seat = PATHS[p].defaultSeat || PATHS.peer.defaultSeat; }
      state.es = params.get('es') === '1';
      var pl = parseInt(params.get('pay'), 10);
      state.plan = pl === 2 || pl === 3 ? pl : 1;
      return true;
    };

    var compose = function () {
      var p = PATHS[state.path];
      var seat = state.path === 'volunteer' ? null : seatById(state.seat);
      var subject = 'Course seat request: ' + p.label + ' path' + (seat ? ', ' + seat.name + ' seat ' + money(seat.price) : '');
      var lines = [
        'Hello Prometheus Team,',
        '',
        'I would like a seat in the next cohort.',
        '',
        'Path: ' + p.label + ' (' + p.includes + ')',
        'Seat: ' + (seat ? seat.name + ' seat, ' + money(seat.price) + ' for the curriculum' : 'Foundations, free')
      ];
      if (seat && seat.id === 'scholarship') {
        lines.push('', 'Scholarship statement (a few sentences about financial hardship, or a note that I am a First Nations learner):', '');
      }
      if (seat && seat.id === 'employer') {
        lines.push('', 'Organization and billing contact for the invoice:', '');
      }
      if (seat && seat.price > 0) {
        lines.push('', 'Payment: ' + planText(seat, state.plan) + (seat.id === 'employer' ? ', by invoice' : ', by PayPal'));
      }
      if (state.es) {
        lines.push('', 'I would join a Spanish-language cohort if one opens.');
      }
      lines.push('', 'Name I would like to be called:', 'Best way to reach me:', '', 'Thank you.');
      return { subject: subject, body: lines.join('\n') };
    };

    var planLink = function () {
      var h = 'plan=' + state.path;
      if (state.path !== 'volunteer') { h += '&seat=' + state.seat; }
      if (state.es) { h += '&es=1'; }
      if (state.plan > 1) { h += '&pay=' + state.plan; }
      return location.href.split('#')[0] + '#' + h;
    };

    var renderTrack = function () {
      track.textContent = '';
      GROUPS.forEach(function (g) {
        var group = document.createElement('li');
        group.className = 'track-group';
        var lab = document.createElement('span');
        lab.className = 'track-label';
        lab.setAttribute('aria-hidden', 'true');
        lab.textContent = g.free ? 'Foundations' : g.id;
        var nodes = document.createElement('ol');
        nodes.className = 'track-nodes';
        g.weeks.forEach(function (w) {
          var on = state.path !== 'volunteer' || w <= 3;
          var name = g.free ? 'Foundations ' + F_TITLES[w] : g.label + ', ' + g.title;
          var node = document.createElement('li');
          node.className = 'node' + (on ? ' in ' + (g.free ? 'free' : 'paid') : '');
          node.title = 'Week ' + w + ': ' + name;
          var num = document.createElement('span');
          num.setAttribute('aria-hidden', 'true');
          num.textContent = w;
          var sr = document.createElement('span');
          sr.className = 'vh';
          sr.textContent = 'Week ' + w + ', ' + name + '. ' + (on ? (g.free ? 'In your path, free.' : 'In your path.') : 'Not in your path.');
          node.appendChild(num); node.appendChild(sr);
          nodes.appendChild(node);
        });
        group.appendChild(lab); group.appendChild(nodes);
        track.appendChild(group);
        if (g.free) {
          var gate = document.createElement('li');
          gate.className = 'track-gate';
          gate.setAttribute('aria-hidden', 'true');
          gate.appendChild(document.createElement('span'));
          track.appendChild(gate);
        }
      });
    };

    var tile = function (value, label) {
      var d = document.createElement('div');
      var s = document.createElement('strong'); s.textContent = value;
      var l = document.createElement('span'); l.textContent = label;
      d.appendChild(s); d.appendChild(l);
      return d;
    };

    var update = function () {
      var p = PATHS[state.path];
      var volunteer = state.path === 'volunteer';
      var seat = volunteer ? null : seatById(state.seat);

      document.querySelectorAll('input[name="path"]').forEach(function (r) { r.checked = r.value === state.path; });
      seatList.hidden = volunteer;
      seatFree.hidden = !volunteer;
      seatList.querySelectorAll('input[name="seat"]').forEach(function (r) { r.checked = r.value === state.seat; });
      optEs.checked = state.es;
      document.querySelectorAll('input[name="payplan"]').forEach(function (r) { r.checked = Number(r.value) === state.plan; });
      var paid = !!(seat && seat.price > 0);
      payField.hidden = !paid;
      payBox.hidden = !paid || seat.id === 'employer';
      if (paid && seat.id !== 'employer') {
        var amounts = parts(seat.price, state.plan);
        payLead.textContent = seat.name + ' seat, ' + money(seat.price) + (state.plan > 1 ? ', in ' + state.plan + ' payments.' : ', paid in full.');
        payBtn.href = payUrl(amounts[0]);
        payBtn.textContent = state.plan > 1 ? 'Pay payment 1 of ' + state.plan + ', ' + money(amounts[0]) : 'Pay ' + money(seat.price) + ' with PayPal';
        payLater.textContent = '';
        payLater.hidden = state.plan === 1;
        if (state.plan > 1) {
          payLater.appendChild(document.createTextNode('Later payments, any time before week 4: '));
          amounts.slice(1).forEach(function (amt, i) {
            if (i) { payLater.appendChild(document.createTextNode(' · ')); }
            var a = document.createElement('a');
            a.href = payUrl(amt); a.target = '_blank'; a.rel = 'noopener noreferrer';
            a.textContent = 'payment ' + (i + 2) + ', ' + money(amt);
            payLater.appendChild(a);
          });
        }
      }

      renderTrack();

      stats.textContent = '';
      stats.appendChild(tile(String(p.sessions), 'live sessions'));
      stats.appendChild(tile(String(p.weeks), 'weeks'));
      stats.appendChild(tile(hours(p.sessions * LIVE_HOURS), 'live hours'));
      stats.appendChild(tile(hours(p.sessions * TOTAL_HOURS), 'hours in all, with reading and practice'));
      stats.appendChild(tile(volunteer ? 'Free' : money(seat.price), volunteer ? 'cost' : 'tuition for weeks 4–15'));

      outcome.textContent = p.outcome;

      var msg = compose();
      mailBtn.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(msg.subject) + '&body=' + encodeURIComponent(msg.body);
      live.textContent = p.label + ' path' + (seat ? ', ' + seat.name + ' seat ' + money(seat.price) : '') + ': ' +
        p.sessions + ' live sessions over ' + p.weeks + ' weeks, about ' + hours(p.sessions * TOTAL_HOURS) + ' hours in all, ' +
        (volunteer ? 'free.' : 'tuition ' + money(seat.price) + (seat.price > 0 && state.plan > 1 ? ' in ' + state.plan + ' payments.' : '.'));
    };

    var showFallback = function (text) {
      fallback.hidden = false;
      fallbackText.value = text;
      fallbackText.focus();
      fallbackText.select();
      status.textContent = 'Automatic copying is unavailable. Select and copy the text below.';
    };
    var copy = function (text, okMessage) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          fallback.hidden = true;
          status.textContent = okMessage;
        }, function () { showFallback(text); });
      } else {
        showFallback(text);
      }
    };

    document.querySelectorAll('input[name="path"]').forEach(function (r) {
      r.addEventListener('change', function () {
        state.path = r.value;
        if (!seatTouched && PATHS[r.value].defaultSeat) { state.seat = PATHS[r.value].defaultSeat; }
        status.textContent = '';
        update();
      });
    });
    seatList.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'seat') {
        state.seat = e.target.value;
        seatTouched = true;
        status.textContent = '';
        update();
      }
    });
    optEs.addEventListener('change', function () { state.es = optEs.checked; update(); });
    payField.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'payplan') { state.plan = Number(e.target.value); status.textContent = ''; update(); }
    });
    copyBtn.addEventListener('click', function () {
      var msg = compose();
      copy('To: ' + EMAIL + '\nSubject: ' + msg.subject + '\n\n' + msg.body, 'Request copied. Paste it into an email to ' + EMAIL + '.');
    });
    linkBtn.addEventListener('click', function () {
      copy(planLink(), 'Link copied. It opens this page with your plan selected.');
    });

    var fromHash = readHash();
    ui.hidden = false;
    var fb = document.querySelector('.planner-fallback');
    if (fb) { fb.hidden = true; }
    update();
    if (fromHash) { $('plan').scrollIntoView(); }
  }

  /* ---------- Tuition table: PayPal links follow PAYPAL above ---------- */
  document.querySelectorAll('a[data-pay-amount]').forEach(function (a) { a.href = payUrl(Number(a.getAttribute('data-pay-amount'))); });

  /* ---------- Evidence ledger filter ---------- */
  var ledgerFilters = $('ledger-filters');
  if (ledgerFilters) {
    var claims = document.querySelectorAll('#claims .claim');
    var ledgerCount = $('ledger-count');
    var applyLedger = function (value) {
      var shown = 0;
      ledgerFilters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === value)); });
      claims.forEach(function (c) {
        var match = value === 'all' || c.getAttribute('data-status') === value;
        c.hidden = !match;
        if (match) { shown += 1; }
      });
      ledgerCount.textContent = 'Showing ' + shown + ' of ' + claims.length + ' claims.';
    };
    ledgerFilters.hidden = false;
    ledgerFilters.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { applyLedger(b.getAttribute('data-filter')); });
    });
    applyLedger('all');
  }

  /* ---------- Reading filter ---------- */
  var readingFilters = $('reading-filters');
  if (readingFilters) {
    var groups = document.querySelectorAll('.reading-group');
    var readingCount = $('reading-count');
    var total = document.querySelectorAll('.reading-group .ref-list > li').length;
    var applyReadings = function (value) {
      var shown = 0;
      readingFilters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === value)); });
      groups.forEach(function (g) {
        var match = value === 'all' || g.getAttribute('data-group') === value;
        g.hidden = !match;
        if (match) { shown += g.querySelectorAll('.ref-list > li').length; }
      });
      readingCount.textContent = 'Showing ' + shown + ' of ' + total + ' readings.';
    };
    readingFilters.hidden = false;
    readingFilters.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { applyReadings(b.getAttribute('data-filter')); });
    });
    applyReadings('all');
  }
})();
