/* EconomicsPro — Block 9: the screen of comparison and decisions.

   The project of the previous blocks arrives here as one more alternative, with
   its real flow, and next to it go the others the user wants to weigh against
   it. Then the four decisions that come after the appraisal: which one, with a
   limited budget, when to replace the machine and when to cut the plantation. */

(function () {

  const G = {};
  let saveTimer = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.decisions) state.project.decisions = Project.defaults().decisions;
    return state.project;
  }
  const D = () => P().decisions;

  const FIELDS = [
    ['b9Rate', 'rate', 'pct'],
    ['b9Budget', 'budget', 'num'],
    ['b9MachineCost', 'machineCost', 'num'],
    ['b9MachineDecline', 'machineDecline', 'pct'],
    ['b9MachineFloor', 'machineFloor', 'pct'],
    ['b9MachineRunning', 'machineRunning', 'num'],
    ['b9MachineRise', 'machineRise', 'pct'],
    ['b9MachineMax', 'machineMax', 'int'],
    ['b9Establish', 'establish', 'num'],
    ['b9Annual', 'annual', 'num'],
    ['b9LeaseCost', 'leaseCost', 'num'],
    ['b9LeaseLife', 'leaseLife', 'int'],
    ['b9LeaseSalvage', 'leaseSalvage', 'num'],
    ['b9LeaseMaintenance', 'leaseMaintenance', 'num'],
    ['b9LeasePayment', 'leasePayment', 'num'],
    ['b9LeaseIncluded', 'leaseIncluded', 'num'],
  ];

  function readForm() {
    const d = D();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (n.value.trim() === '') { d[key] = key === 'rate' ? null : d[key]; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      d[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }
  function writeForm() {
    const d = D();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = d[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
  }

  /* ================================================================
     the calculation
     ================================================================ */
  function compute() {
    const p = P(), d = D();
    const ap = state.appraisal || (window.Block6 ? Block6.compute() : null);
    const rate = d.rate != null && d.rate !== '' ? Number(d.rate) : (ap ? ap.rateProject : Project.rates(p).used);

    /* the project of the study comes in first, with its own flow */
    const list = [];
    if (ap && ap.flows && ap.flows.project && d.includeProject !== false) {
      list.push({ name: p.name || T('Este proyecto', 'This project'), flow: ap.flows.project });
    }
    (d.alternatives || []).forEach(a => {
      list.push({
        name: a.name, investment: parseNum(a.investment), net: parseNum(a.net),
        horizon: parseNum(a.horizon), salvage: parseNum(a.salvage), growth: (parseNum(a.growth) || 0) / 100,
      });
    });
    const alternatives = Decide.appraise(list, rate);

    /* the two the user wants to weigh against each other */
    let comparison = null;
    if (alternatives.length >= 2) {
      const a = alternatives[Math.min(Number(d.compareA) || 0, alternatives.length - 1)];
      const b = alternatives[Math.min(Number(d.compareB) == null ? 1 : Number(d.compareB), alternatives.length - 1)];
      if (a !== b) comparison = Decide.compare(a, b, rate);
    }

    const model = {
      rate, alternatives, comparison,
      rationing: Decide.rationing(list, d.budget, rate),
      replacement: Decide.replacement({
        cost: d.machineCost, decline: d.machineDecline, floorValue: d.machineFloor,
        running: d.machineRunning, rise: d.machineRise, maxLife: d.machineMax, rate,
      }),
      rotation: Decide.rotation({ establish: d.establish, annual: d.annual, rate, options: d.rotations || [] }),
      buyOrLease: Decide.buyOrLease({
        cost: d.leaseCost, life: d.leaseLife, salvage: d.leaseSalvage, maintenance: d.leaseMaintenance,
        lease: d.leasePayment, leaseMaintenance: d.leaseIncluded, rate, tax: Number(p.tax.income) || 0,
      }),
    };
    model.messages = Decide.validate(model, rate);
    state.decisions = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  function render() {
    const p = P(), d = D();
    const m = compute();

    const ctx = el('b9Context');
    if (ctx) {
      ctx.innerHTML = [
        [L2('Tasa de comparación', 'Comparison rate'), fmtPct(m.rate, 2)],
        [L2('Alternativas', 'Alternatives'), String(m.alternatives.length)],
        [L2('Presupuesto', 'Budget'), d.budget ? fmtMoney(d.budget, 0) : '—'],
      ].map(([a, b]) => `<span class="chip p">${a}: <b>${b}</b></span>`).join(' ');
    }

    renderAlternatives(m);
    renderComparison(m);
    renderRationing(m);
    renderReplacement(m);
    renderRotation(m);
    renderLease(m);

    Plots9.drawCompare(el('b9CompareChart'), m.alternatives, m.rate, m.comparison);
    Plots9.drawRationing(el('b9RationingChart'), m.rationing);
    Plots9.drawReplacement(el('b9ReplacementChart'), m.replacement);
    Plots9.drawRotation(el('b9RotationChart'), m.rotation);

    const box = el('b9Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (m.alternatives.length < 2) {
        showMessage(box, 'info', L2('Captura al menos dos alternativas para que la comparación tenga algo que decir.', 'Enter at least two alternatives for the comparison to have something to say.'));
      }
    }
    const next = el('b9Next');
    if (next) next.disabled = false;
    document.dispatchEvent(new CustomEvent('decisionschange', { detail: { decisions: m } }));
  }

  function renderAlternatives(m) {
    const host = el('b9Alternatives');
    if (!host) return;
    if (!m.alternatives.length) { host.innerHTML = `<p class="hint">${L2('Todavía no hay alternativas que comparar.', 'There are no alternatives to compare yet.')}</p>`; return; }
    const bestNpv = m.alternatives.slice().sort((a, b) => b.npv - a.npv)[0];
    const bestEaa = m.alternatives.slice().sort((a, b) => b.eaa - a.eaa)[0];
    const sameHorizon = new Set(m.alternatives.map(a => a.horizon)).size === 1;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Alternativa', 'Alternative')}</th>
      <th class="num">${L2('Inversión', 'Investment')}</th>
      <th class="num">${L2('Horizonte', 'Horizon')}</th>
      <th class="num">${L2('VAN', 'NPV')}</th>
      <th class="num">${L2('TIR', 'IRR')}</th>
      <th class="num">${L2('Índice de rentabilidad', 'Profitability index')}</th>
      <th class="num">${sameHorizon ? L2('VAE', 'EAV') : `<b>${L2('VAE', 'EAV')}</b> ←`}</th>
      <th class="num">${L2('Recuperación', 'Payback')}</th>
    </tr></thead><tbody>`;
    m.alternatives.forEach(a => {
      html += `<tr${a === bestEaa ? ' class="row-best"' : ''}>
        <td>${esc(a.name || '—')}${a === bestNpv ? ` <span class="chip p">${L2('mejor VAN', 'best NPV')}</span>` : ''}${a === bestEaa && a !== bestNpv ? ` <span class="chip a">${L2('mejor VAE', 'best EAV')}</span>` : ''}</td>
        <td class="num">${fmtMoney(a.investment, 0)}</td>
        <td class="num">${a.horizon} ${L2('años', 'years')}</td>
        <td class="num"><b>${fmtMoney(a.npv, 0)}</b></td>
        <td class="num">${fmtRate(a.irr, 1)}</td>
        <td class="num">${a.pi == null ? '—' : fmtFixed(a.pi, 2)}</td>
        <td class="num"><b>${fmtMoney(a.eaa, 0)}</b></td>
        <td class="num">${a.discountedPayback == null ? '—' : fmtFixed(a.discountedPayback, 1)}</td>
      </tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
    /* the two to compare: the selects always show what the model is using */
    const d = D(), n = m.alternatives.length;
    [['b9CompareA', 'compareA', 0], ['b9CompareB', 'compareB', 1]].forEach(([id, key, fallback]) => {
      const sel = el(id);
      if (!sel) return;
      let i = Number(d[key]);
      if (!isFinite(i) || i < 0 || i >= n) i = Math.min(fallback, n - 1);
      sel.innerHTML = m.alternatives.map((a, j) => `<option value="${j}">${esc(a.name || String(j + 1))}</option>`).join('');
      sel.value = String(i);
    });
  }

  function renderComparison(m) {
    const host = el('b9Comparison');
    if (!host) return;
    const c = m.comparison;
    if (!c) { host.innerHTML = `<p class="hint">${L2('Elige dos alternativas distintas para compararlas.', 'Choose two different alternatives to compare them.')}</p>`; return; }
    const inc = c.incrementalIRR;
    host.innerHTML = L2(
      `«${esc(c.large.name || '')}» pide ${fmtMoney(c.extraInvestment, 0)} más que «${esc(c.small.name || '')}». Ese dinero adicional rinde ${inc == null ? 'una tasa que no existe (los flujos de la diferencia no cambian de signo)' : `<b>${fmtPct(inc, 2)}</b>`}: ${inc == null ? 'compara los VAN directamente' : `mientras tu tasa esté por debajo de ${fmtPct(inc, 2)} conviene la alternativa más cara; por encima, la más barata`}. A tu tasa de ${fmtPct(m.rate, 2)} gana <b>${esc(c.winner.name || '')}</b>.${c.sameHorizon ? '' : ' <b>Ojo:</b> duran distinto, así que la comparación por VAN no basta; mira el valor anual equivalente.'}`,
      `"${esc(c.large.name || '')}" asks for ${fmtMoney(c.extraInvestment, 0)} more than "${esc(c.small.name || '')}". That extra money returns ${inc == null ? 'a rate that does not exist (the flows of the difference never change sign)' : `<b>${fmtPct(inc, 2)}</b>`}: ${inc == null ? 'compare the NPVs directly' : `as long as your rate is below ${fmtPct(inc, 2)} the dearer alternative wins; above it, the cheaper one`}. At your rate of ${fmtPct(m.rate, 2)} the winner is <b>${esc(c.winner.name || '')}</b>.${c.sameHorizon ? '' : ' <b>Careful:</b> they last for different times, so comparing NPVs is not enough; look at the equivalent annual value.'}`);
  }

  function renderRationing(m) {
    const host = el('b9Rationing');
    if (!host) return;
    const r = m.rationing;
    if (!r.items.length || !(r.budget > 0)) {
      host.innerHTML = `<p class="hint">${L2('Escribe un presupuesto para ver qué paquete cabe en él.', 'Type a budget to see which package fits in it.')}</p>`;
      return;
    }
    const names = list => list.map(a => esc(a.name || String(a.i + 1))).join(', ') || '—';
    /* the two amounts need a heading of their own: without it nobody can tell
       which column is the money spent and which the value it brings */
    host.innerHTML = `<table class="mini-table"><thead><tr>
      <th>${L2("Regla", "Rule")}</th><th>${L2("Qué se toma", "What is taken")}</th>
      <th class="num">${L2("Inversión", "Investment")}</th><th class="num">${L2("VAN del paquete", "NPV of the package")}</th>
    </tr></thead><tbody>
      <tr><td>${L2('Por índice de rentabilidad', 'By profitability index')}</td>
        <td>${names(r.greedy)}</td>
        <td class="num">${fmtMoney(r.greedyCost, 0)}</td>
        <td class="num"><b>${fmtMoney(r.greedyNpv, 0)}</b></td></tr>
      ${r.best ? `<tr class="row-best"><td>${L2('El mejor paquete posible', 'The best possible package')}</td>
        <td>${names(r.best.pick)}</td>
        <td class="num">${fmtMoney(r.best.cost, 0)}</td>
        <td class="num"><b>${fmtMoney(r.best.npv, 0)}</b></td></tr>` : ''}
      ${r.loss != null && r.loss > 1 ? `<tr><td colspan="4" class="hint">${L2(
      `La regla de dedo deja ${fmtMoney(r.loss, 0)} de VAN sin tomar: con presupuesto limitado, el orden por índice de rentabilidad no siempre da el mejor paquete, porque no puede partir un proyecto a la mitad.`,
      `The rule of thumb leaves ${fmtMoney(r.loss, 0)} of NPV untaken: under a limited budget, ranking by profitability index does not always give the best package, because a project cannot be cut in half.`)}</td></tr>` : ''}
    </tbody></table>`;
  }

  function renderReplacement(m) {
    const host = el('b9Replacement');
    if (!host) return;
    const r = m.replacement;
    if (!r.rows.length) { host.innerHTML = ''; return; }
    let html = `<table class="mini-table"><thead><tr>
      <th class="num">${L2('Años', 'Years')}</th>
      <th class="num">${L2('Valor de reventa', 'Resale value')}</th>
      <th class="num">${L2('Parte de capital', 'Capital part')}</th>
      <th class="num">${L2('Parte de operación', 'Running part')}</th>
      <th class="num">${L2('Costo anual equivalente', 'Equivalent annual cost')}</th>
    </tr></thead><tbody>`;
    r.rows.forEach(x => {
      html += `<tr${x === r.best ? ' class="row-best"' : ''}>
        <td class="num">${x.n}</td>
        <td class="num">${fmtMoney(x.salvage, 0)}</td>
        <td class="num">${fmtMoney(x.capital, 0)}</td>
        <td class="num">${fmtMoney(x.running, 0)}</td>
        <td class="num"><b>${fmtMoney(x.eac, 0)}</b>${x === r.best ? ` <span class="chip p">${L2('mínimo', 'lowest')}</span>` : ''}</td></tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderRotation(m) {
    const host = el('b9Rotation');
    if (!host) return;
    const r = m.rotation;
    if (!r.rows.length) { host.innerHTML = `<p class="hint">${L2('Escribe al menos dos turnos posibles con lo que se cosecharía en cada uno.', 'Type at least two possible rotations with what would be harvested in each.')}</p>`; return; }
    let html = `<table class="mini-table"><thead><tr>
      <th class="num">${L2('Turno (años)', 'Rotation (years)')}</th>
      <th class="num">${L2('Cosecha', 'Harvest')}</th>
      <th class="num">${L2('Cosecha por año', 'Harvest per year')}</th>
      <th class="num">${L2('VAN de una rotación', 'NPV of one rotation')}</th>
      <th class="num">${L2('Valor de la tierra', 'Land expectation value')}</th>
    </tr></thead><tbody>`;
    r.rows.forEach(x => {
      html += `<tr${x === r.best ? ' class="row-best"' : ''}>
        <td class="num">${x.years}</td>
        <td class="num">${fmtMoney(x.harvest, 0)}</td>
        <td class="num">${fmtMoney(x.perYear, 0)}</td>
        <td class="num">${fmtMoney(x.npv, 0)}${x === r.bestNpv ? ` <span class="chip a">${L2('máximo', 'highest')}</span>` : ''}</td>
        <td class="num"><b>${fmtMoney(x.lev, 0)}</b>${x === r.best ? ` <span class="chip p">${L2('turno óptimo', 'optimal')}</span>` : ''}</td></tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderLease(m) {
    const host = el('b9Lease');
    if (!host) return;
    const b = m.buyOrLease;
    if (!(b.pvBuy > 0 || b.pvLease > 0)) { host.innerHTML = ''; return; }
    /* the two amounts are a present value and an annual cost: without a heading
       they look like the same thing written twice */
    host.innerHTML = `<table class="mini-table"><thead><tr>
      <th>${L2("Opción", "Option")}</th>
      <th class="num">${L2("Valor presente del costo", "Present value of the cost")}</th>
      <th class="num">${L2("Costo anual equivalente", "Equivalent annual cost")}</th>
    </tr></thead><tbody>
      <tr><td>${L2('Comprar', 'Buy')}</td><td class="num">${fmtMoney(b.pvBuy, 0)}</td>
        <td class="num"><b>${fmtMoney(b.eacBuy, 0)}</b> ${L2('al año', 'a year')}</td></tr>
      <tr><td>${L2('Arrendar', 'Lease')}</td><td class="num">${fmtMoney(b.pvLease, 0)}</td>
        <td class="num"><b>${fmtMoney(b.eacLease, 0)}</b> ${L2('al año', 'a year')}</td></tr>
      <tr class="total-row"><td>${L2('Conviene', 'Better')}</td>
        <td colspan="2"><b>${b.best === 'buy' ? L2('comprar', 'buying') : L2('arrendar', 'leasing')}</b> ${L2(
      `por ${fmtMoney(Math.abs(b.difference), 0)} de valor presente`, `by ${fmtMoney(Math.abs(b.difference), 0)} of present value`)}</td></tr>
    </tbody></table>`;
  }

  /* ================================================================
     saving, examples and export
     ================================================================ */
  function touch() {
    readForm();
    writeForm();
    render();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Project.save(P()), 500);
  }

  function loadExample() {
    const d = D();
    d.alternatives = [
      { name: 'Riego por goteo', investment: '2600000', net: '520000', horizon: '15', salvage: '260000', growth: '0' },
      { name: 'Riego por aspersión', investment: '1400000', net: '300000', horizon: '10', salvage: '140000', growth: '0' },
      { name: 'Nivelación de tierras', investment: '800000', net: '165000', horizon: '12', salvage: '0', growth: '0' },
    ];
    d.budget = 3000000;
    d.rotations = [
      { years: '6', harvest: '600000' }, { years: '8', harvest: '900000' },
      { years: '10', harvest: '1200000' }, { years: '12', harvest: '1450000' }, { years: '14', harvest: '1650000' },
    ];
    d.establish = 160000; d.annual = 14000;
    if (G.alternatives) G.alternatives.set(d.alternatives);
    if (G.rotations) G.rotations.set(d.rotations);
    writeForm();
    touch();
    notice(el('b9Messages'), 'info', L2(
      'Ejemplo cargado: tres obras de riego que se excluyen entre sí y una plantación con cinco turnos posibles. Las cifras son ilustrativas.',
      'Example loaded: three irrigation works that exclude one another and a plantation with five possible rotations. The figures are illustrative.'));
  }

  function exportCSV() {
    const m = state.decisions, p = P();
    if (!m) return;
    const lines = ['alternativa,inversion,horizonte,van,tir,indice_de_rentabilidad,valor_anual_equivalente'];
    m.alternatives.forEach(a => lines.push([a.name, a.investment, a.horizon, a.npv, a.irr, a.pi, a.eaa].map(csvEscape).join(',')));
    if (m.replacement.rows.length) {
      lines.push('');
      lines.push('anos_que_se_conserva,valor_de_reventa,costo_anual_equivalente');
      m.replacement.rows.forEach(x => lines.push([x.n, x.salvage, x.eac].map(csvEscape).join(',')));
    }
    if (m.rotation.rows.length) {
      lines.push('');
      lines.push('turno,cosecha,van_de_una_rotacion,valor_de_la_tierra');
      m.rotation.rows.forEach(x => lines.push([x.years, x.harvest, x.npv, x.lev].map(csvEscape).join(',')));
    }
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-decisiones.csv', 'text/csv;charset=utf-8');
  }

  function buildGrids() {
    const d = D();
    G.alternatives = Import.grid(el('b9AltGrid'), {
      cols: [
        { key: 'name', es: 'Alternativa', en: 'Alternative', wide: true },
        { key: 'investment', es: 'Inversión', en: 'Investment' },
        { key: 'net', es: 'Flujo neto al año', en: 'Net flow a year' },
        { key: 'horizon', es: 'Horizonte', en: 'Horizon' },
        { key: 'salvage', es: 'Valor de rescate', en: 'Salvage value' },
        { key: 'growth', es: 'Crecimiento anual (%)', en: 'Annual growth (%)' },
      ],
      rows: Math.max(3, (d.alternatives || []).length + 1),
      values: d.alternatives || [],
      onchange: v => { D().alternatives = v; touch(); },
    });
    G.rotations = Import.grid(el('b9RotationGrid'), {
      cols: [
        { key: 'years', es: 'Turno (años)', en: 'Rotation (years)' },
        { key: 'harvest', es: 'Ingreso de la cosecha', en: 'Harvest revenue' },
      ],
      rows: Math.max(4, (d.rotations || []).length + 1),
      values: d.rotations || [],
      onchange: v => { D().rotations = v; touch(); },
    });
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    ['b9CompareA', 'b9CompareB'].forEach((id, k) => on(id, 'change', () => {
      const d = D();
      if (k === 0) d.compareA = Number(el(id).value); else d.compareB = Number(el(id).value);
      touch();
    }));
    on('b9Example', 'click', loadExample);
    on('b9AddAlt', 'click', () => G.alternatives && G.alternatives.addRows(3));
    on('b9AddRot', 'click', () => G.rotations && G.rotations.addRows(3));
    on('b9ExportCSV', 'click', exportCSV);
    on('b9Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="10"]');
      if (btn && !btn.disabled) goStep(10);
      else {
        clearMessages(el('b9Messages'));
        showMessage(el('b9Messages'), 'info', L2('El Bloque 10 (figuras e informe) se construye en la siguiente etapa.',
          'Block 10 (figures and report) is built in the next stage.'));
        el('b9Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    ['projectchange', 'appraisalchange'].forEach(ev =>
      document.addEventListener(ev, () => { if (el('panel-9')) render(); }));
    document.addEventListener('projectloaded', () => { buildGrids(); writeForm(); render(); });
    document.addEventListener('langchange', () => { buildGrids(); writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  function init() {
    if (!el('panel-9')) return;
    P();
    buildGrids();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block9 = { compute, render, loadExample };
})();
