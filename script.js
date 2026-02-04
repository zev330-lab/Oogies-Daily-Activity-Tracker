/* global Notification */

// Version string to help verify updates
const APP_VERSION = 'v3.0.0';

document.addEventListener('DOMContentLoaded', () => {
  const vEl = document.getElementById('version');
  if (vEl) vEl.textContent = APP_VERSION;
});

// Utility: get logs from localStorage
function getLogs() {
  try {
    return JSON.parse(localStorage.getItem('dogLogs')) || [];
  } catch (e) {
    return [];
  }
}

// Utility: save logs to localStorage
function saveLogs(logs) {
  localStorage.setItem('dogLogs', JSON.stringify(logs));
}

// Utility: today's date in local ISO format
function localISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const local = new Date(now.getTime() - offset);
  return local.toISOString().split('T')[0];
}

// Helper to set active navigation state
function setActiveNav(id) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.id === 'nav-' + id) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

// Render dashboard summary of today's activities
function renderDashboard() {
  setActiveNav('dashboard');
  const app = document.getElementById('app');
  const logs = getLogs().filter(entry => entry.date === localISODate());
  // Aggregate counts and last times
  const summary = {
    walk: { count: 0, last: null },
    poop: { count: 0, last: null },
    pish: { count: 0, last: null },
    play: { count: 0, last: null },
    sleep: { count: 0, last: null },
    meal: { count: 0, last: null },
    other: { count: 0, last: null }
  };
  logs.forEach(entry => {
    entry.activities.forEach(act => {
      if (!summary[act]) return;
      summary[act].count++;
      summary[act].last = entry.time;
    });
  });
  let html = '<h2>Today\'s Summary</h2>';
  if (!logs.length) {
    html += '<div class="message">No activities logged for today yet.</div>';
  } else {
    html += '<div class="dashboard-grid">';
    for (const key of Object.keys(summary)) {
      const data = summary[key];
      html += `<div class="card"><h3>${key.charAt(0).toUpperCase()+key.slice(1)}</h3><p><strong>Count:</strong> ${data.count}</p>`;
      html += `<p><strong>Last:</strong> ${data.last || '—'}</p></div>`;
    }
    html += '</div>';
  }
  app.innerHTML = html;
}

// Render form to log an activity (multiple selections)
function renderLog() {
  setActiveNav('log');
  const app = document.getElementById('app');
  app.innerHTML = '';
  const form = document.createElement('form');
  form.innerHTML = `
    <h2>Log Activity</h2>
    <label>Select Activities</label>
    <div class="checkbox-grid">
      <label><input type="checkbox" name="activity" value="walk"> Walk</label>
      <label><input type="checkbox" name="activity" value="poop"> Poop</label>
      <label><input type="checkbox" name="activity" value="pish"> Pish</label>
      <label><input type="checkbox" name="activity" value="play"> Play</label>
      <label><input type="checkbox" name="activity" value="sleep"> Sleep</label>
      <label><input type="checkbox" name="activity" value="meal"> Meal</label>
      <label><input type="checkbox" name="activity" value="other"> Other</label>
    </div>
    <div id="walkDetails" class="details" style="display:none;">
      <label>Walk Start Time</label>
      <input type="time" id="walkStart">
      <label>Walk End Time</label>
      <input type="time" id="walkEnd">
      <label>Distance (km)</label>
      <input type="number" id="walkDistance" step="0.01" min="0">
      <label>Location</label>
      <input type="text" id="walkLocation" placeholder="e.g. park, street">
    </div>
    <div id="poopDetails" class="details" style="display:none;">
      <label>Poop Location</label>
      <select id="poopWhere">
        <option value="walk">On Walk</option>
        <option value="backyard">Backyard</option>
      </select>
    </div>
    <div id="pishDetails" class="details" style="display:none;">
      <label>Pish Location</label>
      <select id="pishWhere">
        <option value="walk">On Walk</option>
        <option value="backyard">Backyard</option>
      </select>
    </div>
    <div id="playDetails" class="details" style="display:none;">
      <label>Played with other dogs?</label>
      <select id="playWith">
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
      <label>Details (names, etc.)</label>
      <input type="text" id="playDetailsText" placeholder="Names or notes">
    </div>
    <div id="sleepDetails" class="details" style="display:none;">
      <label>Sleep Start Time</label>
      <input type="time" id="sleepStart">
      <label>Sleep End Time</label>
      <input type="time" id="sleepEnd">
      <label>Location</label>
      <input type="text" id="sleepLocation" placeholder="e.g. bed, couch">
    </div>
    <div id="mealDetails" class="details" style="display:none;">
      <label>Meal Time</label>
      <input type="time" id="mealTime">
      <label>Food</label>
      <input type="text" id="mealFood" placeholder="What did Oogie eat?">
    </div>
    <div id="otherDetails" class="details" style="display:none;">
      <label>Other Activity Description</label>
      <input type="text" id="otherDescription" placeholder="Describe the activity">
    </div>
    <label>General Notes (optional)</label>
    <textarea id="generalNotes" placeholder="Add any additional notes"></textarea>
    <button type="submit" class="submit">Save Activity</button>
  `;
  // Show/hide detail sections based on selected activities
  form.querySelectorAll('input[name="activity"]').forEach(cb => {
    cb.addEventListener('change', updateDetailVisibility);
  });
  function updateDetailVisibility() {
    const selected = Array.from(form.querySelectorAll('input[name="activity"]:checked')).map(c => c.value);
    // List of all detail sections
    const details = ['walk','poop','pish','play','sleep','meal','other'];
    details.forEach(type => {
      const el = form.querySelector('#' + type + 'Details');
      if (el) {
        el.style.display = selected.includes(type) ? 'block' : 'none';
      }
    });
  }
  updateDetailVisibility();
  form.onsubmit = e => {
    e.preventDefault();
    const selected = Array.from(form.querySelectorAll('input[name="activity"]:checked')).map(c => c.value);
    if (!selected.length) {
      alert('Please select at least one activity.');
      return;
    }
    const entry = {
      date: localISODate(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      activities: selected,
      details: {},
      notes: form.querySelector('#generalNotes').value.trim(),
      timestamp: new Date().toISOString()
    };
    // Collect details for each selected activity
    if (selected.includes('walk')) {
      entry.details.walk = {
        start: form.querySelector('#walkStart').value || null,
        end: form.querySelector('#walkEnd').value || null,
        distance: form.querySelector('#walkDistance').value || null,
        location: form.querySelector('#walkLocation').value.trim() || null
      };
    }
    if (selected.includes('poop')) {
      entry.details.poop = {
        location: form.querySelector('#poopWhere').value
      };
    }
    if (selected.includes('pish')) {
      entry.details.pish = {
        location: form.querySelector('#pishWhere').value
      };
    }
    if (selected.includes('play')) {
      entry.details.play = {
        withOtherDogs: form.querySelector('#playWith').value,
        details: form.querySelector('#playDetailsText').value.trim() || null
      };
    }
    if (selected.includes('sleep')) {
      entry.details.sleep = {
        start: form.querySelector('#sleepStart').value || null,
        end: form.querySelector('#sleepEnd').value || null,
        location: form.querySelector('#sleepLocation').value.trim() || null
      };
    }
    if (selected.includes('meal')) {
      entry.details.meal = {
        time: form.querySelector('#mealTime').value || null,
        food: form.querySelector('#mealFood').value.trim() || null
      };
    }
    if (selected.includes('other')) {
      entry.details.other = {
        description: form.querySelector('#otherDescription').value.trim() || null
      };
    }
    const logs = getLogs();
    logs.push(entry);
    saveLogs(logs);
    alert('Activity logged successfully.');
    renderDashboard();
  };
  app.appendChild(form);
}

// Render all logs in table form
function renderLogs() {
  setActiveNav('logs');
  const app = document.getElementById('app');
  const logs = getLogs();
  if (!logs.length) {
    app.innerHTML = '<div class="message">No activities recorded yet.</div>';
    return;
  }
  logs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  let html = '<h2>All Logs</h2><table><thead><tr><th>Date</th><th>Time</th><th>Activities</th><th>Details</th></tr></thead><tbody>';
  for (const entry of logs) {
    const acts = entry.activities.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
    // Simplify details summary: list keys and simple descriptions
    const detailParts = [];
    for (const key of entry.activities) {
      const det = entry.details[key] || {};
      const parts = [];
      Object.keys(det).forEach(k => {
        const v = det[k];
        if (v) parts.push(`${k}:${v}`);
      });
      detailParts.push(`${key}: ${parts.join(' | ')}`);
    }
    const detailStr = detailParts.join('; ');
    html += `<tr><td>${entry.date}</td><td>${entry.time}</td><td>${acts}</td><td>${detailStr}</td></tr>`;
  }
  html += '</tbody></table>';
  app.innerHTML = html;
}

// Render daily report: compile today's logs into a text area for copy
function renderReport() {
  setActiveNav('report');
  const app = document.getElementById('app');
  const today = localISODate();
  const logs = getLogs().filter(entry => entry.date === today);
  let report = `Activity report for ${today}\n\n`;
  if (!logs.length) {
    report += 'No activities logged.';
  } else {
    logs.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    logs.forEach(entry => {
      const acts = entry.activities.map(a => a.charAt(0).toUpperCase()+a.slice(1)).join(', ');
      report += `${entry.time} – ${acts}`;
      const parts = [];
      entry.activities.forEach(key => {
        const det = entry.details[key] || {};
        const subparts = [];
        Object.keys(det).forEach(k => {
          const v = det[k];
          if (v) subparts.push(`${k}: ${v}`);
        });
        if (subparts.length) parts.push(`${key} [${subparts.join('; ')}]`);
      });
      if (parts.length) report += ` (${parts.join(' | ')})`;
      if (entry.notes) report += ` – Notes: ${entry.notes}`;
      report += '\n';
    });
  }
  app.innerHTML = `<h2>Daily Report</h2><textarea style="width:100%; height:200px;">${report}</textarea><p>Copy the above text to email or message.</p>`;
}

// Render settings page
function renderSettings() {
  setActiveNav('settings');
  const app = document.getElementById('app');
  let html = '<h2>Settings</h2>';
  html += `<p><strong>Version:</strong> ${APP_VERSION}</p>`;
  html += '<button class="submit" id="clearLogs">Clear All Logs</button>';
  app.innerHTML = html;
  document.getElementById('clearLogs').onclick = () => {
    if (confirm('Delete all logged activities?')) {
      localStorage.removeItem('dogLogs');
      alert('All logs cleared.');
      renderDashboard();
    }
  };
}

// Initialise application and attach event handlers
function init() {
  document.getElementById('nav-dashboard').addEventListener('click', renderDashboard);
  document.getElementById('nav-log').addEventListener('click', renderLog);
  document.getElementById('nav-logs').addEventListener('click', renderLogs);
  document.getElementById('nav-report').addEventListener('click', renderReport);
  document.getElementById('nav-settings').addEventListener('click', renderSettings);
  // Default to dashboard
  renderDashboard();
}

// Register service worker and then init
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(() => {
    init();
  }).catch(() => init());
} else {
  init();
}