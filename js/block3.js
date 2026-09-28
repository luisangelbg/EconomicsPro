/* EconomicsPro — Block 3: the screen of market, prices and revenue.

   It reads the assumptions of Block 2 (scale, horizon, years to bear, base
   year and whether the study is at constant or current prices), takes the
   historical series the user types, pastes or imports, and ends in the table
   that Blocks 5 and 6 will read: how much is produced and how much is sold
   each year, at what price, and what revenue that leaves. */

(function () {

  let gSeries = null, gChannels = null, gByproducts = null;
  let saveTimer = null;

  /* the project of Block 2; if it has not been opened yet, its defaults */
  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    if (!state.project.market) state.project.market = Project.defaults().market;
    return state.project;
  }
  const M = () => P().market;

  /* ================================================================
     the fields of the form
     ================================================================ */
  const FIELDS = [
    ['b3Deflate', 'deflate', 'check'],
    ['b3PriceMethod', 'priceMethod', 'text'],
    ['b3PriceLastN', 'priceLastN', 'int'],
    ['b3PriceGrowth', 'priceGrowth', 'pct'],
    ['b3PriceFixed', 'priceFixed', 'num'],
    ['b3YieldMethod', 'yieldMethod', 'text'],
    ['b3YieldLastN', 'yieldLastN', 'int'],
    ['b3YieldGrowth', 'yieldGrowth', 'pct'],
    ['b3YieldFixed', 'yieldFixed', 'num'],
    ['b3Loss', 'loss', 'pct'],
    ['b3Sold', 'soldShare', 'pct'],
    ['b3Other', 'otherIncome', 'num'],
    ['b3Demand', 'demand', 'num'],
    ['b3DemandGrowth', 'demandGrowth', 'pct'],
    ['b3Supply', 'supply', 'num'],
    ['b3SupplyGrowth', 'supplyGrowth', 'pct'],
    ['b3Elasticity', 'elasticity', 'num'],
  ];

  function readForm() {
    const m = M();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n) return;
      if (kind === 'check') { m[key] = n.checked; return; }
      if (kind === 'text') { m[key] = n.value; return; }
      const v = parseNum(n.value);
      if (v == null) { if (n.value.trim() === '') m[key] = kind === 'num' ? null : m[key]; return; }
      m[key] = kind === 'pct' ? v / 100 : kind === 'int' ? Math.round(v) : v;
    });
  }

  function writeForm() {
    const m = M();
    FIELDS.forEach(([id, key, kind]) => {
      const n = el(id);
      if (!n || n === document.activeElement) return;
      const v = m[key];
      if (kind === 'check') n.checked = !!v;
      else if (kind === 'pct') n.value = v == null ? '' : +(v * 100).toFixed(4);
      else n.value = v == null ? '' : v;
    });
    /* only the fields that the chosen method needs stay on screen */
    const show = (id, on) => { const n = el(id); if (n) n.style.display = on ? '' : 'none'; };
    show('b3PriceLastNField', m.priceMethod === 'mean');
    show('b3PriceGrowthField', m.priceMethod === 'cagr');
    show('b3PriceFixedField', m.priceMethod === 'fixed');
    show('b3YieldLastNField', m.yieldMethod === 'mean');
    show('b3YieldGrowthField', m.yieldMethod === 'cagr');
    show('b3YieldFixedField', m.yieldMethod === 'fixed');
  }

  /* ================================================================
     the calculation
     ================================================================ */
  function compute() {
    const p = P(), m = M();
    const horizon = Math.max(1, Math.round(Number(p.horizon) || 1));

    /* the series, as numbers */
    const parsed = Import.numericRows(m.series || [], ['year', 'price', 'yield', 'index']);
    const clean = parsed.rows.filter(r => r.year != null).sort((a, b) => a.year - b.year);
    const years = clean.map(r => r.year);
    const nominal = clean.map(r => r.price);
    const yields = clean.map(r => r.yield);
    const index = clean.map(r => r.index);

    /* real prices */
    const hasIndex = index.some(v => v != null && isFinite(v));
    const deflated = (m.deflate && hasIndex)
      ? Market.deflate(years, nominal, index, Number(p.baseYear) || years[years.length - 1], { inflation: Number(p.inflation) || 0 })
      : { real: nominal.slice(), baseIndex: null, baseYear: null, missing: 0 };

    const priceDesc = Market.describe(years, deflated.real);
    const yieldDesc = Market.describe(years, yields);

    const priceFc = Market.forecast(priceDesc, {
      method: m.priceMethod, horizon, lastN: m.priceLastN,
      growth: m.priceMethod === 'cagr' ? (m.priceGrowth == null ? priceDesc.cagr : m.priceGrowth) : 0,
      fixed: m.priceFixed, lastYear: Number(p.baseYear) || 0,
    });
    const yieldFc = Market.forecast(yieldDesc, {
      method: m.yieldMethod, horizon, lastN: m.yieldLastN,
      growth: m.yieldMethod === 'cagr' ? (m.yieldGrowth == null ? yieldDesc.cagr : m.yieldGrowth) : 0,
      fixed: m.yieldFixed, lastYear: Number(p.baseYear) || 0,
    });

    /* a project at current prices carries the inflation of each year; at
       constant prices the forecast is already in money of the base year */
    const infl = p.priceBasis === 'current' ? (Number(p.inflation) || 0) : 0;
    const priceByYear = priceFc.values.map((v, i) => v.value * Math.pow(1 + infl, i + 1));
    const yieldByYear = yieldFc.values.map((v, i) => v.value * Market.yieldShare(i + 1, Number(p.gestation) || 0, Number(p.ramp) || 1));

    const channels = (m.channels || []).map(c => ({ name: c.name, share: parseNum(c.share), factor: parseNum(c.factor) }))
      .filter(c => c.share != null && c.share > 0);
    const byproducts = (m.byproducts || []).map(b => ({ name: b.name, perUnit: parseNum(b.perUnit), price: parseNum(b.price) }))
      .filter(b => b.perUnit > 0 && b.price > 0);

    const prog = Market.programme({
      horizon, baseYear: Number(p.baseYear) || 0,
      scale: Number(p.scale) || 0, gestation: p.gestation, ramp: p.ramp,
      yieldFull: yieldFc.values.length ? yieldFc.values[yieldFc.values.length - 1].value : 0,
      yieldByYear, priceByYear,
      loss: m.loss, soldShare: m.soldShare,
      channels, byproducts, otherIncome: m.otherIncome,
    });

    const balance = (Number(m.demand) > 0) ? Market.marketBalance({
      demand: m.demand, supply: m.supply, demandGrowth: m.demandGrowth, supplyGrowth: m.supplyGrowth,
      elasticity: m.elasticity, horizon, projectVolume: prog.atFull ? prog.atFull.volume : 0,
    }) : null;

    const model = {
      years, deflated, priceDesc, yieldDesc, priceFc, yieldFc, prog, balance,
      priceMethod: m.priceMethod, priceGrowth: m.priceGrowth, loss: m.loss, channels,
      bad: parsed.bad,
    };
    model.messages = Market.validate(Object.assign({}, model, { programme: prog }), p);
    state.market = model;
    return model;
  }

  /* ================================================================
     drawing the results
     ================================================================ */
  function render() {
    const p = P(), m = M();
    const r = compute();

    /* the assumptions that come from Block 2 */
    const ctx = el('b3Context');
    if (ctx) {
      ctx.innerHTML = [
        [L2('Escala', 'Scale'), `${fmtNum(p.scale, 2)} ${esc(p.unitName)}`],
        [L2('Horizonte', 'Horizon'), `${p.horizon} ${L2('años', 'years')}`],
        [L2('Primera producción', 'First production'), p.gestation > 0 ? L2(`año ${p.gestation + 1}`, `year ${p.gestation + 1}`) : L2('año 1', 'year 1')],
        [L2('Precios', 'Prices'), p.priceBasis === 'current' ? L2('corrientes', 'current') : L2(`constantes de ${p.baseYear}`, `constant of ${p.baseYear}`)],
      ].map(([a, b]) => `<span class="chip p">${a}: <b>${b}</b></span>`).join(' ');
    }

    /* the description of the two series */
    const stats = el('b3Stats');
    if (stats) {
      const tile = (label, value, sub, cls) =>
        `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
      const pd = r.priceDesc, yd = r.yieldDesc;
      /* the slope goes in the big line and the test below it: with both together
         the tile wrapped to three lines and grew taller than the rest */
      const trendTxt = d => !d.trend ? '—' : L2(
        `${d.trend.b >= 0 ? '+' : '−'}${fmtNum(Math.abs(d.trend.b), 2)} por año`,
        `${d.trend.b >= 0 ? '+' : '−'}${fmtNum(Math.abs(d.trend.b), 2)} a year`);
      const trendSub = d => !d.trend ? '' : L2(
        `${pEq(d.trend.p)}${d.trend.r2 == null ? '' : ` · r² = ${fmtFixed(d.trend.r2, 2)}`}${d.trend.significant ? '' : ' · no significativa'}`,
        `${pEq(d.trend.p)}${d.trend.r2 == null ? '' : ` · r² = ${fmtFixed(d.trend.r2, 2)}`}${d.trend.significant ? '' : ' · not significant'}`);
      stats.innerHTML = pd.n < 2 ? '' :
        tile(L2('Precio real medio', 'Mean real price'), fmtMoney(pd.mean, 0), L2(`${pd.n} años · CV ${fmtPct(pd.cv, 0)}`, `${pd.n} years · CV ${fmtPct(pd.cv, 0)}`), pd.cv > 0.25 ? 'warn' : '') +
        tile(L2('Tendencia del precio', 'Price trend'), trendTxt(pd), trendSub(pd), pd.trend && pd.trend.significant ? 'ok' : '') +
        tile(L2('Crecimiento real anual', 'Real annual growth'), fmtRate(pd.cagr, 1), L2('TCMA de la serie', 'compound growth of the series')) +
        tile(L2('Rendimiento medio', 'Mean yield'), fmtNum(yd.mean, 2) + ' / ' + esc(p.unitName), L2(`CV ${fmtPct(yd.cv, 0)} · máximo ${fmtNum(yd.max, 2)}`, `CV ${fmtPct(yd.cv, 0)} · highest ${fmtNum(yd.max, 2)}`)) +
        tile(L2('Precio proyectado', 'Projected price'), fmtMoney(r.priceFc.values.length ? r.priceFc.values[0].value : null, 0),
          L2(`primer año · ${r.priceFc.note[0]}`, `first year · ${r.priceFc.note[1]}`), 'ok') +
        tile(L2('Rendimiento pleno', 'Full yield'), fmtNum(r.yieldFc.values.length ? r.yieldFc.values[r.yieldFc.values.length - 1].value : null, 2),
          L2(`por ${p.unitName} · ${r.yieldFc.note[0]}`, `per ${p.unitName} · ${r.yieldFc.note[1]}`), 'ok');
    }

    /* in which pesos the real series is written */
    const note = el('b3DeflateNote');
    if (note) {
      const d = r.deflated;
      note.innerHTML = !m.deflate || d.baseYear == null
        ? L2('La serie se está usando en valores <b>nominales</b>: los años no son comparables entre sí y la tendencia mediría inflación. Escribe el índice de precios y activa «Deflactar».',
          'The series is being used in <b>nominal</b> values: the years are not comparable and the trend would measure inflation. Type the price index and tick "Deflate".')
        : L2(`Serie deflactada a pesos de <b>${d.baseYear}</b>${d.extrapolated ? `, extendiendo el índice con la inflación de ${fmtPct(p.inflation, 2)} declarada en el Bloque 2` : ''}.`,
          `Series deflated to <b>${d.baseYear}</b> pesos${d.extrapolated ? `, carrying the index forward with the ${fmtPct(p.inflation, 2)} inflation declared in Block 2` : ''}.`);
    }

    /* the two series with their forecast */
    Plots3.drawSeries(el('b3PriceChart'), r.priceDesc, r.priceFc, { showTrend: m.priceMethod === 'trend', ylab: T('precio real', 'real price') });
    Plots3.drawSeries(el('b3YieldChart'), r.yieldDesc, r.yieldFc, { showTrend: m.yieldMethod === 'trend', money: false, ylab: T('rendimiento', 'yield') });

    /* the market */
    const mk = el('b3MarketTiles');
    if (mk) {
      if (!r.balance) mk.innerHTML = `<p class="hint">${L2('Escribe la demanda del mercado para ver la participación del proyecto.', 'Type the demand of the market to see the share of the project.')}</p>`;
      else {
        const tile = (label, value, sub, cls) =>
          `<div class="stat-tile${cls ? ' ' + cls : ''}"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`;
        mk.innerHTML =
          tile(L2('Demanda insatisfecha', 'Unsatisfied demand'), fmtNum(r.balance.gap, 0), L2('en el primer año', 'in the first year'), r.balance.gap > 0 ? 'ok' : 'bad') +
          /* a small project takes a tiny slice of its market: with one decimal
             it would read as a flat zero, which says nothing */
          tile(L2('Participación del proyecto', 'Share of the project'), fmtRate(r.balance.share, r.balance.share < 0.01 ? 2 : 1), L2('del mercado total', 'of the whole market'), r.balance.share > 0.2 ? 'warn' : '') +
          tile(L2('Cubre de la brecha', 'Covers of the gap'), fmtRate(r.balance.shareOfGap, r.balance.shareOfGap < 0.01 ? 2 : 1), L2('de la demanda insatisfecha', 'of the unsatisfied demand')) +
          tile(L2('Efecto sobre el precio', 'Effect on the price'), r.balance.priceEffect == null ? '—' : fmtPct(r.balance.priceEffect, 1),
            L2('según la elasticidad indicada', 'according to the elasticity given'), r.balance.priceEffect != null && r.balance.priceEffect < -0.03 ? 'warn' : '');
      }
    }
    Plots3.drawMarket(el('b3MarketChart'), r.balance, {
      projectVolume: r.prog.atFull ? r.prog.atFull.volume : 0,
      unit: T('volumen al año', 'volume a year'),
    });

    /* the programme */
    renderProgramme(r, p);
    Plots3.drawProgramme(el('b3ProgChart'), r.prog);

    /* the messages */
    const box = el('b3Messages');
    if (box) {
      clearMessages(box);
      if (r.bad.length) showMessage(box, 'warning', L2(`Hay valores que no se pudieron leer como número en la(s) fila(s) ${r.bad.join(', ')}.`, `There are values that could not be read as a number in row(s) ${r.bad.join(', ')}.`));
      r.messages.forEach(x => showMessage(box, x.level === 'error' ? 'error' : x.level === 'warning' ? 'warning' : 'info', L2(x.es, x.en)));
      if (!r.messages.some(x => x.level === 'error' || x.level === 'warning') && !r.bad.length) {
        showMessage(box, 'success', L2('La serie, la proyección y el programa de ventas son coherentes.', 'The series, the forecast and the sales programme are coherent.'));
      }
    }

    const next = el('b3Next');
    if (next) next.disabled = r.messages.some(x => x.level === 'error');
    document.dispatchEvent(new CustomEvent('marketchange', { detail: { market: r } }));
  }

  function renderProgramme(r, p) {
    const host = el('b3Programme');
    if (!host) return;
    const rows = r.prog.rows;
    const t = r.prog.totals;
    const unit = esc(p.unitName);
    let html = `<table class="mini-table"><thead><tr>
      <th>${L2('Año', 'Year')}</th>
      <th class="num">${L2('% del rendimiento', '% of the yield')}</th>
      <th class="num">${L2(`Rendimiento / ${unit}`, `Yield / ${unit}`)}</th>
      <th class="num">${L2('Producción', 'Production')}</th>
      <th class="num">${L2('Merma', 'Losses')}</th>
      <th class="num">${L2('Volumen vendido', 'Volume sold')}</th>
      <th class="num">${L2('Precio', 'Price')}</th>
      <th class="num">${L2('Ingreso principal', 'Main revenue')}</th>
      <th class="num">${L2('Subproductos y otros', 'By-products and other')}</th>
      <th class="num">${L2('Ingreso total', 'Total revenue')}</th>
    </tr></thead><tbody>`;
    rows.forEach(row => {
      html += `<tr${row.share === 0 ? ' class="row-flag"' : ''}>
        <td>${row.year || row.t}</td>
        <td class="num">${fmtPct(row.share, 0)}</td>
        <td class="num">${fmtNum(row.yield, 2)}</td>
        <td class="num">${fmtNum(row.production, 1)}</td>
        <td class="num">${fmtNum(row.loss, 1)}</td>
        <td class="num">${fmtNum(row.volume, 1)}</td>
        <td class="num">${fmtMoney(row.effectivePrice, 0)}</td>
        <td class="num">${fmtMoney(row.revenue, 0)}</td>
        <td class="num">${fmtMoney(row.byproducts + row.other, 0)}</td>
        <td class="num"><b>${fmtMoney(row.total, 0)}</b></td>
      </tr>`;
    });
    html += `<tr class="total-row"><td>${L2('Total', 'Total')}</td><td class="num"></td><td class="num"></td>
      <td class="num">${fmtNum(t.production, 1)}</td><td class="num"></td><td class="num">${fmtNum(t.volume, 1)}</td>
      <td class="num"></td><td class="num">${fmtMoney(t.revenue, 0)}</td><td class="num">${fmtMoney(t.total - t.revenue, 0)}</td>
      <td class="num"><b>${fmtMoney(t.total, 0)}</b></td></tr>`;
    host.innerHTML = html + '</tbody></table>';
  }

  /* ================================================================
     saving, importing and exporting
     ================================================================ */
  function touch() {
    readForm();
    writeForm();
    render();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Project.save(P()), 500);
  }

  function exportCSV() {
    const r = state.market;
    if (!r) return;
    const p = P();
    const head = ['ano', 'participacion_rendimiento', 'rendimiento_por_unidad', 'produccion', 'merma', 'volumen_vendido',
      'precio', 'precio_efectivo', 'ingreso_principal', 'subproductos', 'otros_ingresos', 'ingreso_total'];
    const lines = [head.join(',')];
    r.prog.rows.forEach(row => lines.push([row.year, row.share, row.yield, row.production, row.loss, row.volume,
      row.price, row.effectivePrice, row.revenue, row.byproducts, row.other, row.total].map(csvEscape).join(',')));
    download(lines.join('\n'), slug(p.name || 'proyecto') + '-programa-de-ventas.csv', 'text/csv;charset=utf-8');
  }

  function loadExample() {
    const p = P();
    /* the example series that goes with the kind of project chosen in Block 2 */
    const byKind = { perennial: 'avocado', annual: 'maize', protected: 'greenhouse', livestock: 'feedlot', agroindustry: 'dairy', infrastructure: 'irrigation', forestry: 'avocado', social: 'maize' };
    const key = byKind[p.kind] || 'maize';
    const m = M();
    m.series = ExData3.rowsFor(key);
    const mk = ExData3.MARKETS[key];
    if (mk) {
      m.demand = mk.demand; m.supply = mk.supply;
      m.demandGrowth = mk.demandGrowth; m.supplyGrowth = mk.supplyGrowth;
      m.elasticity = mk.elasticity;
    }
    gSeries.set(m.series);
    writeForm();
    touch();
    notice(el('b3Messages'), 'info', L2(
      `Serie de ejemplo cargada: ${ExData3.SERIES[key].es}. Son valores ILUSTRATIVOS, del orden de magnitud real, no cifras oficiales: sustitúyelos por la serie del SIAP, del SNIIM o la que uses en tu estudio.`,
      `Example series loaded: ${ExData3.SERIES[key].en}. These are ILLUSTRATIVE values, of the right order of magnitude, not official figures: replace them with the series of the SIAP, the SNIIM or whatever your study uses.`));
  }

  function importFile(file) {
    Import.readFile(file, rows => {
      if (!rows.length) return;
      const body = Import.looksLikeHeader(rows[0]) ? rows.slice(1) : rows;
      const m = M();
      m.series = body.map(r => ({
        year: String(r[0] == null ? '' : r[0]).trim(),
        price: String(r[1] == null ? '' : r[1]).trim(),
        yield: String(r[2] == null ? '' : r[2]).trim(),
        index: String(r[3] == null ? '' : r[3]).trim(),
      })).filter(r => r.year || r.price || r.yield);
      gSeries.set(m.series);
      touch();
      notice(el('b3Messages'), 'success', L2(`Se leyeron ${m.series.length} años del archivo.`, `${m.series.length} years were read from the file.`));
    }, msg => {
      clearMessages(el('b3Messages'));
      showMessage(el('b3Messages'), 'error', msg);
    });
  }

  /* ================================================================
     building the screen
     ================================================================ */
  function buildGrids() {
    const m = M();
    const p = P();
    gSeries = Import.grid(el('b3Series'), {
      cols: [
        { key: 'year', es: 'Año', en: 'Year' },
        { key: 'price', es: 'Precio nominal', en: 'Nominal price' },
        { key: 'yield', es: `Rendimiento por ${p.unitName}`, en: `Yield per ${p.unitName}` },
        { key: 'index', es: 'Índice de precios', en: 'Price index' },
      ],
      rows: Math.max(10, (m.series || []).length),
      values: m.series || [],
      onchange: v => { M().series = v; touch(); },
    });
    gChannels = Import.grid(el('b3Channels'), {
      cols: [
        { key: 'name', es: 'Canal de venta', en: 'Sales channel' },
        { key: 'share', es: '% del volumen', en: '% of the volume' },
        { key: 'factor', es: 'Factor del precio', en: 'Price factor' },
      ],
      rows: Math.max(3, (m.channels || []).length),
      values: m.channels || [],
      onchange: v => { M().channels = v; touch(); },
    });
    gByproducts = Import.grid(el('b3Byproducts'), {
      cols: [
        { key: 'name', es: 'Subproducto', en: 'By-product' },
        { key: 'perUnit', es: 'Cantidad por unidad producida', en: 'Amount per unit produced' },
        { key: 'price', es: 'Precio', en: 'Price' },
      ],
      rows: Math.max(2, (m.byproducts || []).length),
      values: m.byproducts || [],
      onchange: v => { M().byproducts = v; touch(); },
    });
  }

  function wire() {
    FIELDS.forEach(([id]) => {
      const n = el(id);
      if (n) { n.addEventListener('input', touch); n.addEventListener('change', touch); }
    });
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b3Example', 'click', loadExample);
    on('b3Import', 'click', () => el('b3File').click());
    on('b3File', 'change', () => { const f = el('b3File'); if (f.files[0]) importFile(f.files[0]); f.value = ''; });
    on('b3AddRows', 'click', () => gSeries.addRows(5));
    on('b3ClearSeries', 'click', () => { M().series = []; gSeries.set([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]); touch(); });
    on('b3ExportCSV', 'click', exportCSV);
    on('b3Next', 'click', () => {
      const btn = document.querySelector('.step-btn[data-step="4"]');
      if (btn && !btn.disabled) goStep(4);
      else {
        clearMessages(el('b3Messages'));
        showMessage(el('b3Messages'), 'info', L2('El Bloque 4 (inversión, costos y capital de trabajo) se construye en la siguiente etapa. El programa de ventas ya quedó guardado.',
          'Block 4 (investment, costs and working capital) is built in the next stage. The sales programme is already saved.'));
        el('b3Messages').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    /* whenever Block 2 changes an assumption, this block recomputes */
    document.addEventListener('projectchange', () => { if (el('panel-3')) { buildHeaders(); render(); } });
    /* a whole project was opened: everything is rebuilt from it */
    document.addEventListener('projectloaded', () => { buildGrids(); writeForm(); render(); });
    document.addEventListener('langchange', () => { buildHeaders(); writeForm(); render(); });
    document.addEventListener('themechange', render);
  }

  /* the column headers name the unit of the project, which Block 2 sets */
  function buildHeaders() {
    if (!gSeries) return;
    const p = P();
    gSeries.redraw && gSeries.redraw();
    const th = el('b3Series') && el('b3Series').querySelectorAll('thead th')[2];
    if (th) th.innerHTML = L2(`Rendimiento por ${esc(p.unitName)}`, `Yield per ${esc(p.unitName)}`);
  }

  function init() {
    if (!el('panel-3')) return;
    P();
    buildGrids();
    wire();
    writeForm();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block3 = { compute, render, loadExample };
})();
