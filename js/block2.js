/* EconomicsPro — Block 2: the screen where the project is defined.

   It writes into the model of project.js and draws what comes back: the
   timeline of the horizon, the composition of the discount rate, what that
   rate does to the future, the coherence warnings and the summary sheet that
   the rest of the study will quote. Everything the user types is saved in the
   browser as it is typed, and can be taken out as a .json file that opens
   again on another computer. */

(function () {

  /* ================================================================
     the fields of the form, bound to the model in one table
     ================================================================
     'pct' fields are typed as a percentage and stored as a fraction, so no
     input is ever ambiguous: 4.5 in the box always means 4.5 %. */
  const FIELDS = [
    ['b2Name', 'name', 'text'],
    ['b2Owner', 'owner', 'text'],
    ['b2Location', 'location', 'text'],
    ['b2Unit', 'unitName', 'text'],
    ['b2Scale', 'scale', 'num'],
    ['b2Horizon', 'horizon', 'int'],
    ['b2BaseYear', 'baseYear', 'int'],
    ['b2Gestation', 'gestation', 'int'],
    ['b2Ramp', 'ramp', 'int'],
    ['b2Salvage', 'salvage', 'pct'],
    ['b2Inflation', 'inflation', 'pct'],
    ['b2Exchange', 'exchangeRate', 'num'],
    ['b2Foreign', 'usesForeign', 'check'],
    ['b2Premium', 'rate.riskPremium', 'pct'],
    ['b2Equity', 'rate.equity', 'num'],
    ['b2Debt', 'rate.debt', 'num'],
    ['b2Ke', 'rate.costEquity', 'pct'],
    ['b2Kd', 'rate.costDebt', 'pct'],
    ['b2Rf', 'rate.rf', 'pct'],
    ['b2Beta', 'rate.beta', 'num'],
    ['b2Mrp', 'rate.marketPremium', 'pct'],
    ['b2Country', 'rate.countryRisk', 'pct'],
    ['b2Manual', 'rate.manual', 'pct'],
    ['b2Isr', 'tax.income', 'pct'],
    ['b2PTU', 'tax.applyPTU', 'check'],
    ['b2Members', 'tax.members', 'int'],
    ['b2Uma', 'tax.umaDaily', 'num'],
    ['b2Vat', 'tax.vat', 'pct'],
    ['b2VatCred', 'tax.vatCreditable', 'check'],
    ['b2SocialRate', 'socialRate', 'pct'],
    ['b2Notes', 'notes', 'text'],
  ];

  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, v) {
    const ks = path.split('.');
    const last = ks.pop();
    const target = ks.reduce((o, k) => o[k], obj);
    target[last] = v;
  }

  let p = null;              /* the project being edited */
  let saveTimer = null;

  /* ---------------- reading and writing the form ---------------- */
  function readForm() {
    FIELDS.forEach(([id, path, kind]) => {
      const n = el(id);
      if (!n) return;
      if (kind === 'check') { setPath(p, path, n.checked); return; }
      const raw = n.value;
      if (kind === 'text') { setPath(p, path, raw); return; }
      const v = parseNum(raw);
      if (v == null) return;                       /* an empty box keeps the last value */
      if (kind === 'pct') setPath(p, path, v / 100);
      else if (kind === 'int') setPath(p, path, Math.round(v));
      else setPath(p, path, v);
    });
    const cur = el('b2Currency');
    if (cur) {
      p.currency = cur.value;
      p.symbol = (Project.CURRENCIES[cur.value] || { symbol: '$' }).symbol;
    }
    const reg = el('b2Regime');
    if (reg) p.tax.primaryRegime = reg.value;
  }

  function writeForm() {
    FIELDS.forEach(([id, path, kind]) => {
      const n = el(id);
      if (!n) return;
      /* never rewrite the box the user is typing in: "4." would lose its point
         and the cursor would jump back to the end */
      if (n === document.activeElement) return;
      const v = getPath(p, path);
      if (kind === 'check') n.checked = !!v;
      else if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else if (kind === 'text') n.value = v == null ? '' : v;
      else n.value = v == null ? '' : v;
    });
    const cur = el('b2Currency'); if (cur) cur.value = p.currency;
    const reg = el('b2Regime'); if (reg) reg.value = p.tax.primaryRegime;
    els('#b2Kinds .design-tile').forEach(t => t.classList.toggle('on', t.dataset.kind === p.kind));
    els('#b2Basis button').forEach(b => b.classList.toggle('on', b.dataset.basis === p.priceBasis));
    els('#b2RateTabs button').forEach(b => b.classList.toggle('on', b.dataset.mode === p.rate.mode));
    els('#b2ManualBasis button').forEach(b => b.classList.toggle('on', (b.dataset.real === '1') === !!p.rate.manualIsReal));
    els('.b2-rate-panel').forEach(n => n.classList.toggle('on', n.dataset.mode === p.rate.mode));
    const fx = el('b2ExchangeField'); if (fx) fx.style.display = p.usesForeign ? '' : 'none';
    const mem = el('b2MembersField'); if (mem) mem.style.display = p.tax.primaryRegime === 'moral' ? '' : 'none';
    const umaF = el('b2UmaField'); if (umaF) umaF.style.display = p.tax.primaryRegime === 'none' ? 'none' : '';
  }

  /* ---------------- the results ---------------- */
  function render() {
    Money.set(p.symbol, p.currency);
    const R = Project.rates(p);
    const msgs = Project.validate(p);
    state.project = p;
    state.rates = R;

    /* the rate, in three tiles */
    const tiles = el('b2RateTiles');
    if (tiles) {
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      tiles.innerHTML =
        tile(L2('Tasa nominal', 'Nominal rate'), fmtRate(R.nominal, 2), L2('incluye la inflación esperada', 'includes expected inflation')) +
        tile(L2('Tasa real', 'Real rate'), fmtRate(R.real, 2), L2('poder de compra constante', 'constant purchasing power')) +
        tile(L2('Tasa que usará el estudio', 'Rate the study will use'), fmtRate(R.used, 2),
          p.priceBasis === 'current' ? L2('precios corrientes → nominal', 'current prices → nominal') : L2('precios constantes → real', 'constant prices → real'), 'ok') +
        tile(L2('Un peso del último año', 'One peso of the final year'),
          fmtMoney(Math.pow(1 + (R.used || 0), -(Number(p.horizon) || 1)), 2),
          L2(`vale hoy, al año ${p.horizon}`, `is worth today, at year ${p.horizon}`));
    }
    const sent = el('b2RateSentence');
    if (sent) sent.innerHTML = `<b>${L2('Cómo se obtuvo', 'How it was obtained')}</b> ${L2(R.es, R.en)}`;

    /* the coherence messages */
    const box = el('b2Messages');
    if (box) {
      clearMessages(box);
      msgs.forEach(m => showMessage(box, m.level === 'error' ? 'error' : m.level === 'warning' ? 'warning' : 'info', L2(m.es, m.en)));
      if (!msgs.some(m => m.level === 'error' || m.level === 'warning')) {
        showMessage(box, 'success', L2('Los supuestos son coherentes entre sí.', 'The assumptions are coherent with one another.'));
      }
    }

    /* the summary sheet */
    const sum = el('b2Summary');
    if (sum) {
      const k = Project.KINDS[p.kind];
      const ex = Project.exemptIncome(p);
      const row = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
      sum.innerHTML = `<table class="mini-table">
        ${row(L2('Proyecto', 'Project'), esc(p.name || T('(sin nombre)', '(unnamed)')))}
        ${row(L2('Responsable y lugar', 'In charge and place'), esc([p.owner, p.location].filter(Boolean).join(' · ') || '—'))}
        ${row(L2('Tipo', 'Kind'), L2(k.es, k.en))}
        ${row(L2('Escala', 'Scale'), `${fmtNum(p.scale, 2)} ${esc(p.unitName)}`)}
        ${row(L2('Horizonte', 'Horizon'), L2(`${p.horizon} años (${p.baseYear}–${p.baseYear + p.horizon})`, `${p.horizon} years (${p.baseYear}–${p.baseYear + p.horizon})`))}
        ${row(L2('Entra en producción', 'Starts producing'), p.gestation > 0 ? L2(`año ${p.gestation + 1}; plena producción en el año ${p.gestation + p.ramp}`, `year ${p.gestation + 1}; full production in year ${p.gestation + p.ramp}`) : L2('desde el primer año', 'from the first year'))}
        ${row(L2('Valor residual', 'Residual value'), fmtPct(p.salvage, 0) + L2(' de la inversión', ' of the investment'))}
        ${row(L2('Moneda y precios', 'Currency and prices'), `${p.currency} (${p.symbol}) · ` + (p.priceBasis === 'current' ? L2('precios corrientes', 'current prices') : L2(`precios constantes de ${p.baseYear}`, `constant prices of ${p.baseYear}`)))}
        ${row(L2('Inflación esperada', 'Expected inflation'), fmtPct(p.inflation, 2))}
        ${row(L2('Tasa de descuento', 'Discount rate'), `<b>${fmtRate(R.used, 2)}</b> · ` + L2(`${fmtRate(R.nominal, 2)} nominal, ${fmtRate(R.real, 2)} real`, `${fmtRate(R.nominal, 2)} nominal, ${fmtRate(R.real, 2)} real`))}
        ${row(L2('Impuesto sobre la renta', 'Income tax'), fmtPct(p.tax.income, 0) + (p.tax.applyPTU ? L2(` + PTU ${fmtPct(p.tax.ptu, 0)}`, ` + profit sharing ${fmtPct(p.tax.ptu, 0)}`) : ''))}
        ${row(L2('Exención del sector primario', 'Primary sector exemption'), ex.amount > 0 ? `${fmtMoney(ex.amount, 0)} ${L2('al año', 'a year')} (${ex.umas} UMA)` : L2('no aplica', 'does not apply'))}
        ${row(L2('IVA', 'VAT'), fmtPct(p.tax.vat, 0) + ' · ' + (p.tax.vatCreditable ? L2('acreditable', 'creditable') : L2('no acreditable, entra al costo', 'not creditable, it enters the cost')))}
        ${row(L2('Tasa social de descuento', 'Social discount rate'), fmtPct(p.socialRate, 2) + L2(' (Bloque 8)', ' (Block 8)'))}
      </table>`;
    }

    /* the figures */
    Plots2.drawTimeline(el('b2Timeline'), p);
    Plots2.drawRateChart(el('b2RateChart'), R);
    Plots2.drawDiscountChart(el('b2DiscountChart'), R, p);

    /* the rest of the app can move on when nothing is broken */
    const ok = !Project.hasErrors(msgs);
    const next = el('b2Next');
    if (next) next.disabled = !ok;
    document.dispatchEvent(new CustomEvent('projectchange', { detail: { project: p, rates: R, valid: ok } }));
  }

  /* ---------------- saving ---------------- */
  function touch() {
    readForm();
    writeForm();
    render();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const at = Project.save(p);
      const n = el('b2SavedAt');
      if (n && at) {
        const d = new Date(at);
        n.innerHTML = L2(`Guardado en este navegador a las ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
          `Saved in this browser at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`);
      }
    }, 500);
  }

  function exportJSON() {
    readForm();
    const at = Project.save(p);
    download(JSON.stringify(Object.assign({}, p, { savedAt: at }), null, 2), slug(p.name || 'proyecto') + '-economicspro.json', 'application/json');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        p = Project.merge(Project.defaults(), JSON.parse(reader.result));
        writeForm();
        render();
        Project.save(p);
        showMessage(el('b2Messages'), 'success', L2('Proyecto abierto desde el archivo.', 'Project opened from the file.'));
      } catch (e) {
        clearMessages(el('b2Messages'));
        showMessage(el('b2Messages'), 'error', L2('El archivo no es un proyecto de EconomicsPro válido.', 'The file is not a valid EconomicsPro project.'));
      }
    };
    reader.readAsText(file);
  }

  function applyExample(key) {
    const ex = Project.EXAMPLES[key];
    if (!ex) return;
    p = Project.merge(Project.defaults(), ex.patch);
    p.owner = p.owner || T('Nombre del productor o la empresa', 'Name of the grower or the company');
    writeForm();
    touch();
    clearMessages(el('b2Messages'));
    render();
  }

  /* ---------------- building the screen ---------------- */
  function buildKinds() {
    const g = el('b2Kinds');
    if (!g) return;
    g.innerHTML = Object.keys(Project.KINDS).map(k => {
      const K = Project.KINDS[k];
      return `<button class="design-tile" data-kind="${k}">${Art[K.art] ? Art[K.art]() : ''}<b>${L2(K.es, K.en)}</b><small>${L2(`${K.horizon} años · primera producción en el año ${K.gestation + 1}`, `${K.horizon} years · first production in year ${K.gestation + 1}`)}</small></button>`;
    }).join('');
    g.addEventListener('click', e => {
      const b = e.target.closest('.design-tile');
      if (!b) return;
      const K = Project.KINDS[b.dataset.kind];
      p.kind = b.dataset.kind;
      /* the assumptions that depend on the kind of project follow it, unless
         the user has already moved them by hand */
      p.horizon = K.horizon; p.gestation = K.gestation; p.ramp = K.ramp; p.salvage = K.salvage;
      p.unitName = T(K.unit[0], K.unit[1]);
      writeForm();
      touch();
    });
  }

  function buildCurrencies() {
    const s = el('b2Currency');
    if (!s) return;
    s.innerHTML = Object.keys(Project.CURRENCIES).map(c => {
      const C = Project.CURRENCIES[c];
      return `<option value="${c}" data-es="${c} — ${C.es} (${C.symbol})" data-en="${c} — ${C.en} (${C.symbol})">${c} — ${C.es} (${C.symbol})</option>`;
    }).join('');
    const ex = el('b2Example');
    if (ex) {
      /* two kinds of example: the quick ones, which only fill this sheet, and
         the three practice databases, which bring a whole study with them */
      const quick = Object.keys(Project.EXAMPLES).map(k =>
        `<option value="${k}" data-es="${Project.EXAMPLES[k].es}" data-en="${Project.EXAMPLES[k].en}">${Project.EXAMPLES[k].es}</option>`).join('');
      const full = typeof Practice === 'undefined' ? '' : Object.keys(Practice.CASES).map(k =>
        `<option value="practice:${k}" data-es="${Practice.CASES[k].es}" data-en="${Practice.CASES[k].en}">${Practice.CASES[k].es}</option>`).join('');
      ex.innerHTML = `<option value="" data-es="Cargar un ejemplo…" data-en="Load an example…">Cargar un ejemplo…</option>` +
        `<optgroup label="Solo esta ficha" data-es="Solo esta ficha" data-en="This sheet only">${quick}</optgroup>` +
        (full ? `<optgroup label="Bases de datos completas" data-es="Bases de datos completas (los diez bloques)" data-en="Complete databases (all ten blocks)">${full}</optgroup>` : '');
    }
    I18N.apply(el('panel-2'));
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    ['b2Currency', 'b2Regime'].forEach(id => { const n = el(id); if (n) n.addEventListener('change', touch); });
    const basis = el('b2Basis');
    if (basis) basis.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      p.priceBasis = b.dataset.basis; writeForm(); touch();
    });
    const tabs = el('b2RateTabs');
    if (tabs) tabs.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      p.rate.mode = b.dataset.mode; writeForm(); touch();
    });
    const mb = el('b2ManualBasis');
    if (mb) mb.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      p.rate.manualIsReal = b.dataset.real === '1'; writeForm(); touch();
    });
    const ex = el('b2Example');
    if (ex) ex.addEventListener('change', () => {
      if (!ex.value) return;
      if (ex.value.startsWith('practice:')) {
        /* a whole database: every block reloads from it */
        const key = ex.value.slice(9);
        Practice.load(key);
        notice(el('b2Messages'), 'success', L2(
          `Cargada la base de datos de práctica «${Practice.CASES[key].es}»: los diez bloques ya traen sus datos. Las cifras son ficticias.`,
          `The practice database "${Practice.CASES[key].en}" is loaded: all ten blocks now carry its data. The figures are fictional.`));
      } else applyExample(ex.value);
      ex.value = '';
    });
    const save = el('b2Save'); if (save) save.addEventListener('click', exportJSON);
    const open = el('b2Open'); if (open) open.addEventListener('click', () => el('b2File').click());
    const file = el('b2File');
    if (file) file.addEventListener('change', () => { if (file.files[0]) importJSON(file.files[0]); file.value = ''; });
    const reset = el('b2Reset');
    if (reset) reset.addEventListener('click', () => {
      p = Project.defaults();
      Project.clear();
      writeForm(); touch();
    });
    const next = el('b2Next');
    if (next) next.addEventListener('click', () => {
      const btn = document.querySelector('.step-btn[data-step="3"]');
      if (btn && !btn.disabled) goStep(3);
      else {
        clearMessages(el('b2Messages'));
        showMessage(el('b2Messages'), 'info', L2('El Bloque 3 (mercado, precios e ingresos) se construye en la siguiente etapa. Tu proyecto ya quedó guardado y lo tomará tal cual.',
          'Block 3 (market, prices and revenue) is built in the next stage. Your project is already saved and it will be picked up as it is.'));
        el('b2Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    /* the figures and the texts carry translated labels */
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { p = state.project; buildKinds(); writeForm(); render(); });
    document.addEventListener('langchange', () => { buildKinds(); writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  function init() {
    if (!el('panel-2')) return;
    p = Project.load() || Project.defaults();
    buildKinds();
    buildCurrencies();
    wire();
    writeForm();
    render();
    const n = el('b2SavedAt');
    if (n && p.savedAt) {
      const d = new Date(p.savedAt);
      n.innerHTML = L2(`Recuperado de este navegador (guardado el ${d.toLocaleDateString('es-MX')})`, `Recovered from this browser (saved on ${d.toLocaleDateString('en-GB')})`);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block2 = { get project() { return p; }, render, applyExample, readForm, writeForm };
})();
