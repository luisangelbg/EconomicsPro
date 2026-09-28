/* EconomicsPro — Block 1: the two interactive laboratories of the home page.

   PROJECT LAB. Six real agrifood projects (an avocado orchard, rain-fed maize,
   a tomato greenhouse, a feedlot, a small cheese plant and an irrigation
   scheme) are built year by year: the investment, the years a plantation takes
   to bear, the ramp up to full yield, the annual revenue and cost, and the
   residual value at the end of the horizon. The resulting series is then
   appraised with the same functions the rest of the app uses (finance.js), so
   the NPV, the IRR, the benefit–cost ratio, the discounted payback and the
   equivalent annual value on the screen are not illustrations: they are the
   real indicators of the project the sliders describe.

   RISK LAB. The same project, with the price, the yield and the cost turned
   into distributions instead of single numbers. A Monte Carlo simulation
   (2000 runs by default, with the correlation between price and yield imposed
   on the ranks) gives the whole distribution of the NPV and the probability of
   losing money, and a tornado ranks the variables by how much they move the
   result, next to the switching value of each one: how far it can fall before
   the project stops being worth doing. */

(function () {

  /* the drawing kit lives in plotkit.js, shared with every other block */
  const { frame, pathOf, legend, bindSlider, val, setSlider } = Plot;

  /* ================================================================
     PROJECT LAB
     ================================================================ */

  /* Six projects with the orders of magnitude a thesis of central Mexico
     actually handles (Mexican pesos of 2026, constant prices). Each one states
     its unit, what it costs to set up, how long it takes to bear, what it
     yields and what it sells for. The sliders then move each figure between
     40 % and 160 % of these values, which is the range a sensitivity analysis
     explores. */
  const PRESETS = {
    avocado: {
      es: 'Huerta de aguacate', en: 'Avocado orchard',
      unit: ['ha', 'ha'], scale: 10,
      invest: 180000,        /* $/ha: plantación, riego y obra */
      gestation: 4,          /* years before the first harvest */
      estabCost: 45000,      /* $/ha per year while it grows */
      ramp: 4,               /* years from the first harvest to full yield */
      yieldFull: 12,         /* t/ha */
      price: 25000,          /* $/t */
      fixedCost: 60000,      /* $/ha per year */
      varCost: 2500,         /* $/t harvested */
      horizon: 20, salvage: 0.25,
      note: ['Perenne: cuatro años sin cosecha y luego una vida larga.', 'Perennial: four years with no harvest and then a long life.'],
    },
    maize: {
      es: 'Maíz de temporal', en: 'Rain-fed maize',
      unit: ['ha', 'ha'], scale: 20,
      invest: 25000, gestation: 0, estabCost: 0, ramp: 1,
      yieldFull: 3.5, price: 6200, fixedCost: 11000, varCost: 1400,
      horizon: 10, salvage: 0.2,
      note: ['Cultivo anual: produce desde el primer año y el margen es estrecho.', 'Annual crop: it produces from the first year and the margin is narrow.'],
    },
    greenhouse: {
      es: 'Invernadero de jitomate', en: 'Tomato greenhouse',
      unit: ['ha', 'ha'], scale: 0.5,
      invest: 4800000, gestation: 1, estabCost: 0, ramp: 2,
      yieldFull: 320, price: 17000, fixedCost: 2200000, varCost: 4000,
      horizon: 12, salvage: 0.15,
      note: ['Agricultura protegida: inversión muy alta por hectárea y costos de operación grandes.', 'Protected agriculture: a very large investment per hectare and heavy running costs.'],
    },
    feedlot: {
      es: 'Engorda de bovinos', en: 'Cattle feedlot',
      unit: ['cabeza', 'head'], scale: 200,
      invest: 6500, gestation: 0, estabCost: 0, ramp: 1,
      yieldFull: 0.25, price: 78000, fixedCost: 11000, varCost: 24000,
      horizon: 8, salvage: 0.2,
      note: ['Pecuario: ciclos cortos, mucho movimiento de dinero y margen por cabeza pequeño.', 'Livestock: short cycles, a lot of money moving and a small margin per head.'],
    },
    dairy: {
      es: 'Planta de quesos', en: 'Cheese plant',
      unit: ['línea de 1,000 L/día', 'line of 1,000 L/day'], scale: 8,
      invest: 1150000, gestation: 1, estabCost: 0, ramp: 3,
      yieldFull: 35, price: 120000, fixedCost: 420000, varCost: 95000,
      horizon: 15, salvage: 0.2,
      note: ['Agroindustria: la materia prima domina el costo y el producto se vende con valor agregado.', 'Agro-industry: the raw material dominates the cost and the product sells with added value.'],
    },
    irrigation: {
      es: 'Riego tecnificado', en: 'Irrigation scheme',
      unit: ['ha', 'ha'], scale: 40,
      invest: 65000, gestation: 0, estabCost: 0, ramp: 2,
      yieldFull: 2.5, price: 6500, fixedCost: 4500, varCost: 900,
      horizon: 15, salvage: 0.1,
      note: ['Proyecto incremental: solo entran el rendimiento y el costo que el riego agrega.', 'An incremental project: only the yield and the cost that irrigation adds are counted.'],
    },
  };

  let preset = 'avocado';
  /* the multipliers the sliders control */
  function labConfig() {
    const p = PRESETS[preset];
    return {
      p,
      scale: p.scale * val('epScale'),
      invest: p.invest * val('epInv'),
      price: p.price * val('epPrice'),
      yieldFull: p.yieldFull * val('epYield'),
      fixedCost: p.fixedCost * val('epCost'),
      varCost: p.varCost * val('epCost'),
      estabCost: p.estabCost * val('epCost'),
      rate: val('epRate'),
      horizon: Math.round(val('epHorizon')),
    };
  }

  /* The share of the full yield obtained in year t: nothing while the
     plantation grows, then a straight ramp until it matures. */
  function yieldShare(t, gestation, ramp) {
    if (t <= gestation) return 0;
    if (ramp <= 1) return 1;
    const k = t - gestation;               /* 1 = first harvest */
    return Math.min(1, 0.35 + 0.65 * (k - 1) / Math.max(1, ramp - 1));
  }

  /* Builds the year-by-year table of the project: investment, revenue, cost
     and net flow. `mult` moves one variable at a time for the sensitivity and
     the simulation, without rebuilding the configuration. */
  function buildProject(cfg, mult) {
    const m = mult || {};
    const mp = m.price == null ? 1 : m.price;
    const my = m.yield == null ? 1 : m.yield;
    const mc = m.cost == null ? 1 : m.cost;
    const mi = m.invest == null ? 1 : m.invest;
    const p = cfg.p;
    const n = cfg.horizon;
    const rows = [];
    const invest0 = cfg.invest * mi * cfg.scale;
    for (let t = 0; t <= n; t++) {
      let investment = 0, revenue = 0, cost = 0;
      if (t === 0) investment = invest0;
      const share = yieldShare(t, p.gestation, p.ramp);
      const production = share * cfg.yieldFull * my * cfg.scale;
      if (t > 0) {
        if (share === 0) cost = cfg.estabCost * mc * cfg.scale;            /* the orchard still has to be kept */
        else cost = cfg.fixedCost * mc * cfg.scale + cfg.varCost * mc * production;
        revenue = production * cfg.price * mp;
      }
      let residual = 0;
      if (t === n) residual = invest0 * p.salvage;                          /* land, works and equipment left */
      rows.push({ t, investment, revenue, cost, residual, production, net: revenue - cost - investment + residual });
    }
    return { rows, flows: rows.map(r => r.net), invest0 };
  }

  let lastResult = null;

  function runProjectLab() {
    const cfg = labConfig();
    const built = buildProject(cfg);
    const res = Fin.appraise(built.flows, cfg.rate);
    /* the gross benefit–cost ratio of Gittinger needs the two streams apart */
    const benefits = built.rows.map(r => r.revenue + r.residual);
    const costs = built.rows.map(r => r.cost + r.investment);
    res.bc = Fin.bcRatio(benefits, costs, cfg.rate);
    lastResult = { cfg, built, res };
    drawFlows(built, cfg);
    drawProfile(built, cfg, res);
    showReadout(res, cfg);
    if (el('labRisk') && el('labRisk').classList.contains('on')) runRiskLab();
    return lastResult;
  }

  function drawFlows(built, cfg) {
    const svg = el('epFlowChart');
    if (!svg) return;
    const flows = built.flows;
    const disc = flows.map((f, t) => f / Math.pow(1 + cfg.rate, t));
    let acc = 0;
    const cum = disc.map(f => (acc += f));
    const lo = Math.min(0, ...flows, ...cum), hi = Math.max(0, ...flows, ...cum);
    const pad = (hi - lo) * 0.08;
    const f = frame(svg, {
      W: 460, H: 280, m: { l: 52, r: 14, t: 14, b: 40 },
      x: [-0.6, flows.length - 0.4], y: [lo - pad, hi + pad],
      xlab: T('año del proyecto', 'project year'), ylab: T('pesos', 'pesos'),
      xt: flows.map((_, i) => i).filter(i => flows.length <= 14 || i % 2 === 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / flows.length * 0.62);
    flows.forEach((v, t) => {
      const y = f.sy(Math.max(0, v)), h = Math.abs(f.sy(v) - f.sy(0));
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(t) - w / 2, y, width: w, height: Math.max(0.8, h), rx: 1.5,
        fill: v >= 0 ? 'var(--cash-in)' : 'var(--cash-out)', opacity: 0.9,
      }));
    });
    f.plot.appendChild(svgEl('path', { d: pathOf(cum.map((v, t) => [f.sx(t), f.sy(v)])), stroke: 'var(--primary)', 'stroke-width': 2.2, fill: 'none', 'stroke-dasharray': '5 3' }));
    cum.forEach((v, t) => f.plot.appendChild(svgEl('circle', { cx: f.sx(t), cy: f.sy(v), r: 2.4, fill: 'var(--primary)' })));
    /* the year the discounted accumulation crosses zero is the discounted payback */
    const k = cum.findIndex(v => v >= 0);
    if (k > 0) {
      const x0 = f.sx(k - 1) + (f.sx(k) - f.sx(k - 1)) * (-cum[k - 1] / (cum[k] - cum[k - 1]));
      f.plot.appendChild(svgEl('line', { x1: x0, x2: x0, y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--accent)', 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }));
      f.g.appendChild(svgEl('text', { x: x0 + 4, y: f.m.t + 12, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' }, T('recuperación', 'payback')));
    }
    legend(f, [
      [T('flujo neto positivo', 'positive net flow'), 'var(--cash-in)', 'sq'],
      [T('flujo neto negativo', 'negative net flow'), 'var(--cash-out)', 'sq'],
      [T('acumulado descontado', 'discounted cumulative'), 'var(--primary)', 'ln'],
    ]);
  }


  function drawProfile(built, cfg, res) {
    const svg = el('epProfileChart');
    if (!svg) return;
    const maxRate = Math.max(0.4, Math.min(1.2, (res.irr == null ? 0.3 : res.irr) * 1.6), cfg.rate * 1.6);
    const rates = [];
    for (let r = 0; r <= maxRate + 1e-9; r += maxRate / 80) rates.push(r);
    const vals = rates.map(r => Fin.npv(r, built.flows));
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = (hi - lo) * 0.08;
    const f = frame(svg, {
      W: 460, H: 280, m: { l: 52, r: 14, t: 14, b: 40 },
      x: [0, maxRate], y: [lo - pad, hi + pad],
      xlab: T('tasa de descuento', 'discount rate'), ylab: T('VAN', 'NPV'),
      xlabFmt: v => (v * 100).toFixed(0) + '%',
    });
    /* the band of rates at which the project is still worth doing, drawn first
       so that it stays behind the curve */
    if (res.irr != null) f.plot.appendChild(svgEl("rect", {
      x: f.m.l, y: f.m.t, width: Math.max(0, f.sx(Math.min(res.irr, maxRate)) - f.m.l), height: f.H - f.m.t - f.m.b,
      fill: "var(--leaf)", opacity: 0.1,
    }));
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    f.plot.appendChild(svgEl('path', { d: pathOf(rates.map((r, i) => [f.sx(r), f.sy(vals[i])])), stroke: 'var(--primary)', 'stroke-width': 2.6, fill: 'none' }));
    /* the rate the investor demands */
    f.plot.appendChild(svgEl('line', { x1: f.sx(cfg.rate), x2: f.sx(cfg.rate), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--sky)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }));
    f.g.appendChild(svgEl('text', { x: f.sx(cfg.rate) + 4, y: f.m.t + 12, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: 'var(--sky)' }, T('TREMA', 'MARR')));
    const atRate = Fin.npv(cfg.rate, built.flows);
    f.plot.appendChild(svgEl('circle', { cx: f.sx(cfg.rate), cy: f.sy(atRate), r: 4.6, fill: 'var(--sky)' }));
    if (res.irr != null && res.irr <= maxRate) {
      f.plot.appendChild(svgEl('circle', { cx: f.sx(res.irr), cy: f.sy(0), r: 5, fill: 'var(--accent)' }));
      f.g.appendChild(svgEl('text', { x: f.sx(res.irr) + 7, y: f.sy(0) - 7, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' }, 'TIR ' + fmtPct(res.irr, 1)));
    }
  }

  function showReadout(res, cfg) {
    const box = el('epReadout');
    if (!box) return;
    const p = cfg.p;
    const tile = (label, value, tone, sub) =>
      `<div class="rd${tone ? ' ' + tone : ''}"><div class="rd-l">${label}</div><div class="rd-v">${value}</div>${sub ? `<div class="rd-t">${sub}</div>` : ''}</div>`;
    box.innerHTML =
      tile(T('VAN', 'NPV'), fmtMoney(res.npv, 0), res.npv > 0 ? 'good' : 'bad', T('a la TREMA de ' + fmtPct(cfg.rate, 1), 'at a MARR of ' + fmtPct(cfg.rate, 1))) +
      tile(T('TIR', 'IRR'), fmtRate(res.irr, 1), res.irr != null && res.irr > cfg.rate ? 'good' : 'bad', T('contra ' + fmtPct(cfg.rate, 1), 'against ' + fmtPct(cfg.rate, 1))) +
      tile(T('B/C', 'B/C'), res.bc == null ? '—' : fmtFixed(res.bc, 2), res.bc > 1 ? 'good' : 'bad', T('beneficio / costo', 'benefit / cost')) +
      tile(T('Recuperación', 'Payback'), res.discountedPayback == null ? T('nunca', 'never') : fmtFixed(res.discountedPayback, 1) + T(' años', ' years'), res.discountedPayback != null ? 'good' : 'bad', T('descontada', 'discounted')) +
      tile(T('VAE', 'EAV'), fmtMoney(res.eaa, 0), res.eaa > 0 ? 'good' : 'bad', T('por año', 'per year')) +
      tile(T('Escala', 'Scale'), fmtNum(cfg.scale, 1) + ' ' + T(p.unit[0], p.unit[1]), '', T('inversión ' + fmtMoney(cfg.invest * cfg.scale, 0), 'investment ' + fmtMoney(cfg.invest * cfg.scale, 0)));
    const st = el('epStatus');
    if (st) {
      const ok = res.npv > 0;
      const irrTxt = res.irr == null ? T('no tiene TIR (los flujos nunca cambian de signo lo suficiente)', 'has no IRR (the flows never change sign enough)')
        : T(`rinde ${fmtPct(res.irr, 1)} anual`, `returns ${fmtPct(res.irr, 1)} a year`);
      st.innerHTML = ok
        ? `<b>${T('Conviene', 'Worth doing')}</b> — ${T(`el proyecto ${irrTxt}, por encima de la TREMA de ${fmtPct(cfg.rate, 1)}: cada peso invertido deja ${fmtFixed(res.npv / (cfg.invest * cfg.scale), 2)} pesos de valor presente adicional.`,
          `the project ${irrTxt}, above the MARR of ${fmtPct(cfg.rate, 1)}: every peso invested leaves ${fmtFixed(res.npv / (cfg.invest * cfg.scale), 2)} pesos of extra present value.`)}`
        : `<b>${T('No conviene', 'Not worth doing')}</b> — ${T(`con estos supuestos el proyecto ${irrTxt} y el VAN es negativo a la TREMA de ${fmtPct(cfg.rate, 1)}: el dinero rendiría más en su mejor alternativa.`,
          `with these assumptions the project ${irrTxt} and the NPV is negative at the MARR of ${fmtPct(cfg.rate, 1)}: the money would earn more in its best alternative.`)}`;
    }
    const note = el('epNote');
    if (note) note.innerHTML = T(p.note[0], p.note[1]);
  }

  /* ================================================================
     RISK LAB
     ================================================================ */

  function riskConfig() {
    return {
      price: val('rkPrice'), yield: val('rkYield'), cost: val('rkCost'),
      corr: val('rkCorr'), n: Math.round(val('rkN')),
      dist: (el('rkDist') || { value: 'triangular' }).value,
    };
  }

  /* One distribution per variable, centred on the value of the project lab and
     as wide as the slider says. The triangular and the PERT take the minimum,
     the most likely and the maximum, which is what an expert can state; the
     normal takes the mean and the deviation of a price series. */
  function spec(name, spread, dist) {
    if (dist === 'normal') return { name, dist: 'normal', mean: 1, sd: spread / 2 };
    if (dist === 'uniform') return { name, dist: 'uniform', min: 1 - spread, max: 1 + spread };
    if (dist === 'pert') return { name, dist: 'pert', min: 1 - spread, mode: 1, max: 1 + spread };
    return { name, dist: 'triangular', min: 1 - spread, mode: 1, max: 1 + spread };
  }

  function runRiskLab() {
    if (!lastResult) runProjectLab();
    const { cfg } = lastResult;
    const rc = riskConfig();
    const vars = [spec('price', rc.price, rc.dist), spec('yield', rc.yield, rc.dist), spec('cost', rc.cost, rc.dist)];
    /* price and yield move together (or against each other): a good year
       everywhere lowers the price, and that correlation changes the risk */
    const corr = [
      [1, rc.corr, 0],
      [rc.corr, 1, 0],
      [0, 0, 1],
    ];
    const sim = Fin.monteCarlo(vars, m => Fin.npv(cfg.rate, buildProject(cfg, m).flows), { n: rc.n, seed: 20260922, corr });
    drawHistogram(sim, cfg);
    drawTornado(cfg);
    showRiskReadout(sim, cfg);
  }

  function drawHistogram(sim, cfg) {
    const svg = el('rkHist');
    if (!svg) return;
    const h = Stats.histogram(sim.values, 26);
    const maxP = Math.max(...h.bins.map(b => b.p));
    const f = frame(svg, {
      W: 460, H: 280, m: { l: 52, r: 14, t: 14, b: 40 },
      x: [h.min, h.max], y: [0, maxP * 1.12],
      xlab: T('VAN simulado', 'simulated NPV'), ylab: T('frecuencia', 'frequency'),
      ylabFmt: v => (v * 100).toFixed(0) + '%',
    });
    h.bins.forEach(b => {
      const x = f.sx(b.from), w = Math.max(1, f.sx(b.to) - f.sx(b.from) - 1);
      f.plot.appendChild(svgEl('rect', {
        x, y: f.sy(b.p), width: w, height: Math.max(0.5, f.sy(0) - f.sy(b.p)), rx: 1.4,
        fill: b.to <= 0 ? 'var(--cash-out)' : 'var(--primary)', opacity: 0.85,
      }));
    });
    if (h.min < 0 && h.max > 0) {
      f.plot.appendChild(svgEl('line', { x1: f.sx(0), x2: f.sx(0), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--danger)', 'stroke-width': 1.6 }));
      f.g.appendChild(svgEl('text', { x: f.sx(0) + 4, y: f.m.t + 12, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: 'var(--danger)' }, 'VAN = 0'));
    }
    [['p05', 0.05], ['median', 0.5], ['p95', 0.95]].forEach(([k, q]) => {
      const v = sim[k];
      if (v == null || v < h.min || v > h.max) return;
      f.plot.appendChild(svgEl('line', { x1: f.sx(v), x2: f.sx(v), y1: f.sy(maxP * 1.04), y2: f.sy(0), stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': k === 'median' ? '' : '3 3', opacity: 0.85 }));
      f.g.appendChild(svgEl('text', { x: f.sx(v), y: f.sy(maxP * 1.06), 'font-size': 9, 'text-anchor': 'middle', class: 'art-mut' }, k === 'median' ? T('mediana', 'median') : 'P' + Math.round(q * 100)));
    });
  }

  /* The tornado moves one variable at a time by ±15 % and orders the
     variables by how much the NPV swings. Next to it, the switching value of
     each one: the change that takes the NPV to zero. */
  const RISK_VARS = [
    { key: 'price', es: 'Precio de venta', en: 'Selling price' },
    { key: 'yield', es: 'Rendimiento', en: 'Yield' },
    { key: 'cost', es: 'Costos de producción', en: 'Production costs' },
    { key: 'invest', es: 'Inversión', en: 'Investment' },
    { key: 'rate', es: 'Tasa de descuento', en: 'Discount rate' },
  ];
  function npvWith(cfg, key, mult) {
    if (key === 'rate') return Fin.npv(cfg.rate * mult, buildProject(cfg).flows);
    return Fin.npv(cfg.rate, buildProject(cfg, { [key]: mult }).flows);
  }
  function drawTornado(cfg) {
    const svg = el('rkTornado');
    if (!svg) return;
    const d = 0.15;
    const rows = Fin.tornado(RISK_VARS.map(v => ({ name: v.key, es: v.es, en: v.en, f: m => npvWith(cfg, v.key, m) })), d);
    const base = Fin.npv(cfg.rate, buildProject(cfg).flows);
    const lo = Math.min(base, ...rows.map(r => r.low)), hi = Math.max(base, ...rows.map(r => r.high));
    const pad = (hi - lo) * 0.12 || 1;
    const f = frame(svg, {
      W: 460, H: 280, m: { l: 130, r: 16, t: 16, b: 40 },
      x: [lo - pad, hi + pad], y: [-0.6, rows.length - 0.4],
      xlab: T('VAN con la variable ±15 %', 'NPV with the variable ±15%'), yt: [],
    });
    f.plot.appendChild(svgEl('line', { x1: f.sx(base), x2: f.sx(base), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--border-strong)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }));
    const bh = (f.H - f.m.t - f.m.b) / rows.length * 0.56;
    rows.forEach((r, i) => {
      const y = f.sy(rows.length - 1 - i) - bh / 2;
      f.plot.appendChild(svgEl('rect', { x: Math.min(f.sx(r.low), f.sx(base)), y, width: Math.abs(f.sx(base) - f.sx(r.low)), height: bh, rx: 2, fill: 'var(--cash-out)', opacity: 0.8 }));
      f.plot.appendChild(svgEl('rect', { x: Math.min(f.sx(r.high), f.sx(base)), y, width: Math.abs(f.sx(r.high) - f.sx(base)), height: bh, rx: 2, fill: 'var(--cash-in)', opacity: 0.8 }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' }, T(r.es, r.en)));
    });
  }

  function showRiskReadout(sim, cfg) {
    const box = el('rkReadout');
    if (box) {
      const tile = (label, value, tone, sub) =>
        `<div class="rd${tone ? ' ' + tone : ''}"><div class="rd-l">${label}</div><div class="rd-v">${value}</div>${sub ? `<div class="rd-t">${sub}</div>` : ''}</div>`;
      box.innerHTML =
        tile(T('VAN esperado', 'Expected NPV'), fmtMoney(sim.mean, 0), sim.mean > 0 ? 'good' : 'bad', T(sim.n + ' simulaciones', sim.n + ' runs')) +
        tile(T('P(VAN < 0)', 'P(NPV < 0)'), fmtPct(sim.pLoss, 1), sim.pLoss < 0.1 ? 'good' : sim.pLoss < 0.3 ? 'warn' : 'bad', T('riesgo de pérdida', 'risk of loss')) +
        tile(T('Desviación', 'Deviation'), fmtMoney(sim.sd, 0), '', T('CV = ' + (sim.cv == null ? '—' : fmtFixed(sim.cv, 2)), 'CV = ' + (sim.cv == null ? '—' : fmtFixed(sim.cv, 2)))) +
        tile('P5 – P95', fmtMoney(sim.p05, 0) + ' … ' + fmtMoney(sim.p95, 0), '', T('90 % de los resultados', '90% of the outcomes'));
    }
    const lim = el('rkLimits');
    if (lim) {
      const rows = RISK_VARS.map(v => {
        const sw = Fin.switchingValue(m => npvWith(cfg, v.key, m), { min: 0.05, max: 6 });
        return `<tr><td>${T(v.es, v.en)}</td><td class="num">${sw ? (sw.change > 0 ? '+' : '−') + fmtPct(Math.abs(sw.change), 1) : T('nunca', 'never')}</td></tr>`;
      }).join('');
      lim.innerHTML = `<table class="mini-table"><thead><tr><th>${T('Variable', 'Variable')}</th><th class="num">${T('Cambio que anula el VAN', 'Change that wipes out the NPV')}</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }

  /* ================================================================
     wiring
     ================================================================ */
  const pct = v => Math.round(v * 100) + '%';
  function fmtOf(key) {
    const p = () => PRESETS[preset];
    return {
      epScale: v => fmtNum(p().scale * v, 1) + ' ' + T(p().unit[0], p().unit[1]),
      epInv: v => fmtMoney(p().invest * v, 0) + ' / ' + T(p().unit[0], p().unit[1]),
      epPrice: v => fmtMoney(p().price * v, 0) + ' / t',
      epYield: v => fmtNum(p().yieldFull * v, 2) + ' t / ' + T(p().unit[0], p().unit[1]),
      /* the multiplier moves the fixed cost, the variable cost and the cost of
         keeping a young plantation at once; the label shows the annual fixed
         cost per unit, which is the one the user recognises */
      epCost: v => pct(v) + ' · ' + fmtMoney(p().fixedCost * v, 0),
      epRate: v => fmtPct(v, 1),
      epHorizon: v => fmtNum(v, 0) + T(' años', ' years'),
      rkPrice: pct, rkYield: pct, rkCost: pct,
      rkCorr: v => fmtFixed(v, 2),
      rkN: v => fmtNum(v, 0),
    }[key];
  }
  function refreshSliderLabels() {
    ['epScale', 'epInv', 'epPrice', 'epYield', 'epCost', 'epRate', 'epHorizon', 'rkPrice', 'rkYield', 'rkCost', 'rkCorr', 'rkN'].forEach(id => {
      const s = el(id), v = el(id + 'Val');
      if (s && v) v.innerHTML = fmtOf(id)(+s.value);
    });
  }

  function applyPreset(key) {
    preset = key;
    const p = PRESETS[key];
    ['epScale', 'epInv', 'epPrice', 'epYield', 'epCost'].forEach(id => setSlider(id, 1));
    setSlider('epHorizon', p.horizon);
    setSlider('epRate', 0.12);
    refreshSliderLabels();
    runProjectLab();
  }

  function init() {
    if (!el('epFlowChart')) return;
    const sel = el('epPreset');
    if (sel) {
      sel.innerHTML = Object.keys(PRESETS).map(k => `<option value="${k}" data-es="${PRESETS[k].es}" data-en="${PRESETS[k].en}">${PRESETS[k].es}</option>`).join('');
      sel.addEventListener('change', () => applyPreset(sel.value));
    }
    ['epScale', 'epInv', 'epPrice', 'epYield', 'epCost', 'epRate', 'epHorizon'].forEach(id => bindSlider(id, fmtOf(id), runProjectLab));
    ['rkPrice', 'rkYield', 'rkCost', 'rkCorr', 'rkN'].forEach(id => bindSlider(id, fmtOf(id), runRiskLab));
    const dist = el('rkDist');
    if (dist) dist.addEventListener('change', runRiskLab);
    const reset = el('epReset');
    if (reset) reset.addEventListener('click', () => applyPreset(preset));
    /* the tabs of the two laboratories */
    els('.lab-tab').forEach(b => b.addEventListener('click', () => {
      els('.lab-tab').forEach(x => x.classList.toggle('on', x === b));
      els('.lab').forEach(x => x.classList.toggle('on', x.id === b.dataset.lab));
      if (b.dataset.lab === 'labRisk') runRiskLab(); else runProjectLab();
    }));
    applyPreset('avocado');
    document.addEventListener('langchange', () => {
      I18N.apply(el('epPreset'));
      refreshSliderLabels();
      runProjectLab();
      if (el('labRisk') && el('labRisk').classList.contains('on')) runRiskLab();
    });
    document.addEventListener('themechange', () => {
      runProjectLab();
      if (el('labRisk') && el('labRisk').classList.contains('on')) runRiskLab();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Lab = { PRESETS, buildProject, yieldShare, labConfig, runProjectLab, runRiskLab };
})();
