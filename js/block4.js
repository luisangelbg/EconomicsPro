/* EconomicsPro — Block 4: the screen of investment, costs and working capital.

   Five grids (fixed investment, pre-operating investment, the budget while the
   project is not yet bearing, the budget once it produces, and the annual fixed
   costs), the working capital, and the tables the next block needs: the
   calendar of investments, the depreciation of every year and the cost of
   every year with its unit cost. */

(function () {

  const G = {};                     /* the grids, by name */
  let saveTimer = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.budget) state.project.budget = Project.defaults().budget;
    return state.project;
  }
  const B = () => P().budget;

  const FIELDS = [
    ['b4DeferredLife', 'deferredLife', 'int'],
    ['b4WcMethod', 'wcMethod', 'text'],
    ['b4DaysInv', 'wcDaysInventory', 'num'],
    ['b4DaysRec', 'wcDaysReceivable', 'num'],
    ['b4DaysPay', 'wcDaysPayable', 'num'],
    ['b4WcMonths', 'wcMonths', 'num'],
    ['b4WcPct', 'wcPct', 'pct'],
  ];

  function readForm() {
    const b = B();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (kind === 'text') { b[key] = n.value; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      b[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }
  function writeForm() {
    const b = B();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = b[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
    const show = (id, on) => { const n = el(id); if (n) n.style.display = on ? '' : 'none'; };
    show('b4CycleFields', b.wcMethod === 'cycle');
    show('b4MonthsField', b.wcMethod === 'months');
    show('b4PctField', b.wcMethod === 'pct');
  }

  /* the grids hold strings; the model wants the shapes of budget.js */
  function toModel() {
    const b = B();
    const num = v => parseNum(v);
    return {
      investments: (b.investments || []).map(r => ({
        name: r.name, kind: r.kind || 'other', qty: num(r.qty), unitCost: num(r.unitCost),
        year: num(r.year) || 0, life: num(r.life), salvagePct: (num(r.salvagePct) || 0) / 100,
        replace: r.replace,
      })),
      deferred: (b.deferred || []).map(r => ({ name: r.name, amount: num(r.amount), year: num(r.year) || 0 })),
      deferredLife: b.deferredLife,
      establishment: (b.establishment || []).map(r => ({ name: r.name, group: r.group || 'other', base: r.base || 'unit', qty: num(r.qty), unitCost: num(r.unitCost), variable: true })),
      operating: (b.operating || []).map(r => ({ name: r.name, group: r.group || 'other', base: r.base || 'unit', qty: num(r.qty), unitCost: num(r.unitCost), variable: true })),
      fixed: (b.fixed || []).map(r => ({ name: r.name, amount: num(r.amount) })),
      wcMethod: b.wcMethod, wcDaysInventory: b.wcDaysInventory, wcDaysReceivable: b.wcDaysReceivable,
      wcDaysPayable: b.wcDaysPayable, wcMonths: b.wcMonths, wcPct: b.wcPct,
    };
  }

  function compute() {
    const p = P();
    const market = state.market || (window.Block3 ? Block3.compute() : null);
    const model = Budget.build(toModel(), p, market);
    state.budget = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  function render() {
    const p = P();
    const m = compute();
    const market = state.market;

    const ctx = el('b4Context');
    if (ctx) {
      ctx.innerHTML = [
        [L2('Escala', 'Scale'), `${fmtNum(p.scale, 2)} ${esc(p.unitName)}`],
        [L2('Horizonte', 'Horizon'), `${p.horizon} ${L2('años', 'years')}`],
        [L2('Producción a plena carga', 'Production at full load'),
          market && market.prog ? fmtNum(Math.max(...market.prog.rows.map(r => r.production)), 1) : '—'],
        [L2('Precio proyectado', 'Projected price'),
          market && market.priceFc && market.priceFc.values.length ? fmtMoney(market.priceFc.values[market.priceFc.values.length - 1].value, 0) : '—'],
      ].map(([a, b]) => `<span class="chip p">${a}: <b>${b}</b></span>`).join(' ');
    }

    const tiles = el('b4Tiles');
    if (tiles) {
      const s = m.summary;
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      const price = market && market.priceFc && market.priceFc.values.length ? market.priceFc.values[market.priceFc.values.length - 1].value : null;
      tiles.innerHTML =
        tile(L2('Inversión total inicial', 'Total initial investment'), fmtMoney(s.initial, 0),
          L2(`fija ${fmtMoney(s.fixedInvestment, 0)} · diferida ${fmtMoney(s.deferred, 0)}`, `fixed ${fmtMoney(s.fixedInvestment, 0)} · pre-operating ${fmtMoney(s.deferred, 0)}`), 'ok') +
        tile(L2('Capital de trabajo', 'Working capital'), fmtMoney(s.workingCapitalPeak, 0),
          m.wc.days != null ? L2(`ciclo de caja de ${fmtNum(m.wc.days, 0)} días`, `cash cycle of ${fmtNum(m.wc.days, 0)} days`) : L2('máximo del horizonte', 'peak of the horizon')) +
        tile(L2('Reposiciones', 'Replacements'), fmtMoney(s.replacements, 0), L2('durante el horizonte', 'over the horizon')) +
        tile(L2('Costo anual a plena producción', 'Annual cost at full production'), fmtMoney(s.costAtFull, 0),
          L2(`variables ${fmtPct(s.variableShare, 0)}`, `variable ${fmtPct(s.variableShare, 0)}`)) +
        tile(L2(`Costo por ${esc(p.unitName)}`, `Cost per ${esc(p.unitName)}`), fmtMoney(s.perUnitAtFull, 0), L2('a plena producción', 'at full production')) +
        tile(L2('Costo por tonelada', 'Cost per tonne'), fmtMoney(s.perOutputAtFull, 0),
          price ? L2(`contra un precio de ${fmtMoney(price, 0)}`, `against a price of ${fmtMoney(price, 0)}`) : L2('sin precio del Bloque 3', 'no price from Block 3'),
          price && s.perOutputAtFull != null ? (s.perOutputAtFull < price * 0.8 ? 'ok' : s.perOutputAtFull < price ? 'warn' : 'bad') : '');
    }

    renderSchedule(m, p);
    renderDepreciation(m, p);
    Plots4.drawStructure(el('b4StructChart'), m);
    Plots4.drawSchedule(el('b4ScheduleChart'), m);
    Plots4.drawCosts(el('b4CostChart'), m, {
      price: market && market.priceFc && market.priceFc.values.length ? market.priceFc.values[market.priceFc.values.length - 1].value : null,
    });
    Plots4.drawGroups(el('b4GroupChart'), m);

    const box = el('b4Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!m.messages.some(x => x.level === 'error' || x.level === 'warning')) {
        showMessage(box, 'success', L2('El presupuesto está completo y es coherente con el programa de ventas.', 'The budget is complete and coherent with the sales programme.'));
      }
    }
    const next = el('b4Next');
    if (next) next.disabled = m.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('budgetchange', { detail: { budget: m } }));
  }

  function renderSchedule(m, p) {
    const host = el('b4Schedule');
    if (!host) return;
    const dep = m.depreciation.byYear, amo = m.amortisation.byYear;
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('Inversión fija', 'Fixed investment')}</th>
      <th class="num">${L2('Diferida', 'Pre-operating')}</th>
      <th class="num">${L2('Reposiciones', 'Replacements')}</th>
      <th class="num">${L2('Capital de trabajo', 'Working capital')}</th>
      <th class="num">${L2('Total invertido', 'Total invested')}</th>
      <th class="num">${L2('Costo de operación', 'Operating cost')}</th>
      <th class="num">${L2('Depreciación y amortización', 'Depreciation and amortisation')}</th>
    </tr></thead><tbody>`;
    let tot = { f: 0, d: 0, r: 0, w: 0, t: 0, c: 0, dep: 0 };
    m.schedule.forEach(s => {
      const cost = s.t === 0 ? 0 : (m.costs[s.t - 1] ? m.costs[s.t - 1].cash : 0);
      const dd = (dep[s.t] || 0) + (amo[s.t] || 0);
      tot.f += s.fixed; tot.d += s.deferred; tot.r += s.replacement; tot.w += s.workingCapital; tot.t += s.total; tot.c += cost; tot.dep += dd;
      html += `<tr${s.t === 0 ? ' class="row-flag"' : ''}>
        <td>${(Number(p.baseYear) || 0) + s.t}${s.t === 0 ? L2(' (año 0)', ' (year 0)') : ''}</td>
        <td class="num">${s.fixed ? fmtMoney(s.fixed, 0) : '—'}</td>
        <td class="num">${s.deferred ? fmtMoney(s.deferred, 0) : '—'}</td>
        <td class="num">${s.replacement ? fmtMoney(s.replacement, 0) : '—'}</td>
        <td class="num">${s.workingCapital ? fmtMoney(s.workingCapital, 0) : '—'}</td>
        <td class="num"><b>${s.total ? fmtMoney(s.total, 0) : '—'}</b></td>
        <td class="num">${cost ? fmtMoney(cost, 0) : '—'}</td>
        <td class="num">${dd ? fmtMoney(dd, 0) : '—'}</td>
      </tr>`;
    });
    html += `<tr class="total-row"><td>${L2('Total', 'Total')}</td>
      <td class="num">${fmtMoney(tot.f, 0)}</td><td class="num">${fmtMoney(tot.d, 0)}</td>
      <td class="num">${fmtMoney(tot.r, 0)}</td><td class="num">${fmtMoney(tot.w, 0)}</td>
      <td class="num"><b>${fmtMoney(tot.t, 0)}</b></td><td class="num">${fmtMoney(tot.c, 0)}</td>
      <td class="num">${fmtMoney(tot.dep, 0)}</td></tr>`;
    host.innerHTML = html + '</tbody></table>';
  }

  function renderDepreciation(m, p) {
    const host = el('b4Depreciation');
    if (!host) return;
    const rows = m.depreciation.detail;
    if (!rows.length) { host.innerHTML = `<p class="hint">${L2('Todavía no hay activos que depreciar.', 'There are no assets to depreciate yet.')}</p>`; return; }
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Activo', 'Asset')}</th><th>${L2('Tipo', 'Kind')}</th>
      <th class="num">${L2('Año de compra', 'Year bought')}</th><th class="num">${L2('Monto', 'Amount')}</th>
      <th class="num">${L2('Vida útil', 'Life')}</th><th class="num">${L2('Depreciación tomada', 'Depreciation taken')}</th>
      <th class="num">${L2('Valor en libros al final', 'Book value at the end')}</th>
    </tr></thead><tbody>`;
    rows.forEach(r => {
      html += `<tr><td>${esc(r.name || '—')}${r.replacement ? ` <span class="chip a">${L2('reposición ' + r.replacement, 'replacement ' + r.replacement)}</span>` : ''}</td>
        <td>${L2(Budget.KINDS[r.kind].es, Budget.KINDS[r.kind].en)}</td>
        <td class="num">${(Number(p.baseYear) || 0) + r.year}</td>
        <td class="num">${fmtMoney(r.amount, 0)}</td>
        <td class="num">${r.life} ${L2('años', 'years')}</td>
        <td class="num">${fmtMoney(r.taken, 0)}</td>
        <td class="num">${fmtMoney(r.book, 0)}</td></tr>`;
    });
    const s = m.salvage;
    html += `<tr class="total-row"><td colspan="5">${L2('Valor de rescate al final del horizonte', 'Salvage value at the end of the horizon')}</td>
      <td class="num"></td><td class="num"><b>${fmtMoney(s.total, 0)}</b></td></tr>
      <tr><td colspan="7" class="hint">${L2(
        `Se compone de ${fmtMoney(s.assets, 0)} de valor en libros de los activos, ${fmtMoney(s.land, 0)} de terreno (que no se deprecia) y ${fmtMoney(s.workingCapital, 0)} de capital de trabajo que se recupera.`,
        `It is made up of ${fmtMoney(s.assets, 0)} of book value of the assets, ${fmtMoney(s.land, 0)} of land (which does not depreciate) and ${fmtMoney(s.workingCapital, 0)} of working capital that comes back.`)}</td></tr>`;
    host.innerHTML = html + '</tbody></table>';
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
    const p = P();
    const byKind = { perennial: 'avocado', annual: 'maize', protected: 'greenhouse', livestock: 'feedlot', agroindustry: 'dairy', infrastructure: 'irrigation', forestry: 'avocado', social: 'maize' };
    const key = byKind[p.kind] || 'maize';
    const ex = ExData4.gridsFor(key);
    const b = B();
    b.investments = ex.investments;
    b.deferred = ex.deferred;
    b.establishment = ex.establishment;
    b.operating = ex.operating;
    b.fixed = ex.fixed;
    Object.assign(b, ex.wc);
    ['investments', 'deferred', 'establishment', 'operating', 'fixed'].forEach(k => { if (G[k]) G[k].set(b[k]); });
    writeForm();
    touch();
    /* the note goes on top of the review messages, which render() has just
       written: clearing them would hide the warnings of the example itself */
    notice(el('b4Messages'), 'info', L2(
      `Presupuesto de ejemplo cargado: ${ExData4.BUDGETS[key].es}. ${ex.note[0]} Los montos son ILUSTRATIVOS: cotiza los tuyos.`,
      `Example budget loaded: ${ExData4.BUDGETS[key].en}. ${ex.note[1]} The amounts are ILLUSTRATIVE: get your own quotations.`));
  }

  function exportCSV() {
    const m = state.budget, p = P();
    if (!m) return;
    const dep = m.depreciation.byYear, amo = m.amortisation.byYear;
    const lines = ['ano,inversion_fija,diferida,reposiciones,capital_de_trabajo,total_invertido,costo_variable,costo_fijo,costo_desembolsable,depreciacion_amortizacion,costo_por_unidad,costo_por_tonelada'];
    m.schedule.forEach(s => {
      const c = s.t === 0 ? null : m.costs[s.t - 1];
      lines.push([(Number(p.baseYear) || 0) + s.t, s.fixed, s.deferred, s.replacement, s.workingCapital, s.total,
        c ? c.variable : 0, c ? c.fixed : 0, c ? c.cash : 0, (dep[s.t] || 0) + (amo[s.t] || 0),
        c && c.perUnit != null ? c.perUnit : '', c && c.perOutput != null ? c.perOutput : ''].map(csvEscape).join(','));
    });
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-inversion-y-costos.csv', 'text/csv;charset=utf-8');
  }

  /* ================================================================
     the grids
     ================================================================ */
  function kindOptions() { return Object.keys(Budget.KINDS).map(k => T(Budget.KINDS[k].es, Budget.KINDS[k].en)).join(' · '); }

  function buildGrids() {
    const b = B();
    const p = P();
    const mk = (name, host, cols, rows) => {
      G[name] = Import.grid(el(host), {
        cols, rows: Math.max(rows, (b[name] || []).length + 1), values: b[name] || [],
        onchange: v => { B()[name] = v; touch(); },
      });
    };
    mk('investments', 'b4Investments', [
      { key: 'name', es: 'Concepto', en: 'Item', wide: true },
      { key: 'kind', es: 'Tipo (terreno, obra, maquinaria…)', en: 'Kind (land, works, machinery…)' },
      { key: 'qty', es: 'Cantidad', en: 'Quantity' },
      { key: 'unitCost', es: 'Costo unitario', en: 'Unit cost' },
      { key: 'year', es: 'Año', en: 'Year' },
      { key: 'life', es: 'Vida útil', en: 'Life' },
      { key: 'salvagePct', es: 'Rescate (%)', en: 'Salvage (%)' },
      { key: 'replace', es: '¿Reponer?', en: 'Replace?' },
    ], 6);
    mk('deferred', 'b4Deferred', [
      { key: 'name', es: 'Concepto', en: 'Item', wide: true },
      { key: 'amount', es: 'Monto', en: 'Amount' },
      { key: 'year', es: 'Año', en: 'Year' },
    ], 3);
    const costCols = [
      { key: 'name', es: 'Concepto', en: 'Item', wide: true },
      { key: 'group', es: 'Grupo', en: 'Group', med: true },
      { key: 'base', es: 'Base (unit / output / total)', en: 'Basis (unit / output / total)' },
      { key: 'qty', es: 'Cantidad', en: 'Quantity' },
      { key: 'unitCost', es: 'Costo unitario', en: 'Unit cost' },
    ];
    mk('establishment', 'b4Establishment', costCols, 4);
    mk('operating', 'b4Operating', costCols, 6);
    mk('fixed', 'b4Fixed', [
      { key: 'name', es: 'Concepto', en: 'Item', wide: true },
      { key: 'amount', es: 'Monto al año', en: 'Amount a year' },
    ], 3);
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b4Example', 'click', loadExample);
    on('b4ExportCSV', 'click', exportCSV);
    ['investments', 'deferred', 'establishment', 'operating', 'fixed'].forEach(k => {
      on('b4Add_' + k, 'click', () => G[k] && G[k].addRows(3));
    });
    on('b4Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="5"]');
      if (btn && !btn.disabled) goStep(5);
      else {
        clearMessages(el('b4Messages'));
        showMessage(el('b4Messages'), 'info', L2('El Bloque 5 (financiamiento y estados proforma) se construye en la siguiente etapa. La inversión, los costos y el capital de trabajo ya quedaron guardados.',
          'Block 5 (financing and pro-forma statements) is built in the next stage. The investment, the costs and the working capital are already saved.'));
        el('b4Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    document.addEventListener('projectchange', () => { if (el('panel-4')) render(); });
    document.addEventListener('marketchange', () => { if (el('panel-4')) render(); });
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { buildGrids(); writeForm(); render(); });
    document.addEventListener('langchange', () => { buildGrids(); writeForm(); render(); });
    document.addEventListener('themechange', render);
    const help = el('b4KindHelp');
    if (help) help.textContent = kindOptions();
  }

  function init() {
    if (!el('panel-4')) return;
    P();
    buildGrids();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block4 = { compute, render, loadExample };
})();
