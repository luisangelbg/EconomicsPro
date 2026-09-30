/* EconomicsPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* EconomicsPro — global state and shared utilities.
   No ES modules: everything hangs from window so the app also works when
   index.html is opened with a double click (file://). */

/* the version of the app, written once: the report cites it and the page shows
   it, so it cannot drift from one place to another */
const APP_VERSION = "1.0.7";
/* the concept DOI of Zenodo: it always resolves to the latest archived version */
const APP_DOI = "10.5281/zenodo.23005974";
window.APP_VERSION = APP_VERSION;
window.APP_DOI = APP_DOI;

const state = {
  /* --- Block 2: the project and its assumptions --- */
  project: null,     // horizon, currency, inflation, discount rate, tax regime
  /* --- results, one slot per block --- */
  market: null,      // Block 3: prices, yields, sales programme
  budget: null,      // Block 4: investment, costs, working capital
  statements: null,  // Block 5: loans, pro-forma statements, break-even
  appraisal: null,   // Block 6: NPV, IRR, B/C, payback, EAA
  risk: null,        // Block 7: sensitivity, scenarios, Monte Carlo
  social: null,      // Block 8: shadow prices, ENPV, employment
  decisions: null,   // Block 9: comparison, replacement, capital rationing, rotation
  report: null,      // Block 10: what the figure studio and the report last built
};
window.state = state;

/* the ten blocks of the app, in navigation order */
const STEPS = [
  { n: 1, es: 'Inicio', en: 'Home', ready: true },
  { n: 2, es: 'Proyecto', en: 'Project', ready: true },
  { n: 3, es: 'Mercado', en: 'Market', ready: true },
  { n: 4, es: 'Inversión y costos', en: 'Investment and costs', ready: true },
  { n: 5, es: 'Estados proforma', en: 'Pro-forma statements', ready: true },
  { n: 6, es: 'Evaluación financiera', en: 'Financial appraisal', ready: true },
  { n: 7, es: 'Riesgo', en: 'Risk', ready: true },
  { n: 8, es: 'Evaluación social', en: 'Social appraisal', ready: true },
  { n: 9, es: 'Decisiones', en: 'Decisions', ready: true },
  { n: 10, es: 'Informe', en: 'Report', ready: true },
];

/* ---------------- DOM ---------------- */
function el(id) { return document.getElementById(id); }
function els(sel, root) { return [...(root || document).querySelectorAll(sel)]; }
function mk(tag, attrs, html) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'style') n.setAttribute('style', attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* bilingual inline HTML: both spans are written, CSS shows the active one */
function L2(es, en) { return `<span data-l="es">${es}</span><span data-l="en">${en}</span>`; }
/* Labels shown in capitals would turn σ into Σ (a sum) and B/C into other things:
   Greek letters and symbols with a superscript or subscript keep their own case
   inside an uppercase label. */
function keepGreek(s) {
  return String(s).replace(/([Ͱ-Ͽ][²³₀-₉]*[A-Za-z]{0,3}|[A-Za-z][²³₀-₉]+|\[[a-z]\])/g, '<span class="nc">$1</span>');
}
function svgEl(tag, attrs, text) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
/* Waiting window of the LABG Suite: ecWork opens it (it only shows up when the
   wait lasts more than 300 ms) and ecAfterPaint lets it paint, runs the task
   (synchronous or async) and closes it with the check mark, or quietly when the
   task failed. The tests load core.js without labg-core.js: everything is
   guarded with window.LABG. */
function ecWork(es, en) { if (!window.LABG || !LABG.work) return null; const w = LABG.work({ title: LABG.t(es, en || es), delay: 300 }); ecWork.current = w; return w; }
ecWork.current = null;
function ecAfterPaint(f, w) {
  const done = () => { if (ecWork.current === w) ecWork.current = null; if (w && !w.ended) { if (w._failed) w.close(); else w.done(); } };
  return (window.LABG ? LABG.nextPaint() : new Promise(r => setTimeout(r, 30))).then(f).then(done, e => { console.error(e); if (w) w._failed = true; done(); });
}
function showMessage(container, type, text) {
  if (type === 'error' && ecWork.current) ecWork.current._failed = true;
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  const div = mk('div', { class: 'msg msg-' + type }, text);
  /* errors and warnings are read out by screen readers */
  if (window.LABG) LABG.messageRole(div, type);
  container.appendChild(div);
  return div;
}
function clearMessages(container) {
  if (typeof container === 'string') container = el(container);
  if (container) container.innerHTML = '';
}

/* ---------------- numbers ----------------
   Numbers use the decimal point and a comma for thousands in both languages
   (the convention of financial reporting in Mexico and in English). */
function fmtNum(v, d) {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-4 || abs >= 1e12) { const e = n.toExponential(d != null ? d : 2); return e.startsWith('-') ? '−' + e.slice(1) : e; }
  const s = n.toLocaleString('en-US', { maximumFractionDigits: d != null ? d : 3 });
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);   /* a negative value that rounds to zero loses its sign */
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
function fmtFixed(v, d) {
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '−∞';
  if (v == null || !isFinite(v)) return '—';
  const s = Number(v).toFixed(d == null ? 3 : d);
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
function fmtP(p) {
  if (p == null || !isFinite(p)) return '—';
  if (p < 0.0001) return '< 0.0001';
  return Number(p).toFixed(4);
}
/* "p = 0.0123" or "p < 0.0001": the sign that goes with the value */
function pEq(p) { const s = fmtP(p); return s.startsWith('<') ? 'p ' + s : 'p = ' + s; }
/* "1 año", "2 años" */
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

/* ---------------- money ----------------
   Money is written with two decimals by default and a thousands separator.
   Accounting style puts the loss in parentheses; running text uses the minus
   sign U+2212, which lines up with the digits in the tables. */
const Money = {
  symbol: '$',
  code: 'MXN',
  set(symbol, code) { Money.symbol = symbol || '$'; Money.code = code || ''; },
};
function fmtMoney(v, d, opt) {
  if (v == null || !isFinite(v)) return '—';
  const dec = d == null ? 2 : d;
  const acc = opt && opt.accounting;
  const sym = opt && opt.symbol === false ? '' : Money.symbol;
  const abs = Math.abs(Number(v));
  const body = sym + abs.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const neg = Number(v) < 0 && !/^-?0(\.0*)?$/.test(Number(v).toFixed(dec));
  if (!neg) return body;
  return acc ? '(' + body + ')' : '−' + body;
}
/* Long money series are easier to read in thousands or millions; the unit is
   chosen once for the whole table so the columns stay comparable. */
function moneyScale(values) {
  const max = Math.max(0, ...values.filter(v => isFinite(v)).map(v => Math.abs(v)));
  if (max >= 1e9) return { k: 1e6, es: 'millones', en: 'millions', suffix: 'M' };
  if (max >= 1e6) return { k: 1e3, es: 'miles', en: 'thousands', suffix: 'k' };
  return { k: 1, es: '', en: '', suffix: '' };
}
/* 0.1234 → "12.34%" */
function fmtPct(x, d) {
  if (x == null || !isFinite(x)) return '—';
  const s = (x * 100).toLocaleString('en-US', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + '%';
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
/* a rate that may not exist (an IRR that no discount rate can produce) */
function fmtRate(x, d) { return x == null || !isFinite(x) ? '—' : fmtPct(x, d); }

/* Reads what the user typed in a money or rate field: "1,250.50", "$1 250.50",
   "12%" and "12 %" all work; an empty field is null, never 0. */
function parseNum(s) {
  if (s == null) return null;
  if (typeof s === 'number') return isFinite(s) ? s : null;
  let t = String(s).trim().replace(/[\s ]/g, '').replace(/[$€£]/g, '').replace(/,/g, '');
  if (!t) return null;
  let pct = false;
  if (t.endsWith('%')) { pct = true; t = t.slice(0, -1); }
  if (/^\(.*\)$/.test(t)) t = '-' + t.slice(1, -1);          /* accounting parentheses */
  t = t.replace(/[−–—]/g, '-');                              /* typographic minus signs */
  const v = Number(t);
  if (!isFinite(v)) return null;
  return pct ? v / 100 : v;
}
/* A rate may be typed as 12 (per cent) or as 0.12 (a fraction). Anything
   greater than 1 is read as a percentage, which is how it is written in a
   project document. */
function parseRate(s) {
  const v = parseNum(s);
  if (v == null) return null;
  if (typeof s === 'string' && s.includes('%')) return v;
  return Math.abs(v) > 1 ? v / 100 : v;
}

/* ---------------- CSV / downloads ---------------- */
function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = mk('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function slug(s) {
  return String(s || 'economicspro').replace(/\.[a-z0-9]{1,5}$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'economicspro';
}

/* ---------------- step navigation ---------------- */
const stepBtn = n => document.querySelector('.step-btn[data-step="' + n + '"]');
const stepOn = n => { const b = stepBtn(n); return !!b && !b.disabled; };
const STEP_ORDER = STEPS.map(s => String(s.n));
/* the slot of `state` that a block fills when it has been worked through */
const STEP_SLOT = { 2: 'project', 3: 'market', 4: 'budget', 5: 'statements', 6: 'appraisal',
  7: 'risk', 8: 'social', 9: 'decisions', 10: 'report' };
const visitedSteps = new Set();
let currentStep = '1';

function goStep(n) {
  n = String(n);
  if (currentStep !== n) visitedSteps.add(currentStep);
  currentStep = n;
  els('.step-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + n));
  els('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === n));
  document.body.classList.toggle('on-home', n === '1');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const btn = stepBtn(n);
  if (window.LABG) {
    LABG.setCurrentStep(n);     /* aria-current, one tab stop and the button brought into view */
    const s = STEPS.find(x => String(x.n) === n);
    if (s) LABG.announce(T('Bloque ', 'Block ') + s.n + ': ' + T(s.es, s.en));
  } else if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  document.dispatchEvent(new CustomEvent('stepchange', { detail: { step: Number(n) } }));
  refreshStepMarks();
  refreshStepFooters();
}
function enableStep(n, on) {
  const b = stepBtn(n);
  if (b) b.disabled = (on === false);
  refreshStepMarks();
  refreshStepFooters();
}

/* A block is «done» once the user has worked in it (its slot of the state is
   filled) and moved on; it is flagged «check» when its own review found an error. */
function refreshStepMarks() {
  if (!window.LABG) return;
  STEPS.forEach(s => {
    const key = String(s.n);
    const slot = STEP_SLOT[s.n] && state[STEP_SLOT[s.n]];
    if (!slot || !stepOn(key) || !visitedSteps.has(key)) { LABG.markStep(key, null); return; }
    const errors = Array.isArray(slot.messages) && slot.messages.some(m => m && m.level === 'error');
    LABG.markStep(key, errors ? 'warn' : key === currentStep ? null : 'done');
  });
}

/* Foot of every block: Previous / Next, with the name of the block in both
   languages (CSS shows the active one). */
function stepLabel(n) {
  const s = STEPS.find(x => String(x.n) === n);
  return s ? s.n + ' · ' + L2(s.es, s.en) : '';
}
function refreshStepFooters() {
  if (!stepBtn('1')) return;               /* the block bar is not built yet */
  els('.step-panel').forEach(p => {
    const n = p.id.replace('panel-', '');
    const i = STEP_ORDER.indexOf(n);
    if (i < 0) return;
    let f = p.querySelector(':scope > .step-footer');
    if (!f) {
      f = mk('nav', { class: 'step-footer no-print' });
      f.innerHTML = '<button type="button" class="btn btn-secondary prev"></button><button type="button" class="btn btn-primary next"></button>';
      f.addEventListener('click', e => { const b = e.target.closest('button[data-go]'); if (b && !b.disabled) goStep(b.dataset.go); });
      p.appendChild(f);
    }
    f.setAttribute('aria-label', T('Bloque anterior y siguiente', 'Previous and next block'));
    const prev = STEP_ORDER.slice(0, i).reverse().find(stepOn);
    const next = STEP_ORDER.slice(i + 1).find(s => stepBtn(s));
    const bp = f.querySelector('.prev'), bn = f.querySelector('.next');
    bp.hidden = !prev;
    if (prev) { bp.dataset.go = prev; bp.innerHTML = `← <span><small>${L2('Anterior', 'Previous')}</small>${stepLabel(prev)}</span>`; }
    bn.hidden = !next;
    if (next) {
      bn.dataset.go = next; bn.disabled = !stepOn(next);
      bn.innerHTML = `<span><small>${L2('Siguiente', 'Next')}</small>${stepLabel(next)}</span> →`;
    }
  });
}

/* Can the browser keep the project? It is saved there on every change, so
   leaving only loses work when that storage is unavailable. */
function storageWorks() {
  try { const k = 'economicspro:probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }
  catch (e) { return false; }
}

/* The common bar of the suite: theme, shortcuts, keyboard, warning before
   leaving. Called by home.js once the block bar exists; the tests load this
   file without labg-core.js, so everything waits for window.LABG. */
function initSuiteBar() {
  if (!window.LABG) return;
  if (LABG.work) {
    LABG.work.scene = 'fit';
    LABG.work.tips = [
      ['La simulación de Monte Carlo usa una semilla fija: el mismo proyecto da siempre el mismo histograma.', 'The Monte Carlo simulation uses a fixed seed: the same project always gives the same histogram.'],
      ['El paquete .zip del Bloque 10 lleva el archivo del proyecto que reproduce todo el estudio.', 'The .zip package of Block 10 carries the project file that reproduces the whole study.'],
      ['Para practicar hay tres proyectos ficticios: nopal, café y fresa.', 'To practise there are three fictitious projects: prickly pear cactus, coffee and strawberry.']
    ];
  }
  LABG.theme.init('economicspro:theme');    /* same key as Theme in i18n.js */
  document.addEventListener('themechange', () => LABG.theme.paint());
  const hb = el('helpBtn');
  if (hb) hb.addEventListener('click', () => LABG.showShortcuts());
  LABG.shortcuts([]);
  LABG.bindStepKeys(goStep);
  LABG.guardUnload(() => !!state.project && !storageWorks());
  const nav = el('stepper');
  const relabel = () => { if (nav) nav.setAttribute('aria-label', T('Bloques', 'Blocks')); LABG.theme.paint(); refreshStepMarks(); refreshStepFooters(); };
  document.addEventListener('langchange', relabel);
  LABG.setCurrentStep(currentStep);
  relabel();
}

/* Persisted preferences (figure style, last settings) */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('economicspro:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('economicspro:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

/* ---------------- random numbers ----------------
   Everything stochastic (the Monte Carlo simulation of the risk block and the
   laboratories of the home page) draws from a seeded generator, so a run is
   reproducible and its seed can be reported in the thesis. sfc32 passes the
   usual statistical batteries, unlike a 32-bit linear congruential generator. */
function rng(seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  return next;
}
function randn(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function shuffle(arr, r) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback || '#145e4e';
}

Object.assign(window, {
  STEPS, el, els, mk, esc, L2, keepGreek, svgEl, showMessage, clearMessages,
  fmtNum, fmtFixed, fmtP, pEq, fmtPct, fmtRate, plural, Money, fmtMoney, moneyScale,
  parseNum, parseRate, csvEscape, download, slug,
  goStep, enableStep, initSuiteBar, Prefs, rng, randn, shuffle, cssVar,
});

/* A message that belongs above the ones a block has just written (the note of
   an example, the result of an import): it is added and moved to the top, so
   it never hides the warnings of the review. */
function notice(container, type, text) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  const div = showMessage(container, type, text);
  if (div && container.firstChild !== div) container.insertBefore(div, container.firstChild);
  return div;
}
Object.assign(window, { notice });

/* every place on the page that shows the version or the DOI reads them from the constants */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.app-v').forEach(n => { n.textContent = APP_VERSION; });
  document.querySelectorAll('.app-doi').forEach(n => { n.textContent = APP_DOI; });
});
