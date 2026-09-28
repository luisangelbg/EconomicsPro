/* EconomicsPro — Block 7: the screen of risk and uncertainty.

   The project of the previous blocks, put through the three levels a study
   has to report: sensitivity (one variable at a time, and the switching
   value of each), scenarios (three states of the world with their
   probabilities) and simulation (all the variables at once, with the
   correlation between price and yield). Everything is computed on the flow of
   the project, without financing. */

(function () {

  let gScen = null, saveTimer = null, lastSim = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.risk) state.project.risk = Project.defaults().risk;
    return state.project;
  }
  const R = () => P().risk;

  const FIELDS = [
    ['b7Delta', 'delta', 'pct'],
    ['b7VarA', 'varA', 'text'],
    ['b7VarB', 'varB', 'text'],
    ['b7Dist', 'dist', 'text'],
    ['b7SimPrice', 'simPrice', 'pct'],
    ['b7SimYield', 'simYield', 'pct'],
    ['b7SimCost', 'simCost', 'pct'],
    ['b7SimInvest', 'simInvest', 'pct'],
    ['b7Corr', 'corr', 'num'],
    ['b7Runs', 'runs', 'int'],
    ['b7TreeProb', 'treeProbability', 'pct'],
  ];

  function readForm() {
    const r = R();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (kind === 'text') { r[key] = n.value; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      r[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }
  function writeForm() {
    const r = R();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = r[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
  }

  /* ================================================================
     the calculation
     ================================================================ */
  function compute(withSim) {
    const p = P(), r = R();
    const st = state.statements || (window.Block5 ? Block5.compute() : null);
    const budget = state.budget || (window.Block4 ? Block4.compute() : null);
    const market = state.market || (window.Block3 ? Block3.compute() : null);
    const ap = state.appraisal || (window.Block6 ? Block6.compute() : null);
    if (!st || !budget) return null;

    const base = Risk.baseline(p, market, budget, Object.assign({}, st, { rateProject: ap ? ap.rateProject : Project.rates(p).used }));
    const npv0 = Risk.npvOf(base, {});
    const changes = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
    const model = {
      base, npv0,
      spider: Risk.spider(base, changes),
      switching: Risk.switching(base),
      tornado: Risk.tornado(base, r.delta == null ? 0.1 : r.delta),
      grid: Risk.grid2(base, r.varA || 'price', r.varB || 'yield', [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]),
      scenarios: Risk.scenarios(base, (r.scenarios || []).map(s => ({
        name: s.name, probability: parseNum(s.probability) == null ? 0 : parseNum(s.probability) / 100,
        price: parseNum(s.price) == null ? null : parseNum(s.price) / 100,
        yield: parseNum(s.yield) == null ? null : parseNum(s.yield) / 100,
        cost: parseNum(s.cost) == null ? null : parseNum(s.cost) / 100,
        invest: parseNum(s.invest) == null ? null : parseNum(s.invest) / 100,
      }))),
      spec: {
        dist: r.dist || 'triangular', corr: r.corr == null ? -0.3 : r.corr, n: r.runs || 2000,
        price: { spread: r.simPrice == null ? 0.25 : r.simPrice },
        yield: { spread: r.simYield == null ? 0.2 : r.simYield },
        cost: { spread: r.simCost == null ? 0.12 : r.simCost },
        invest: { spread: r.simInvest == null ? 0.1 : r.simInvest },
      },
    };
    /* the simulation only runs when it is asked for: it is the one part of the
       app that takes a noticeable moment */
    model.sim = withSim ? Risk.simulate(base, model.spec) : lastSim;
    lastSim = model.sim;
    /* the decision tree reads the two extreme scenarios */
    const good = model.scenarios.list.find(s => /optimista|optimistic/i.test(s.name || '')) || model.scenarios.list[model.scenarios.list.length - 1];
    const bad = model.scenarios.list.find(s => /pesimista|pessimistic/i.test(s.name || '')) || model.scenarios.list[0];
    model.tree = Risk.decisionTree({
      probability: r.treeProbability == null ? 0.5 : r.treeProbability,
      npvGood: good ? good.npv : npv0, npvBad: bad ? bad.npv : npv0, rate: base.rate,
    });
    model.messages = Risk.validate(model, p);
    state.risk = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  function render(withSim) {
    const p = P();
    const m = compute(withSim);
    if (!m) return;

    const tiles = el('b7Tiles');
    if (tiles) {
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      const tight = m.switching.find(s => s.change != null);
      tiles.innerHTML =
        tile(L2('VAN del proyecto', 'NPV of the project'), fmtMoney(m.npv0, 0),
          L2(`a la tasa de ${fmtPct(m.base.rate, 2)}`, `at a rate of ${fmtPct(m.base.rate, 2)}`), m.npv0 > 0 ? 'ok' : 'bad') +
        tile(L2('La variable más delicada', 'The most delicate variable'), tight ? L2(tight.es, tight.en) : '—',
          tight && tight.change != null ? L2(`aguanta ${fmtPct(Math.abs(tight.change), 1)}`, `takes ${fmtPct(Math.abs(tight.change), 1)}`) : '', 'warn') +
        tile(L2('VAN esperado (escenarios)', 'Expected NPV (scenarios)'),
          m.scenarios.expected == null ? '—' : fmtMoney(m.scenarios.expected, 0),
          m.scenarios.pLoss == null ? '' : L2(`probabilidad de pérdida ${fmtPct(m.scenarios.pLoss, 0)}`, `probability of a loss ${fmtPct(m.scenarios.pLoss, 0)}`),
          m.scenarios.expected != null && m.scenarios.expected > 0 ? 'ok' : m.scenarios.expected == null ? '' : 'bad') +
        tile(L2('VAN esperado (simulación)', 'Expected NPV (simulation)'), m.sim ? fmtMoney(m.sim.mean, 0) : '—',
          m.sim ? L2(`${m.sim.n} corridas`, `${m.sim.n} runs`) : L2('sin simular todavía', 'not simulated yet'),
          m.sim ? (m.sim.mean > 0 ? 'ok' : 'bad') : '') +
        tile(L2('P(VAN < 0)', 'P(NPV < 0)'), m.sim ? fmtPct(m.sim.pLoss, 1) : '—',
          m.sim ? L2('según la simulación', 'according to the simulation') : '',
          m.sim ? (m.sim.pLoss < 0.1 ? 'ok' : m.sim.pLoss < 0.3 ? 'warn' : 'bad') : '') +
        tile(L2('Decisión por etapas', 'Staged decision'), m.tree.best === 'wait' ? L2('esperar', 'wait') : L2('invertir ahora', 'invest now'),
          L2(`valor de esperar ${fmtMoney(m.tree.option, 0)}`, `value of waiting ${fmtMoney(m.tree.option, 0)}`), m.tree.best === 'wait' ? 'warn' : 'ok');
    }

    renderSwitching(m);
    renderScenarios(m);
    renderSim(m);
    Plots7.drawSpider(el('b7SpiderChart'), m.spider);
    Plots7.drawTornado(el('b7TornadoChart'), m.tornado, m.npv0);
    Plots7.drawHeat(el('b7HeatChart'), m.grid, {
      a: T((Risk.VARS.find(v => v.key === m.grid.keyA) || {}).es, (Risk.VARS.find(v => v.key === m.grid.keyA) || {}).en),
      b: T((Risk.VARS.find(v => v.key === m.grid.keyB) || {}).es, (Risk.VARS.find(v => v.key === m.grid.keyB) || {}).en),
    });
    Plots7.drawHistogram(el('b7HistChart'), m.sim);
    Plots7.drawDrivers(el('b7DriverChart'), m.sim && m.sim.drivers);
    Plots7.drawTree(el('b7TreeChart'), m.tree);
    renderTreeNote(m);

    const box = el('b7Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!m.messages.some(x => x.level === 'error' || x.level === 'warning')) {
        showMessage(box, 'success', L2('El proyecto aguanta los rangos de variación declarados.', 'The project holds up within the ranges of variation declared.'));
      }
    }
    const next = el('b7Next');
    if (next) next.disabled = m.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('riskchange', { detail: { risk: m } }));
  }

  function renderSwitching(m) {
    const host = el('b7Switching');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Variable', 'Variable')}</th>
      <th class="num">${L2('Cambio que anula el VAN', 'Change that wipes out the NPV')}</th>
      <th class="num">${L2('Valor al que llegaría', 'Value it would reach')}</th>
      <th>${L2('La pregunta que hay que hacerse', 'The question to ask')}</th>
    </tr></thead><tbody>`;
    m.switching.forEach(s => {
      const pct = s.change == null ? null : s.change;
      const q = s.key === 'rate'
        ? L2('¿Alguna vez te han ofrecido crédito a esa tasa?', 'Have you ever been offered credit at that rate?')
        : s.key === 'price' ? L2('¿Has visto el precio a ese nivel en los últimos diez años?', 'Have you seen the price at that level in the last ten years?')
          : s.key === 'yield' ? L2('¿Has tenido un año con ese rendimiento?', 'Have you had a year with that yield?')
            : s.key === 'cost' ? L2('¿Podrían subir tanto los insumos?', 'Could the inputs rise that much?')
              : L2('¿La obra podría salir en ese monto?', 'Could the works come out at that amount?');
      html += `<tr${pct != null && Math.abs(pct) < 0.1 ? ' class="row-flag"' : ''}>
        <td>${L2(s.es, s.en)}</td>
        <td class="num"><b>${pct == null ? L2('nunca', 'never') : (pct > 0 ? '+' : '−') + fmtPct(Math.abs(pct), 1)}</b></td>
        <td class="num">${pct == null ? '—' : fmtPct(s.multiplier, 0) + L2(' del valor actual', ' of the current value')}</td>
        <td>${q}</td>
      </tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderScenarios(m) {
    const host = el('b7Scenarios');
    if (!host) return;
    const list = m.scenarios.list;
    if (!list.length) { host.innerHTML = `<p class="hint">${L2('Escribe al menos un escenario.', 'Type at least one scenario.')}</p>`; return; }
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Escenario', 'Scenario')}</th>
      <th class="num">${L2('Probabilidad', 'Probability')}</th>
      <th class="num">${L2('VAN', 'NPV')}</th>
      <th class="num">${L2('TIR', 'IRR')}</th>
      <th>${L2('Supuestos', 'Assumptions')}</th>
    </tr></thead><tbody>`;
    list.forEach(s => {
      const desc = Object.keys(s.changes).map(k => {
        const v = Risk.VARS.find(x => x.key === k);
        const d = s.changes[k] - 1;
        return `${T(v ? v.es : k, v ? v.en : k)} ${d >= 0 ? '+' : '−'}${fmtPct(Math.abs(d), 0)}`;
      }).join(' · ');
      html += `<tr${s.npv < 0 ? ' class="row-flag"' : ''}>
        <td>${esc(s.name || '—')}</td>
        <td class="num">${fmtPct(s.probability, 0)}</td>
        <td class="num"><b>${fmtMoney(s.npv, 0)}</b></td>
        <td class="num">${fmtRate(s.irr, 1)}</td>
        <td>${desc || '—'}</td></tr>`;
    });
    if (m.scenarios.expected != null) {
      html += `<tr class="total-row"><td>${L2('Valor esperado', 'Expected value')}</td>
        <td class="num">${fmtPct(m.scenarios.probabilityTotal, 0)}</td>
        <td class="num"><b>${fmtMoney(m.scenarios.expected, 0)}</b></td>
        <td class="num"></td>
        <td>${L2(`desviación ${fmtMoney(m.scenarios.sd, 0)}`, `deviation ${fmtMoney(m.scenarios.sd, 0)}`)}</td></tr>`;
    }
    host.innerHTML = html + '</tbody></table>';
  }

  function renderSim(m) {
    const host = el('b7SimSummary');
    if (!host) return;
    if (!m.sim) { host.innerHTML = `<p class="hint">${L2('Pulsa «Simular» para correr el modelo con todas las variables a la vez.', 'Press "Simulate" to run the model with every variable at once.')}</p>`; return; }
    const s = m.sim;
    host.innerHTML = `<table class="mini-table"><tbody>
      <tr><td>${L2('VAN esperado', 'Expected NPV')}</td><td class="num"><b>${fmtMoney(s.mean, 0)}</b></td>
        <td>${L2('Desviación estándar', 'Standard deviation')}</td><td class="num">${fmtMoney(s.sd, 0)}</td></tr>
      <tr><td>${L2('Coeficiente de variación', 'Coefficient of variation')}</td><td class="num">${s.cv == null ? '—' : fmtFixed(s.cv, 2)}</td>
        <td>${L2('Probabilidad de VAN negativo', 'Probability of a negative NPV')}</td><td class="num"><b>${fmtPct(s.pLoss, 1)}</b></td></tr>
      <tr><td>${L2('Mínimo y máximo', 'Lowest and highest')}</td><td class="num">${fmtMoney(s.min, 0)} … ${fmtMoney(s.max, 0)}</td>
        <td>${L2('Intervalo del 90 %', '90% interval')}</td><td class="num">${fmtMoney(s.p05, 0)} … ${fmtMoney(s.p95, 0)}</td></tr>
    </tbody></table>`;
  }

  function renderTreeNote(m) {
    const note = el('b7TreeNote');
    if (!note) return;
    const t = m.tree;
    note.innerHTML = L2(
      `Invertir ahora vale ${fmtMoney(t.now, 0)} en valor esperado. Esperar un año para decidir con información vale ${fmtMoney(t.wait, 0)}, porque en el escenario malo simplemente no se invierte. La diferencia, ${fmtMoney(t.option, 0)}, es el <b>valor de la opción de esperar</b>: ${t.best === 'wait' ? 'conviene esperar' : 'no compensa esperar, porque se pierde un año de beneficios'}. Saber de antemano cuál escenario ocurrirá valdría ${fmtMoney(t.perfectInfo, 0)}: ese es el techo de lo que tiene sentido gastar en un estudio de mercado.`,
      `Investing now is worth ${fmtMoney(t.now, 0)} in expected value. Waiting a year to decide with information is worth ${fmtMoney(t.wait, 0)}, because in the bad state you simply do not invest. The difference, ${fmtMoney(t.option, 0)}, is the <b>value of the option to wait</b>: ${t.best === 'wait' ? 'waiting is worth it' : 'waiting does not pay, because a year of benefits is lost'}. Knowing beforehand which state will happen would be worth ${fmtMoney(t.perfectInfo, 0)}: that is the ceiling of what it makes sense to spend on a market study.`);
  }

  /* ================================================================
     saving and export
     ================================================================ */
  function touch(withSim) {
    readForm();
    writeForm();
    render(withSim);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Project.save(P()), 500);
  }

  function exportCSV() {
    const m = state.risk, p = P();
    if (!m) return;
    const lines = ['valores_limite'];
    lines.push('variable,cambio_que_anula_el_van');
    m.switching.forEach(s => lines.push([T(s.es, s.en), s.change == null ? '' : s.change].map(csvEscape).join(',')));
    lines.push('');
    lines.push('escenarios');
    lines.push('escenario,probabilidad,van,tir');
    m.scenarios.list.forEach(s => lines.push([s.name, s.probability, s.npv, s.irr].map(csvEscape).join(',')));
    if (m.sim) {
      lines.push('');
      lines.push('simulacion');
      lines.push('corridas,van_esperado,desviacion,p5,mediana,p95,probabilidad_van_negativo');
      lines.push([m.sim.n, m.sim.mean, m.sim.sd, m.sim.p05, m.sim.median, m.sim.p95, m.sim.pLoss].map(csvEscape).join(','));
    }
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-riesgo.csv', 'text/csv;charset=utf-8');
  }

  function buildGrid() {
    const r = R();
    gScen = Import.grid(el('b7ScenarioGrid'), {
      cols: [
        { key: 'name', es: 'Escenario', en: 'Scenario', med: true },
        { key: 'probability', es: 'Probabilidad (%)', en: 'Probability (%)' },
        { key: 'price', es: 'Precio (%)', en: 'Price (%)' },
        { key: 'yield', es: 'Rendimiento (%)', en: 'Yield (%)' },
        { key: 'cost', es: 'Costos (%)', en: 'Costs (%)' },
        { key: 'invest', es: 'Inversión (%)', en: 'Investment (%)' },
      ],
      rows: Math.max(3, (r.scenarios || []).length),
      values: r.scenarios || [],
      onchange: v => { R().scenarios = v; touch(false); },
    });
  }

  function defaultScenarios() {
    return [
      { name: 'Pesimista', probability: '25', price: '-20', yield: '-15', cost: '10', invest: '10' },
      { name: 'Esperado', probability: '50', price: '0', yield: '0', cost: '0', invest: '0' },
      { name: 'Optimista', probability: '25', price: '15', yield: '10', cost: '-5', invest: '0' },
    ];
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', () => touch(false)); n.addEventListener('change', () => touch(false)); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b7Simulate', 'click', () => {
      const btn = el('b7Simulate');
      if (btn) btn.classList.add('is-busy');
      /* let the button paint before the browser goes quiet for a moment */
      setTimeout(() => { touch(true); if (btn) btn.classList.remove('is-busy'); }, 20);
    });
    on('b7ScenarioExample', 'click', () => {
      R().scenarios = defaultScenarios();
      if (gScen) gScen.set(R().scenarios);
      touch(false);
      notice(el('b7Messages'), 'info', L2('Escenarios de ejemplo cargados; cámbialos por los rangos que tú puedas defender.',
        'Example scenarios loaded; replace them with ranges you can defend.'));
    });
    on('b7ExportCSV', 'click', exportCSV);
    on('b7Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="8"]');
      if (btn && !btn.disabled) goStep(8);
      else {
        clearMessages(el('b7Messages'));
        showMessage(el('b7Messages'), 'info', L2('El Bloque 8 (evaluación económica y social) se construye en la siguiente etapa.',
          'Block 8 (economic and social appraisal) is built in the next stage.'));
        el('b7Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    ['projectchange', 'marketchange', 'budgetchange', 'statementschange', 'appraisalchange'].forEach(ev =>
      document.addEventListener(ev, () => { if (el('panel-7')) render(false); }));
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { buildGrid(); writeForm(); render(false); });
    document.addEventListener('langchange', () => { buildGrid(); writeForm(); render(false); });
    document.addEventListener('themechange', () => render(false));
  }

  function init() {
    if (!el('panel-7')) return;
    const r = R();
    if (!r.scenarios || !r.scenarios.length) r.scenarios = defaultScenarios();
    buildGrid();
    wire();
    writeForm();
    render(false);
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block7 = { compute, render };
})();
