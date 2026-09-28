/* EconomicsPro — Block 8: the screen of the economic and social appraisal.

   What is entered here are the conversion factors —what each peso of the
   project is really worth to the country— and the few data the social
   indicators need: the daily wage, the days a permanent job takes, the share
   that is exported or imported, any subsidy received and how many people the
   project reaches. Everything else comes from the previous blocks. */

(function () {

  let saveTimer = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.social) state.project.social = Project.defaults().social;
    return state.project;
  }
  const S = () => P().social;

  const FIELDS = [
    ['b8Standard', 'standard', 'num'],
    ['b8Product', 'product', 'num'],
    ['b8Labour', 'labour', 'num'],
    ['b8Inputs', 'inputs', 'num'],
    ['b8Machinery', 'machinery', 'num'],
    ['b8Services', 'services', 'num'],
    ['b8Admin', 'admin', 'num'],
    ['b8Other', 'other', 'num'],
    ['b8Investment', 'investment', 'num'],
    ['b8Exchange', 'exchange', 'num'],
    ['b8ExportShare', 'exportShare', 'pct'],
    ['b8ImportShare', 'importShare', 'pct'],
    ['b8Wage', 'wage', 'num'],
    ['b8DaysPerJob', 'daysPerJob', 'int'],
    ['b8Subsidy', 'subsidy', 'num'],
    ['b8Beneficiaries', 'beneficiaries', 'int'],
  ];

  function readForm() {
    const s = S();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (n.value.trim() === '') { s[key] = key === 'investment' ? null : s[key]; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      s[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }
  function writeForm() {
    const s = S();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = s[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
  }

  function compute() {
    const p = P();
    const market = state.market || (window.Block3 ? Block3.compute() : null);
    const budget = state.budget || (window.Block4 ? Block4.compute() : null);
    const st = state.statements || (window.Block5 ? Block5.compute() : null);
    const ap = state.appraisal || (window.Block6 ? Block6.compute() : null);
    if (!st || !budget) return null;
    const model = Social.build(S(), p, market, budget, st, ap);
    model.privateFlow = st.projectFlow;
    model.appraisal = ap;
    state.social = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  function render() {
    const p = P();
    const m = compute();
    if (!m) return;
    const s = S();

    const tiles = el('b8Tiles');
    if (tiles) {
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      const priv = m.appraisal ? m.appraisal.project.npv : m.bridge.privateAtPrivate;
      const ind = m.indicators;
      tiles.innerHTML =
        tile(L2('VAN económico', 'Economic NPV'), fmtMoney(m.economic.npv, 0),
          L2(`a la tasa social de ${fmtPct(m.socialRate, 2)}`, `at the social rate of ${fmtPct(m.socialRate, 2)}`), m.economic.npv > 0 ? 'ok' : 'bad') +
        tile(L2('TIR económica', 'Economic IRR'), fmtRate(m.economic.irr, 2),
          L2(`contra ${fmtPct(m.socialRate, 2)}`, `against ${fmtPct(m.socialRate, 2)}`),
          m.economic.irr != null && m.economic.irr > m.socialRate ? 'ok' : 'bad') +
        tile(L2('VAN privado', 'Private NPV'), fmtMoney(priv, 0),
          L2(`a la tasa de ${fmtPct(m.privateRate, 2)}`, `at a rate of ${fmtPct(m.privateRate, 2)}`), priv > 0 ? 'ok' : 'bad') +
        tile(L2('Empleos permanentes', 'Permanent jobs'), fmtNum(ind.permanentJobs, 1),
          L2(`${fmtNum(ind.jobsAtFull, 0)} jornales al año`, `${fmtNum(ind.jobsAtFull, 0)} labour days a year`)) +
        tile(L2('Inversión por empleo', 'Investment per job'),
          ind.investmentPerJob == null ? '—' : fmtMoney(ind.investmentPerJob, 0),
          L2('permanente creado', 'permanent job created')) +
        tile(L2('Divisas netas', 'Net foreign exchange'),
          ind.fxPresent === 0 ? '—' : fmtMoney(ind.fxPresent, 0),
          L2('valor presente del horizonte', 'present value over the horizon'), ind.fxPresent > 0 ? 'ok' : '');
    }

    const verdict = el('b8Verdict');
    if (verdict) {
      const priv = m.appraisal ? m.appraisal.project.npv : m.bridge.privateAtPrivate;
      const both = priv > 0 && m.economic.npv > 0;
      const neither = priv <= 0 && m.economic.npv <= 0;
      verdict.innerHTML = `<b>${L2('Lectura', 'Reading')}</b> ` + (
        both ? L2(`El proyecto conviene por los dos lados: deja ${fmtMoney(priv, 0)} de valor presente a su dueño y ${fmtMoney(m.economic.npv, 0)} al país. La diferencia entre ambas cifras se explica en la figura de abajo.`,
          `The project is worth doing on both counts: it leaves ${fmtMoney(priv, 0)} of present value to its owner and ${fmtMoney(m.economic.npv, 0)} to the country. The difference between the two figures is explained in the figure below.`)
          : neither ? L2('El proyecto no conviene ni al dueño ni al país con los supuestos actuales.', 'The project is worth doing neither for the owner nor for the country under the current assumptions.')
            : priv > 0 ? L2(`Conviene al dueño (${fmtMoney(priv, 0)}) pero no al país (${fmtMoney(m.economic.npv, 0)}): su rentabilidad descansa en transferencias o en precios que no reflejan el valor real de los recursos.`,
              `It is worth doing for the owner (${fmtMoney(priv, 0)}) but not for the country (${fmtMoney(m.economic.npv, 0)}): its profitability rests on transfers or on prices that do not reflect the real value of the resources.`)
              : L2(`No le conviene al dueño (${fmtMoney(priv, 0)}) pero sí al país (${fmtMoney(m.economic.npv, 0)}): es el argumento de un apoyo público, y conviene escribirlo así.`,
                `It is not worth doing for the owner (${fmtMoney(priv, 0)}) but it is for the country (${fmtMoney(m.economic.npv, 0)}): that is the argument for public support, and it should be written as such.`));
    }

    renderBridge(m);
    renderRows(m, p);
    renderIndicators(m, s);
    Plots8.drawBridge(el('b8BridgeChart'), m.bridge);
    Plots8.drawProfiles(el('b8ProfileChart'), m, m.privateFlow);
    Plots8.drawJobs(el('b8JobsChart'), m.rows, Number(s.daysPerJob));
    Plots8.drawValueAdded(el('b8ValueChart'), m.rows);

    const note = el('b8FactorNote');
    if (note) {
      note.innerHTML = L2(
        `El factor de la inversión que se está usando es <b>${fmtFixed(m.fcInvest, 3)}</b>, ponderado según de qué está hecha la inversión del Bloque 4 (el terreno vale 1, la obra civil va al factor estándar y la maquinaria al de los bienes comerciables). Escribe un número en su casilla si prefieres fijarlo tú.`,
        `The investment factor in use is <b>${fmtFixed(m.fcInvest, 3)}</b>, weighted by what the investment of Block 4 is made of (land is worth 1, civil works take the standard factor and machinery the traded-goods one). Type a number in its box if you would rather set it yourself.`);
    }

    const box = el('b8Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!m.messages.some(x => x.level === 'error' || x.level === 'warning')) {
        showMessage(box, 'success', L2('La evaluación económica es coherente con la privada y la descomposición cierra.', 'The economic appraisal is coherent with the private one and the bridge closes.'));
      }
    }
    const next = el('b8Next');
    if (next) next.disabled = m.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('socialchange', { detail: { social: m } }));
  }

  function renderBridge(m) {
    const host = el('b8Bridge');
    if (!host) return;
    const b = m.bridge;
    const row = (label, v, note) => `<tr><td>${label}</td><td class="num">${fmtMoney(v, 0)}</td><td>${note || ''}</td></tr>`;
    host.innerHTML = `<table class="mini-table"><thead><tr>
      <th>${L2('Concepto', 'Item')}</th><th class="num">${L2('Valor presente', 'Present value')}</th><th>${L2('Por qué', 'Why')}</th>
    </tr></thead><tbody>
      ${row(L2('VAN privado, a la tasa privada', 'Private NPV, at the private rate'), b.privateAtPrivate, L2('lo que dice el Bloque 6', 'what Block 6 says'))}
      ${row(L2('VAN privado, a la tasa social', 'Private NPV, at the social rate'), b.privateAtSocial, L2('el país descuenta a otra tasa', 'the country discounts at another rate'))}
      ${row(L2('+ transferencias', '+ transfers'), b.transfers, L2('impuestos y subsidios cambian de bolsillo, no crean recursos', 'taxes and subsidies change pocket, they do not create resources'))}
      ${row(L2('± precio del producto', '± price of the product'), b.product, L2('precio cuenta y valor de la divisa que gana', 'accounting price and value of the foreign exchange it earns'))}
      ${row(L2('± precios de los costos', '± prices of the costs'), b.costs, L2('mano de obra, insumos y servicios a su costo social', 'labour, inputs and services at their social cost'))}
      ${row(L2('± precios de la inversión', '± prices of the investment'), b.investment, L2('obra, maquinaria y capital de trabajo', 'works, machinery and working capital'))}
      <tr class="total-row"><td>${L2('VAN económico', 'Economic NPV')}</td><td class="num"><b>${fmtMoney(b.economic, 0)}</b></td>
        <td>${L2('lo que el proyecto le deja al país', 'what the project leaves the country')}</td></tr>
    </tbody></table>`;
  }

  function renderRows(m, p) {
    const host = el('b8Rows');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Ingreso de mercado', 'Market revenue')}</th>
      <th class="num">${L2('Ingreso económico', 'Economic revenue')}</th>
      <th class="num">${L2('Costo de mercado', 'Market cost')}</th>
      <th class="num">${L2('Costo económico', 'Economic cost')}</th>
      <th class="num">${L2('Inversión económica', 'Economic investment')}</th>
      <th class="num">${L2('Flujo económico', 'Economic flow')}</th>
    </tr></thead><tbody>`;
    html += `<tr class="row-flag"><td>${Number(p.baseYear) || 0}</td><td class="num">—</td><td class="num">—</td>
      <td class="num">—</td><td class="num">—</td><td class="num">${fmtMoney(-m.flow[0], 0)}</td>
      <td class="num"><b>${fmtMoney(m.flow[0], 0)}</b></td></tr>`;
    m.rows.forEach(r => {
      html += `<tr${r.net < 0 ? ' class="row-flag"' : ''}>
        <td>${r.year}</td>
        <td class="num">${fmtMoney(r.revenue, 0)}</td>
        <td class="num">${fmtMoney(r.revenueEcon, 0)}</td>
        <td class="num">${fmtMoney(r.cost, 0)}</td>
        <td class="num">${fmtMoney(r.costEcon, 0)}</td>
        <td class="num">${r.investmentEcon ? fmtMoney(r.investmentEcon, 0) : '—'}</td>
        <td class="num"><b>${fmtMoney(r.net, 0)}</b></td></tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderIndicators(m, s) {
    const host = el('b8Indicators');
    if (!host) return;
    const i = m.indicators;
    const full = m.rows.reduce((a, r) => (r.valueAdded > a.valueAdded ? r : a), m.rows[0] || { valueAdded: 0 });
    const row = (a, b, c) => `<tr><td>${a}</td><td class="num">${b}</td><td>${c || ''}</td></tr>`;
    host.innerHTML = `<table class="mini-table"><tbody>
      ${row(L2('Jornales al año, a plena producción', 'Labour days a year, at full production'), fmtNum(i.jobsAtFull, 0),
      L2(`con un jornal de ${fmtMoney(s.wage, 0)}`, `with a daily wage of ${fmtMoney(s.wage, 0)}`))}
      ${row(L2('Empleos permanentes equivalentes', 'Equivalent permanent jobs'), fmtNum(i.permanentJobs, 1),
      L2(`${s.daysPerJob} jornales por empleo`, `${s.daysPerJob} labour days per job`))}
      ${row(L2('Jornales en todo el horizonte', 'Labour days over the whole horizon'), fmtNum(i.totalJobs, 0), '')}
      ${row(L2('Inversión por empleo permanente', 'Investment per permanent job'), i.investmentPerJob == null ? '—' : fmtMoney(i.investmentPerJob, 0),
      L2('el indicador que piden los programas de apoyo', 'the indicator support programmes ask for'))}
      ${row(L2('Divisas netas al año', 'Net foreign exchange a year'), i.fxPerYear ? fmtMoney(i.fxPerYear, 0) : '—',
      L2('exportaciones menos importaciones', 'exports less imports'))}
      ${row(L2('Valor agregado a plena producción', 'Value added at full production'), fmtMoney(full.valueAdded, 0),
      L2('producción menos consumo intermedio', 'output less intermediate consumption'))}
      ${row(L2('Del valor agregado, a remuneraciones', 'Of the value added, to wages'), fmtRate(i.wagesShare, 0), '')}
      ${row(L2('Del valor agregado, a impuestos', 'Of the value added, to taxes'), fmtRate(i.taxShare, 0), '')}
      ${row(L2('Del valor agregado, a intereses', 'Of the value added, to interest'), fmtRate(i.interestShare, 0), '')}
      ${row(L2('Del valor agregado, al dueño', 'Of the value added, to the owner'), fmtRate(i.surplusShare, 0), L2('los cuatro renglones suman el valor agregado', 'the four lines add up to the value added'))}
      ${i.beneficiaries > 0 ? row(L2('Inversión por beneficiario', 'Investment per beneficiary'), fmtMoney(i.costPerBeneficiary, 0),
      L2(`${fmtNum(i.beneficiaries, 0)} beneficiarios declarados`, `${fmtNum(i.beneficiaries, 0)} beneficiaries declared`)) : ''}
    </tbody></table>`;
  }

  /* ================================================================
     saving and export
     ================================================================ */
  function touch() {
    readForm();
    writeForm();
    render();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Project.save(P()), 500);
  }

  function exportCSV() {
    const m = state.social, p = P();
    if (!m) return;
    const lines = ['ano,ingreso_mercado,ingreso_economico,costo_mercado,costo_economico,inversion_economica,flujo_economico,jornales,valor_agregado'];
    lines.push([(Number(p.baseYear) || 0), '', '', '', '', -m.flow[0], m.flow[0], '', ''].map(csvEscape).join(','));
    m.rows.forEach(r => lines.push([r.year, r.revenue, r.revenueEcon, r.cost, r.costEcon, r.investmentEcon, r.net, r.jobs, r.valueAdded].map(csvEscape).join(',')));
    lines.push('');
    lines.push('indicador,valor');
    [['van_economico', m.economic.npv], ['tir_economica', m.economic.irr], ['bc_economica', m.economic.bc],
      ['empleos_permanentes', m.indicators.permanentJobs], ['inversion_por_empleo', m.indicators.investmentPerJob],
      ['divisas_valor_presente', m.indicators.fxPresent]].forEach(([k, v]) => lines.push([k, v].map(csvEscape).join(',')));
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-evaluacion-social.csv', 'text/csv;charset=utf-8');
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b8ExportCSV', 'click', exportCSV);
    on('b8Reset', 'click', () => { P().social = Social.defaults(); writeForm(); touch(); });
    on('b8Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="9"]');
      if (btn && !btn.disabled) goStep(9);
      else {
        clearMessages(el('b8Messages'));
        showMessage(el('b8Messages'), 'info', L2('El Bloque 9 (comparación y decisiones) se construye en la siguiente etapa.',
          'Block 9 (comparison and decisions) is built in the next stage.'));
        el('b8Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    ['projectchange', 'marketchange', 'budgetchange', 'statementschange', 'appraisalchange'].forEach(ev =>
      document.addEventListener(ev, () => { if (el('panel-8')) render(); }));
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { writeForm(); render(); });
    document.addEventListener('langchange', () => { writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  function init() {
    if (!el('panel-8')) return;
    P();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block8 = { compute, render };
})();
