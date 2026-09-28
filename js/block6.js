/* EconomicsPro — Block 6: the screen of the financial appraisal.

   Almost nothing is entered here: the two rates (which come from Block 2 and
   can be overridden) and, if the study compares technologies, the treatments
   of the marginal analysis. Everything else is read from the statements of
   Block 5 and turned into the indicators, the verdict and the figures. */

(function () {

  let gTreat = null, saveTimer = null;

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.appraisal) state.project.appraisal = Project.defaults().appraisal;
    return state.project;
  }
  const A = () => P().appraisal;

  const FIELDS = [
    ['b6RateProject', 'rateProject', 'pct'],
    ['b6RateEquity', 'rateEquity', 'pct'],
    ['b6Adjust', 'adjust', 'pct'],
    ['b6MinRate', 'minimumRate', 'pct'],
    ['b6FieldPrice', 'fieldPrice', 'num'],
  ];

  function readForm() {
    const a = A();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (n.value.trim() === '') { a[key] = null; return; }
      const v = parseNum(n.value);
      if (v == null) return;
      a[key] = kind === 'pct' ? v / 100 : v;
    });
  }
  function writeForm() {
    const a = A();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = a[key];
      if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
  }

  function compute() {
    const p = P();
    const st = state.statements || (window.Block5 ? Block5.compute() : null);
    if (!st) return null;
    const model = Appraisal.build(A(), p, st);
    /* the marginal analysis travels with the block, but it is independent of
       the project: it compares technologies, not investments */
    const a = A();
    const price = a.fieldPrice != null && a.fieldPrice !== ''
      ? Number(a.fieldPrice)
      : (state.market && state.market.priceFc && state.market.priceFc.values.length ? state.market.priceFc.values[0].value : 0);
    model.marginal = Appraisal.marginal({
      treatments: (a.treatments || []).map(t => ({ name: t.name, yield: parseNum(t.yield), cost: parseNum(t.cost), price: t.price === '' || t.price == null ? null : parseNum(t.price) })),
      price, adjust: a.adjust == null ? 0.1 : a.adjust, minimumRate: a.minimumRate == null ? 1 : a.minimumRate,
    });
    model.fieldPrice = price;
    state.appraisal = model;
    return model;
  }

  /* ================================================================
     drawing
     ================================================================ */
  function render() {
    const p = P();
    const m = compute();
    if (!m) return;

    const ctx = el('b6Context');
    if (ctx) {
      ctx.innerHTML = [
        [L2('Tasa del proyecto', 'Project rate'), fmtPct(m.rateProject, 2)],
        [L2('Tasa del dueño', "Owner's rate"), fmtPct(m.rateEquity, 2)],
        [L2('Horizonte', 'Horizon'), `${m.horizon} ${L2('años', 'years')}`],
        [L2('Precios', 'Prices'), p.priceBasis === 'current' ? L2('corrientes', 'current') : L2('constantes', 'constant')],
      ].map(([a, b]) => `<span class="chip p">${a}: <b>${b}</b></span>`).join(' ');
    }

    const tiles = el('b6Tiles');
    if (tiles) {
      const r = m.project;
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      tiles.innerHTML =
        tile(L2('VAN del proyecto', 'NPV of the project'), fmtMoney(r.npv, 0),
          L2(`a la tasa de ${fmtPct(m.rateProject, 2)}`, `at a rate of ${fmtPct(m.rateProject, 2)}`), r.npv > 0 ? 'ok' : 'bad') +
        tile(L2('TIR', 'IRR'), fmtRate(r.irr, 2),
          r.multipleIRR ? L2('¡hay más de una!', 'there is more than one!') : L2(`contra ${fmtPct(m.rateProject, 2)}`, `against ${fmtPct(m.rateProject, 2)}`),
          r.irr != null && r.irr > m.rateProject ? 'ok' : 'bad') +
        tile(L2('Relación beneficio–costo', 'Benefit–cost ratio'), fmtFixed(r.bc, 2), L2('bruta, descontada', 'gross, discounted'), r.bc > 1 ? 'ok' : 'bad') +
        tile(L2('Recuperación descontada', 'Discounted payback'),
          r.discountedPayback == null ? L2('nunca', 'never') : fmtFixed(r.discountedPayback, 1) + L2(' años', ' years'),
          L2(`sin descontar ${r.payback == null ? '—' : fmtFixed(r.payback, 1)}`, `undiscounted ${r.payback == null ? '—' : fmtFixed(r.payback, 1)}`),
          r.discountedPayback != null ? 'ok' : 'bad') +
        tile(L2('Valor anual equivalente', 'Equivalent annual value'), fmtMoney(r.eaa, 0), L2('por año, durante el horizonte', 'a year, over the horizon'), r.eaa > 0 ? 'ok' : 'bad') +
        tile(L2('VAN del inversionista', 'NPV of the investor'), fmtMoney(m.investor.npv, 0),
          L2(`a la tasa de ${fmtPct(m.rateEquity, 2)}`, `at a rate of ${fmtPct(m.rateEquity, 2)}`), m.investor.npv > 0 ? 'ok' : 'bad');
    }

    const v = el('b6Verdict');
    if (v) v.innerHTML = `<b>${L2('Dictamen', 'Verdict')}</b> ${L2(m.verdict.es, m.verdict.en)}`;

    renderTable(m);
    renderMarginal(m, p);
    Plots6.drawProfile(el('b6ProfileChart'), m);
    Plots6.drawWaterfall(el('b6WaterfallChart'), m);
    Plots6.drawPayback(el('b6PaybackChart'), m);
    Plots6.drawMarginal(el('b6MarginalChart'), m.marginal);

    const auto = el('b6AutoNote');
    if (auto) {
      auto.innerHTML = L2(
        `Por omisión se usan las tasas del Bloque 2: ${fmtPct(m.automatic.project, 2)} para el flujo del proyecto y ${fmtPct(m.automatic.equity, 2)} para el del dueño. Deja las casillas vacías para seguirlas, o escribe otra tasa para probar.`,
        `By default the rates of Block 2 are used: ${fmtPct(m.automatic.project, 2)} for the project flow and ${fmtPct(m.automatic.equity, 2)} for the owner's. Leave the boxes empty to follow them, or type another rate to try it out.`);
    }

    const box = el('b6Messages');
    if (box) {
      clearMessages(box);
      m.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!m.messages.some(x => x.level === 'error' || x.level === 'warning')) {
        showMessage(box, 'success', L2('Los indicadores son consistentes entre sí y con los estados del Bloque 5.', 'The indicators are consistent with one another and with the statements of Block 5.'));
      }
    }
    const next = el('b6Next');
    if (next) next.disabled = m.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('appraisalchange', { detail: { appraisal: m } }));
  }

  function renderTable(m) {
    const host = el('b6Table');
    if (!host) return;
    const row = (label, a, b, note) => `<tr><td>${label}</td><td class="num">${a}</td><td class="num">${b}</td><td>${note || ''}</td></tr>`;
    const P1 = m.project, I = m.investor;
    host.innerHTML = `<table class="mini-table"><thead><tr>
      <th>${L2('Indicador', 'Indicator')}</th>
      <th class="num">${L2('Flujo del proyecto', 'Project flow')}</th>
      <th class="num">${L2('Flujo del inversionista', 'Investor flow')}</th>
      <th>${L2('Cómo se lee', 'How to read it')}</th>
    </tr></thead><tbody>
      ${row(L2('Tasa de descuento usada', 'Discount rate used'), fmtPct(m.rateProject, 2), fmtPct(m.rateEquity, 2),
      L2('el costo de todo el capital, y el del dinero del dueño', 'the cost of all the capital, and that of the owner\'s money'))}
      ${row(L2('Valor actual neto', 'Net present value'), `<b>${fmtMoney(P1.npv, 0)}</b>`, `<b>${fmtMoney(I.npv, 0)}</b>`,
      L2('riqueza que agrega, hoy, por encima de la tasa', 'wealth added, today, above the rate'))}
      ${row(L2('Tasa interna de retorno', 'Internal rate of return'), fmtRate(P1.irr, 2), fmtRate(I.irr, 2),
      L2('rendimiento anual mientras el dinero está dentro', 'annual return while the money is inside'))}
      ${row(L2('TIR modificada', 'Modified IRR'), fmtRate(P1.mirr, 2), fmtRate(I.mirr, 2),
      L2('la misma, reinvirtiendo a una tasa realista', 'the same, reinvesting at a realistic rate'))}
      ${row(L2('Relación beneficio–costo', 'Benefit–cost ratio'), fmtFixed(P1.bc, 2), fmtFixed(I.bc, 2),
      L2('pesos de beneficio por peso de costo, descontados', 'pesos of benefit per peso of cost, discounted'))}
      ${row(L2('Relación B/C neta', 'Net B/C ratio'), fmtFixed(P1.netBC, 2), fmtFixed(I.netBC, 2),
      L2('flujos positivos entre negativos', 'positive flows over negative ones'))}
      ${row(L2('Índice de rentabilidad', 'Profitability index'), fmtFixed(P1.pi, 2), fmtFixed(I.pi, 2),
      L2('para jerarquizar con presupuesto limitado', 'to rank under a limited budget'))}
      ${row(L2('Recuperación simple', 'Simple payback'), P1.payback == null ? '—' : fmtFixed(P1.payback, 1), I.payback == null ? '—' : fmtFixed(I.payback, 1),
      L2('años, sin tomar en cuenta el costo del dinero', 'years, ignoring the cost of money'))}
      ${row(L2('Recuperación descontada', 'Discounted payback'), P1.discountedPayback == null ? '—' : fmtFixed(P1.discountedPayback, 1), I.discountedPayback == null ? '—' : fmtFixed(I.discountedPayback, 1),
      L2('años, ya descontados', 'years, already discounted'))}
      ${row(L2('Valor anual equivalente', 'Equivalent annual value'), fmtMoney(P1.eaa, 0), fmtMoney(I.eaa, 0),
      L2('lo único comparable entre horizontes distintos', 'the only thing comparable between different horizons'))}
    </tbody></table>`;
  }

  function renderMarginal(m, p) {
    const host = el('b6Marginal');
    if (!host) return;
    const mg = m.marginal;
    if (!mg.rows.length) {
      host.innerHTML = `<p class="hint">${L2('Escribe al menos dos tratamientos para comparar tecnologías.', 'Type at least two treatments to compare technologies.')}</p>`;
      const note = el('b6MarginalNote'); if (note) note.innerHTML = '';
      return;
    }
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Tratamiento', 'Treatment')}</th>
      <th class="num">${L2('Rendimiento', 'Yield')}</th>
      <th class="num">${L2('Rendimiento ajustado', 'Adjusted yield')}</th>
      <th class="num">${L2('Beneficio bruto de campo', 'Gross field benefit')}</th>
      <th class="num">${L2('Costos que varían', 'Costs that vary')}</th>
      <th class="num">${L2('Beneficio neto', 'Net benefit')}</th>
      <th class="num">${L2('Tasa de retorno marginal', 'Marginal rate of return')}</th>
    </tr></thead><tbody>`;
    mg.rows.forEach(r => {
      const rec = mg.recommended === r;
      html += `<tr${r.dominated ? ' class="row-flag"' : rec ? ' class="row-best"' : ''}>
        <td>${esc(r.name || '—')}${r.dominated ? ` <span class="chip a">${L2('dominado', 'dominated')}</span>` : ''}${rec ? ` <span class="chip p">${L2('recomendado', 'recommended')}</span>` : ''}</td>
        <td class="num">${fmtNum(r.yield, 2)}</td>
        <td class="num">${fmtNum(r.adjusted, 2)}</td>
        <td class="num">${fmtMoney(r.gross, 0)}</td>
        <td class="num">${fmtMoney(r.varCost, 0)}</td>
        <td class="num"><b>${fmtMoney(r.net, 0)}</b></td>
        <td class="num">${r.dominated ? '—' : (r.mrr == null ? '' : fmtPct(r.mrr, 0))}</td>
      </tr>`;
    });
    host.innerHTML = html + '</tbody></table>';
    const note = el('b6MarginalNote');
    if (note) {
      const rec = mg.recommended;
      const head = L2(`Con un ajuste del rendimiento de ${fmtPct(mg.adjust, 0)} y una tasa mínima de retorno del ${fmtPct(mg.minimum, 0)}, `,
        `With a yield adjustment of ${fmtPct(mg.adjust, 0)} and a minimum rate of return of ${fmtPct(mg.minimum, 0)}, `);
      const tail = L2(' Los tratamientos marcados como dominados cuestan más y dejan menos que otro más barato, así que se descartan sin discutir la tasa.',
        ' The treatments marked as dominated cost more and leave less than a cheaper one, so they are discarded without discussing the rate.');
      /* when the recommendation is the cheapest treatment, no step earned the
         minimum rate: that is a result, and it has to be said as one */
      const body = !rec ? '' : rec.mrr == null
        ? L2(`conviene quedarse con <b>${esc(rec.name || '')}</b>: ningún escalón más caro alcanza esa tasa, así que no se justifica cambiar de tecnología.`,
          `it is best to stay with <b>${esc(rec.name || '')}</b>: no dearer step reaches that rate, so changing technology is not justified.`)
        : L2(`se recomienda <b>${esc(rec.name || '')}</b>: cada peso adicional que exige sobre el tratamiento anterior devuelve ${fmtPct(rec.mrr, 0)}.`,
          `the recommendation is <b>${esc(rec.name || '')}</b>: every extra peso it demands over the previous treatment returns ${fmtPct(rec.mrr, 0)}.`);
      note.innerHTML = !rec ? '' : head + body + tail;
    }
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

  function loadMarginalExample() {
    const a = A();
    a.treatments = [
      { name: 'Sin fertilizar', yield: '3.0', cost: '0', price: '' },
      { name: '60 kg N', yield: '4.2', cost: '3600', price: '' },
      { name: '120 kg N', yield: '5.0', cost: '7200', price: '' },
      { name: '120 kg N + herbicida', yield: '5.1', cost: '9000', price: '' },
      { name: '180 kg N', yield: '5.2', cost: '10800', price: '' },
    ];
    a.fieldPrice = 5600;
    if (gTreat) gTreat.set(a.treatments);
    writeForm();
    touch();
    notice(el('b6Messages'), 'info', L2(
      'Ejemplo de niveles de fertilización en maíz, con un tratamiento dominado a propósito para que se vea cómo se descarta. Los datos son ILUSTRATIVOS: usa los de tu experimento.',
      'An example of fertiliser levels in maize, with one dominated treatment on purpose so the discarding can be seen. The data are ILLUSTRATIVE: use those of your own experiment.'));
  }

  function exportCSV() {
    const m = state.appraisal, p = P();
    if (!m) return;
    const lines = ['indicador,flujo_del_proyecto,flujo_del_inversionista'];
    const add = (k, a, b) => lines.push([k, a, b].map(csvEscape).join(','));
    add('tasa_de_descuento', m.rateProject, m.rateEquity);
    add('van', m.project.npv, m.investor.npv);
    add('tir', m.project.irr, m.investor.irr);
    add('tir_modificada', m.project.mirr, m.investor.mirr);
    add('relacion_beneficio_costo', m.project.bc, m.investor.bc);
    add('relacion_bc_neta', m.project.netBC, m.investor.netBC);
    add('indice_de_rentabilidad', m.project.pi, m.investor.pi);
    add('recuperacion_simple', m.project.payback, m.investor.payback);
    add('recuperacion_descontada', m.project.discountedPayback, m.investor.discountedPayback);
    add('valor_anual_equivalente', m.project.eaa, m.investor.eaa);
    lines.push('');
    lines.push('descomposicion_del_van,valor_presente');
    [['ingresos', m.parts.revenue], ['costos_de_operacion', -m.parts.cost], ['impuestos', -m.parts.tax],
      ['inversion', -m.parts.investment], ['valor_de_rescate', m.parts.salvage], ['van', m.parts.npv]]
      .forEach(([k, v]) => lines.push([k, v].map(csvEscape).join(',')));
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-evaluacion-financiera.csv', 'text/csv;charset=utf-8');
  }

  function buildGrid() {
    const a = A();
    gTreat = Import.grid(el('b6Treatments'), {
      cols: [
        { key: 'name', es: 'Tratamiento', en: 'Treatment', wide: true },
        { key: 'yield', es: 'Rendimiento', en: 'Yield' },
        { key: 'cost', es: 'Costos que varían', en: 'Costs that vary' },
        { key: 'price', es: 'Precio de campo (opcional)', en: 'Field price (optional)' },
      ],
      rows: Math.max(4, (a.treatments || []).length + 1),
      values: a.treatments || [],
      onchange: v => { A().treatments = v; touch(); },
    });
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b6ExportCSV', 'click', exportCSV);
    on('b6MarginalExample', 'click', loadMarginalExample);
    on('b6AddTreat', 'click', () => gTreat && gTreat.addRows(3));
    on('b6ResetRates', 'click', () => { const a = A(); a.rateProject = null; a.rateEquity = null; writeForm(); touch(); });
    on('b6Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="7"]');
      if (btn && !btn.disabled) goStep(7);
      else {
        clearMessages(el('b6Messages'));
        showMessage(el('b6Messages'), 'info', L2('El Bloque 7 (riesgo e incertidumbre) se construye en la siguiente etapa. Los indicadores ya quedaron listos para someterse a sensibilidad.',
          'Block 7 (risk and uncertainty) is built in the next stage. The indicators are ready to be put through sensitivity.'));
        el('b6Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    ['projectchange', 'marketchange', 'budgetchange', 'statementschange'].forEach(ev =>
      document.addEventListener(ev, () => { if (el('panel-6')) render(); }));
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { buildGrid(); writeForm(); render(); });
    document.addEventListener('langchange', () => { buildGrid(); writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  function init() {
    if (!el('panel-6')) return;
    P();
    buildGrid();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block6 = { compute, render, loadMarginalExample };
})();
