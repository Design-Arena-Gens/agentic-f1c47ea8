import data from './data/analysis.json' assert { type: 'json' };

const $ = (sel) => document.querySelector(sel);

function renderKPIs() {
  $('#kpi-accounts').textContent = String(data.accounts.targets.length + data.accounts.discovery.length);
  $('#kpi-patterns').textContent = String(
    data.patterns.hooks.length + data.patterns.scripting.length + data.patterns.editing.length + data.patterns.algorithm.length
  );
  $('#kpi-templates').textContent = String(data.templates.length);
}

function createAccountNode(account) {
  const el = document.createElement('div');
  el.className = 'account';
  el.innerHTML = `
    <div class="avatar">${account.avatar || account.handle[1]?.toUpperCase() || 'A'}</div>
    <div>
      <div class="name">${account.name} <span class="meta">${account.handle}</span></div>
      <div class="meta">${account.focus}</div>
      <div class="tags">${account.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
    <a href="${account.url}" target="_blank" rel="noreferrer" class="tag">Profile</a>
  `;
  return el;
}

function renderAccounts() {
  const targetWrap = $('#target-accounts');
  const discoveryWrap = $('#additional-accounts');
  targetWrap.innerHTML = '';
  discoveryWrap.innerHTML = '';

  data.accounts.targets.forEach(a => targetWrap.appendChild(createAccountNode(a)));
  data.accounts.discovery.forEach(a => discoveryWrap.appendChild(createAccountNode(a)));
}

function renderPatternsTab(tab) {
  const wrap = document.createElement('div');
  wrap.className = 'patterns';
  for (const p of data.patterns[tab]) {
    const item = document.createElement('div');
    item.className = 'pattern';
    item.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.detail}</p>
      ${p.examples?.length ? `<ul>${p.examples.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
    `;
    wrap.appendChild(item);
  }
  return wrap;
}

function setupTabs() {
  const container = $('#tab-content');
  const buttons = Array.from(document.querySelectorAll('.tab'));
  function select(tab) {
    buttons.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    container.innerHTML = '';
    container.appendChild(renderPatternsTab(tab));
  }
  buttons.forEach(btn => btn.addEventListener('click', () => select(btn.dataset.tab)));
  select('hooks');
}

function monthName(i) {
  const months = ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6','Month 7','Month 8','Month 9','Month 10'];
  return months[i] || `Month ${i+1}`;
}

function generatePlan({ persona, pillars, platforms, weeklyOutput }) {
  const phases = [
    { name: 'Calibration', goals: ['Message-market fit signals','Baseline engagement metrics','Tight hook iterations'], cadence: 'High iteration', months: [1,2] },
    { name: 'Compounding', goals: ['Template library scale','Community nucleus','Collab flywheel'], cadence: 'Volume + quality', months: [3,4,5,6] },
    { name: 'Domination', goals: ['Signature series','Authority moats','Monetization layering'], cadence: 'Flagship formats', months: [7,8,9,10] }
  ];

  const plan = [];
  let month = 0;
  for (const phase of phases) {
    for (const m of phase.months) {
      const assignments = [];
      for (const pillar of pillars) {
        assignments.push(`${pillar}: ${Math.max(2, Math.round(weeklyOutput/ pillars.length))} posts/week`);
      }
      plan.push({
        month: ++month,
        title: `${monthName(month)} ? ${phase.name}`,
        meta: `${phase.cadence} ? ${platforms.join(', ')} ? Persona: ${persona}`,
        goals: phase.goals,
        assignments,
      });
    }
  }
  return plan;
}

function renderPlan(plan) {
  const wrap = $('#plan-preview');
  wrap.innerHTML = '';
  for (const phase of plan) {
    const el = document.createElement('div');
    el.className = 'phase';
    el.innerHTML = `
      <h3>${phase.title}</h3>
      <div class="meta">${phase.meta}</div>
      <strong>Goals</strong>
      <ul>${phase.goals.map(g => `<li>${g}</li>`).join('')}</ul>
      <strong>Assignments</strong>
      <ul>${phase.assignments.map(a => `<li>${a}</li>`).join('')}</ul>
    `;
    wrap.appendChild(el);
  }
}

function planToMarkdown(plan, persona, pillars, platforms, weeklyOutput) {
  const lines = [];
  lines.push(`# Master Growth Playbook`);
  lines.push('');
  lines.push(`Persona: ${persona}`);
  lines.push(`Pillars: ${pillars.join(', ')}`);
  lines.push(`Platforms: ${platforms.join(', ')}`);
  lines.push(`Weekly Output: ${weeklyOutput}`);
  lines.push('');
  lines.push('## 10-Month Plan');
  for (const p of plan) {
    lines.push(`\n### ${p.title}`);
    lines.push(`${p.meta}`);
    lines.push('\n- Goals:');
    for (const g of p.goals) lines.push(`  - ${g}`);
    lines.push('- Assignments:');
    for (const a of p.assignments) lines.push(`  - ${a}`);
  }
  lines.push('\n## Hooks Library');
  for (const h of data.patterns.hooks) lines.push(`- ${h.title}: ${h.detail}`);
  lines.push('\n## Templates');
  for (const t of data.templates) lines.push(`- ${t.name}: ${t.description}`);
  return lines.join('\n');
}

function planToCSV(plan) {
  const rows = [['Month','Phase','Item Type','Text']];
  for (const p of plan) {
    for (const g of p.goals) rows.push([String(p.month), p.title, 'Goal', g]);
    for (const a of p.assignments) rows.push([String(p.month), p.title, 'Assignment', a]);
  }
  return rows.map(r => r.map(v => '"' + v.replace(/"/g,'""') + '"').join(',')).join('\n');
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function setupPlaybook() {
  const form = $('#playbook-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const persona = $('#persona').value || 'Hybrid athlete ? creator ? entrepreneur';
    const pillars = ($('#pillars').value || 'Training systems, Performance lifestyle, Business build-in-public, Mindset, Community')
      .split(',').map(s => s.trim()).filter(Boolean);
    const platforms = [];
    if ($('#platform-ig').checked) platforms.push('Instagram');
    if ($('#platform-yt').checked) platforms.push('YouTube Shorts');
    if ($('#platform-tk').checked) platforms.push('TikTok');
    const weeklyOutput = Number($('#weekly-output').value || 21);

    const plan = generatePlan({ persona, pillars, platforms, weeklyOutput });
    renderPlan(plan);

    // Wire exports to latest plan in memory
    $('#export-md').onclick = () => download('master-playbook.md', planToMarkdown(plan, persona, pillars, platforms, weeklyOutput), 'text/markdown');
    $('#export-csv').onclick = () => download('content-calendar.csv', planToCSV(plan), 'text/csv');
  });
}

function init() {
  renderKPIs();
  renderAccounts();
  setupTabs();
  setupPlaybook();
}

document.addEventListener('DOMContentLoaded', init);
