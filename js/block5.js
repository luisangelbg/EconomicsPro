/* EconomicsPro — Block 5: the screen of financing and pro-forma statements.

   The financing is entered here (a long-term loan and a seasonal one), and
   everything else is read from the blocks before: the revenue of Block 3 and
   the investment, costs and depreciation of Block 4. What comes out —the two
   cash flows— is what Block 6 will discount. */

(function () {

  let saveTimer = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.finance) state.project.finance = Project.defaults().finance;
    return state.project;
  }
  const F = () => P().finance;

  const FIELDS = [
    ['b5LtShare', 'longTermShare', 'pct'],
    ['b5LtRate', 'longTermRate', 'pct'],
    ['b5LtYears', 'longTermYears', 'int'],
    ['b5LtGrace', 'longTermGrace', 'int'],
    ['b5LtGraceType', 'longTermGraceType', 'text'],
    ['b5LtType', 'longTermType', 'text'],
    ['b5Fee', 'fee', 'pct'],
    ['b5SeasonalShare', 'seasonalShare', 'pct'],
    ['b5SeasonalRate', 'seasonalRate', 'pct'],
  ];

  function readForm() {
    const f = F();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (kind === 'text') { f[key] = n.value; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      f[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }
  function writeForm() {
    const f = F();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = f[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
  }

  function compute() {
    const p = P();
    const market = state.market || (window.Block3 ? Block3.compute() : null);
    const budget = state.budget || (window.Block4 ? Block4.compute() : null);
    const model = FinState.build(F(), p, market, budget);
    state.statements = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  let beIndex = null;

  function render() {
    const p = P();
    const m = compute();

    const tiles = el('b5Tiles');
    if (tiles) {
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      const lt = m.loans.longTerm;
      const full = m.rows.find(r => r.revenue >= Math.max(...m.rows.map(x => x.revenue)) * 0.999) || m.rows[m.rows.length - 1];
      const worstDscr = m.ratios.filter(r => r.dscr != null && r.service > 0);
      tiles.innerHTML =
        tile(L2('Aportación del dueño', 'Owner\'s contribution'), fmtMoney(m.equityPut, 0),
          L2(`de una inversión inicial de ${fmtMoney(m.equityPut + (m.loans.received[0] || 0), 0)}`, `of an initial investment of ${fmtMoney(m.equityPut + (m.loans.received[0] || 0), 0)}`), 'ok') +
        tile(L2('Crédito', 'Loan'), fmtMoney(lt ? lt.amount : 0, 0),
          lt ? L2(`pago anual ${fmtMoney(lt.payment, 0)} · interés total ${fmtMoney(lt.totalInterest, 0)}`, `yearly payment ${fmtMoney(lt.payment, 0)} · total interest ${fmtMoney(lt.totalInterest, 0)}`) : L2('sin crédito', 'no loan')) +
        tile(L2('Utilidad neta a plena producción', 'Net profit at full production'), fmtMoney(full ? full.net : null, 0),
          full && full.revenue > 0 ? L2(`margen ${fmtPct(full.net / full.revenue, 0)}`, `margin ${fmtPct(full.net / full.revenue, 0)}`) : '',
          full && full.net > 0 ? 'ok' : 'bad') +
        tile(L2('Caja más baja', 'Lowest cash'), fmtMoney(m.cashLow, 0),
          L2(`en ${m.cashLowYear}`, `in ${m.cashLowYear}`), m.cashLow < 0 ? 'bad' : 'ok') +
        tile(L2('Cobertura del servicio de la deuda', 'Debt service coverage'),
          worstDscr.length ? fmtFixed(Math.min(...worstDscr.map(r => r.dscr)), 2) : '—',
          L2('el año más apretado', 'the tightest year'),
          worstDscr.length ? (Math.min(...worstDscr.map(r => r.dscr)) >= 1.2 ? 'ok' : 'bad') : '') +
        tile(L2('Punto de equilibrio', 'Break-even'),
          (() => { const be = m.breakeven.find(b => b.volume > 0); return be && be.capacityPct != null ? fmtPct(be.capacityPct, 0) : '—'; })(),
          L2('del volumen del primer año con venta', 'of the volume of the first year with sales'));
    }

    renderIncome(m, p);
    renderFlows(m, p);
    renderBalance(m, p);
    renderLoan(m, p);
    renderRatios(m, p);

    /* the break-even is drawn for the first year with sales, unless another is chosen */
    const beSel = el('b5BeYear');
    if (beSel) {
      const options = m.breakeven.filter(b => b.volume > 0);
      if (!beSel.dataset.built || beSel.options.length !== options.length) {
        beSel.dataset.built = '1';
        beSel.innerHTML = options.map(b => `<option value="${b.t}">${b.year}</option>`).join('');
      }
      if (beIndex == null && options.length) beIndex = m.breakeven.indexOf(options[0]);
      if (beIndex != null && m.breakeven[beIndex]) beSel.value = m.breakeven[beIndex].t;
    }
    Plots5.drawIncome(el('b5IncomeChart'), m);
    Plots5.drawFlows(el('b5FlowChart'), m);
    Plots5.drawBreakeven(el('b5BeChart'), m, beIndex == null ? 0 : beIndex);
    Plots5.drawDebt(el('b5DebtChart'), m);
    renderBeNote(m);

    const box = el('b5Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!m.messages.some(x => x.level === 'error' || x.level === 'warning')) {
        showMessage(box, 'success', L2('Los estados cuadran y el proyecto no se queda sin caja en ningún año.', 'The statements balance and the project does not run out of cash in any year.'));
      }
    }
    const next = el('b5Next');
    if (next) next.disabled = m.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('statementschange', { detail: { statements: m } }));
  }

  function renderIncome(m, p) {
    const host = el('b5Income');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Ingresos', 'Revenue')}</th>
      <th class="num">${L2('Costos', 'Costs')}</th>
      <th class="num">${L2('Depreciación', 'Depreciation')}</th>
      <th class="num">${L2('Utilidad de operación', 'Operating profit')}</th>
      <th class="num">${L2('Intereses', 'Interest')}</th>
      <th class="num">${L2('Utilidad antes de impuestos', 'Profit before tax')}</th>
      <th class="num">${L2('PTU', 'Profit sharing')}</th>
      <th class="num">${L2('ISR', 'Income tax')}</th>
      <th class="num">${L2('Utilidad neta', 'Net profit')}</th>
    </tr></thead><tbody>`;
    m.rows.forEach(r => {
      html += `<tr${r.net < 0 ? ' class="row-flag"' : ''}>
        <td>${r.year}</td>
        <td class="num">${fmtMoney(r.revenue, 0)}</td>
        <td class="num">${fmtMoney(r.cost, 0)}</td>
        <td class="num">${fmtMoney(r.depreciation, 0)}</td>
        <td class="num">${fmtMoney(r.ebit, 0)}</td>
        <td class="num">${r.interest ? fmtMoney(r.interest, 0) : '—'}</td>
        <td class="num">${fmtMoney(r.ebt, 0)}</td>
        <td class="num">${r.ptu ? fmtMoney(r.ptu, 0) : '—'}</td>
        <td class="num">${r.tax ? fmtMoney(r.tax, 0) : '—'}${r.lossUsed > 0 ? ` <span class="chip a">${L2('pérdidas', 'losses')}</span>` : ''}</td>
        <td class="num"><b>${fmtMoney(r.net, 0)}</b></td>
      </tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderFlows(m, p) {
    const host = el('b5Flows');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Flujo del proyecto', 'Project flow')}</th>
      <th class="num">${L2('Crédito recibido', 'Loan received')}</th>
      <th class="num">${L2('Servicio de la deuda', 'Debt service')}</th>
      <th class="num">${L2('Flujo del inversionista', 'Investor flow')}</th>
      <th class="num">${L2('Saldo de caja', 'Cash balance')}</th>
    </tr></thead><tbody>`;
    m.projectFlow.forEach((v, t) => {
      const service = (m.loans.principal[t] || 0) + (m.loans.interest[t] || 0);
      const cash = m.balance[t] ? m.balance[t].cash : null;
      html += `<tr${cash != null && cash < 0 ? ' class="row-flag"' : ''}>
        <td>${(Number(p.baseYear) || 0) + t}${t === 0 ? L2(' (año 0)', ' (year 0)') : ''}</td>
        <td class="num">${fmtMoney(v, 0)}</td>
        <td class="num">${m.loans.received[t] ? fmtMoney(m.loans.received[t], 0) : '—'}</td>
        <td class="num">${service ? fmtMoney(service, 0) : '—'}</td>
        <td class="num"><b>${fmtMoney(m.investorFlow[t], 0)}</b></td>
        <td class="num">${cash == null ? '—' : fmtMoney(cash, 0)}</td>
      </tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderBalance(m, p) {
    const host = el('b5Balance');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Caja', 'Cash')}</th>
      <th class="num">${L2('Capital de trabajo', 'Working capital')}</th>
      <th class="num">${L2('Activo fijo neto', 'Net fixed assets')}</th>
      <th class="num">${L2('Diferido neto', 'Net pre-operating')}</th>
      <th class="num">${L2('Activo total', 'Total assets')}</th>
      <th class="num">${L2('Pasivo', 'Liabilities')}</th>
      <th class="num">${L2('Capital contable', 'Equity')}</th>
      <th class="num">${L2('Diferencia', 'Difference')}</th>
    </tr></thead><tbody>`;
    m.balance.forEach(b => {
      html += `<tr><td>${b.year}</td>
        <td class="num">${fmtMoney(b.cash, 0)}</td>
        <td class="num">${fmtMoney(b.workingCapital, 0)}</td>
        <td class="num">${fmtMoney(b.fixedNet, 0)}</td>
        <td class="num">${fmtMoney(b.deferredNet, 0)}</td>
        <td class="num"><b>${fmtMoney(b.assets, 0)}</b></td>
        <td class="num">${fmtMoney(b.liabilities, 0)}</td>
        <td class="num">${fmtMoney(b.capital, 0)}</td>
        <td class="num">${Math.abs(b.gap || 0) < 1 ? '✓' : fmtMoney(b.gap, 2)}</td></tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderLoan(m, p) {
    const host = el('b5Loan');
    if (!host) return;
    const lt = m.loans.longTerm;
    if (!lt) { host.innerHTML = `<p class="hint">${L2('El proyecto se financia sin crédito.', 'The project is financed with no loan.')}</p>`; return; }
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Saldo inicial', 'Opening balance')}</th>
      <th class="num">${L2('Interés', 'Interest')}</th>
      <th class="num">${L2('Capital', 'Principal')}</th>
      <th class="num">${L2('Pago', 'Payment')}</th>
      <th class="num">${L2('Saldo final', 'Closing balance')}</th>
    </tr></thead><tbody>`;
    lt.rows.forEach(r => {
      html += `<tr${r.grace ? ' class="row-flag"' : ''}><td>${(Number(p.baseYear) || 0) + r.t}${r.grace ? ` <span class="chip a">${L2('gracia', 'grace')}</span>` : ''}</td>
        <td class="num">${fmtMoney(r.opening, 0)}</td>
        <td class="num">${fmtMoney(r.interest, 0)}</td>
        <td class="num">${fmtMoney(r.principal, 0)}</td>
        <td class="num"><b>${fmtMoney(r.payment, 0)}</b></td>
        <td class="num">${fmtMoney(r.balance, 0)}</td></tr>`;
    });
    html += `<tr class="total-row"><td>${L2('Total', 'Total')}</td><td class="num"></td>
      <td class="num">${fmtMoney(lt.totalInterest, 0)}</td><td class="num">${fmtMoney(lt.amount, 0)}</td>
      <td class="num"><b>${fmtMoney(lt.totalInterest + lt.amount, 0)}</b></td><td class="num"></td></tr>`;
    host.innerHTML = html + '</tbody></table>';
  }

  function renderRatios(m, p) {
    const host = el('b5Ratios');
    if (!host) return;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Margen neto', 'Net margin')}</th>
      <th class="num">${L2('Rendimiento del activo', 'Return on assets')}</th>
      <th class="num">${L2('Rendimiento del capital', 'Return on equity')}</th>
      <th class="num">${L2('Pasivo / activo', 'Debt / assets')}</th>
      <th class="num">${L2('Cobertura de intereses', 'Interest coverage')}</th>
      <th class="num">${L2('Cobertura del servicio', 'Debt service coverage')}</th>
    </tr></thead><tbody>`;
    m.ratios.forEach(r => {
      html += `<tr><td>${r.year}</td>
        <td class="num">${fmtRate(r.margin, 1)}</td>
        <td class="num">${fmtRate(r.roa, 1)}</td>
        <td class="num">${fmtRate(r.roe, 1)}</td>
        <td class="num">${fmtRate(r.leverage, 1)}</td>
        <td class="num">${r.coverage == null ? '—' : fmtFixed(r.coverage, 2)}</td>
        <td class="num">${r.dscr == null ? '—' : `<b class="${r.dscr < 1.2 ? 'pw low' : ''}">${fmtFixed(r.dscr, 2)}</b>`}</td></tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
  }

  function renderBeNote(m) {
    const note = el('b5BeNote');
    if (!note) return;
    const be = m.breakeven[beIndex == null ? 0 : beIndex];
    if (!be || be.units == null) { note.innerHTML = L2('Ese año no tiene margen de contribución positivo, así que no hay punto de equilibrio.', 'That year has no positive contribution margin, so there is no break-even point.'); return; }
    note.innerHTML = L2(
      `En ${be.year} el proyecto cubre sus costos vendiendo <b>${fmtNum(be.units, 1)}</b> (${fmtPct(be.capacityPct, 0)} de lo que produce), a un precio de ${fmtMoney(be.price, 0)}. Su margen de seguridad es de ${fmtPct(be.safetyMargin, 0)}: eso puede caer el volumen antes de empezar a perder. El precio mínimo que soporta es ${fmtMoney(be.breakevenPrice, 0)}.`,
      `In ${be.year} the project covers its costs by selling <b>${fmtNum(be.units, 1)}</b> (${fmtPct(be.capacityPct, 0)} of what it produces), at a price of ${fmtMoney(be.price, 0)}. Its safety margin is ${fmtPct(be.safetyMargin, 0)}: that is how far the volume can fall before it starts losing money. The lowest price it can take is ${fmtMoney(be.breakevenPrice, 0)}.`);
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
    const m = state.statements, p = P();
    if (!m) return;
    const lines = ['ano,ingresos,costos,depreciacion,utilidad_operacion,intereses,utilidad_antes_impuestos,ptu,isr,utilidad_neta,flujo_proyecto,flujo_inversionista,saldo_caja'];
    lines.push([(Number(p.baseYear) || 0), '', '', '', '', '', '', '', '', '', m.projectFlow[0], m.investorFlow[0], m.balance[0].cash].map(csvEscape).join(','));
    m.rows.forEach(r => {
      lines.push([r.year, r.revenue, r.cost, r.depreciation, r.ebit, r.interest, r.ebt, r.ptu, r.tax, r.net,
        m.projectFlow[r.t], m.investorFlow[r.t], m.balance[r.t] ? m.balance[r.t].cash : ''].map(csvEscape).join(','));
    });
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-estados-proforma.csv', 'text/csv;charset=utf-8');
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b5ExportCSV', 'click', exportCSV);
    on('b5BeYear', 'change', () => {
      const m = state.statements;
      const t = Math.round(parseNum(el('b5BeYear').value) || 1);
      beIndex = m.breakeven.findIndex(b => b.t === t);
      Plots5.drawBreakeven(el('b5BeChart'), m, beIndex);
      renderBeNote(m);
    });
    on('b5NoLoan', 'click', () => {
      const f = F();
      f.longTermShare = 0; f.seasonalShare = 0;
      writeForm(); touch();
    });
    on('b5Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="6"]');
      if (btn && !btn.disabled) goStep(6);
      else {
        clearMessages(el('b5Messages'));
        showMessage(el('b5Messages'), 'info', L2('El Bloque 6 (evaluación financiera) se construye en la siguiente etapa. Los dos flujos ya quedaron listos para descontarse.',
          'Block 6 (financial appraisal) is built in the next stage. The two cash flows are ready to be discounted.'));
        el('b5Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    ['projectchange', 'marketchange', 'budgetchange'].forEach(ev =>
      document.addEventListener(ev, () => { if (el('panel-5')) render(); }));
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { writeForm(); render(); });
    document.addEventListener('langchange', () => { writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  function init() {
    if (!el('panel-5')) return;
    P();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block5 = { compute, render };
})();
