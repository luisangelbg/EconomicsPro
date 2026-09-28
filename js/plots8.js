/* EconomicsPro — the figures of Block 8.

   The bridge from the private result to the economic one, the two profiles
   side by side, the employment the project creates and how the value it adds
   is shared out. */

(function () {

  const { frame, pathOf, legend } = Plot;

  /* ================================================================
     1 · from the private NPV to the economic one
     ================================================================ */
  function drawBridge(svg, b) {
    if (!svg || !b) { if (svg) Plot.clear(svg); return; }
    const steps = [
      { es: 'Transferencias', en: 'Transfers', v: b.transfers, colour: 'var(--c2)' },
      { es: 'Precio del producto', en: 'Price of the product', v: b.product, colour: 'var(--cash-in)' },
      { es: 'Precios de los costos', en: 'Prices of the costs', v: b.costs, colour: 'var(--c3)' },
      { es: 'Precios de la inversión', en: 'Prices of the investment', v: b.investment, colour: 'var(--c6)' },
    ];
    let acc = b.privateAtSocial;
    const tops = steps.map(s => { const from = acc; acc += s.v; return { from, to: acc, s }; });
    const all = [b.privateAtSocial, b.economic].concat(tops.map(t => t.to), tops.map(t => t.from), [0]);
    const lo = Math.min(...all), hi = Math.max(...all);
    const pad = (hi - lo) * 0.14 || 1;
    const n = steps.length + 2;
    const f = frame(svg, {
      W: 700, H: 320, m: { l: 74, r: 16, t: 26, b: 68 },
      x: [-0.6, n - 0.4], y: [lo - pad, hi + pad], xt: [],
      ylab: T('valor presente, a la tasa social', 'present value, at the social rate'), ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = (f.W - f.m.l - f.m.r) / n * 0.6;
    const bar = (i, from, to, colour, label, value, bold) => {
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(i) - w / 2, y: Math.min(f.sy(from), f.sy(to)), width: w,
        height: Math.max(1, Math.abs(f.sy(to) - f.sy(from))), rx: 2, fill: colour, opacity: 0.9,
      }));
      f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 14, 'font-size': 9, 'text-anchor': 'middle', class: 'art-mut' }, label));
      f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 26, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': bold ? 700 : 500 }, fmtMoney(value, 0)));
    };
    bar(0, 0, b.privateAtSocial, b.privateAtSocial >= 0 ? 'var(--primary)' : 'var(--danger)', T('VAN privado', 'private NPV'), b.privateAtSocial, true);
    tops.forEach((t, i) => {
      bar(i + 1, t.from, t.to, t.s.colour, T(t.s.es, t.s.en), t.s.v);
      f.plot.appendChild(svgEl('line', {
        x1: f.sx(i) + w / 2, x2: f.sx(i + 1) - w / 2, y1: f.sy(t.from), y2: f.sy(t.from),
        stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '2 2',
      }));
    });
    f.plot.appendChild(svgEl('line', {
      x1: f.sx(steps.length) + w / 2, x2: f.sx(n - 1) - w / 2, y1: f.sy(b.economic), y2: f.sy(b.economic),
      stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '2 2',
    }));
    bar(n - 1, 0, b.economic, b.economic >= 0 ? 'var(--leaf)' : 'var(--danger)', T('VAN económico', 'economic NPV'), b.economic, true);
  }

  /* ================================================================
     2 · the two profiles
     ================================================================ */
  function drawProfiles(svg, m, privateFlow) {
    if (!svg || !m.flow.length) { if (svg) Plot.clear(svg); return; }
    const maxRate = Math.max(0.4, (m.economic.irr == null ? 0.4 : m.economic.irr * 1.5), m.privateRate * 1.8);
    const rates = [];
    for (let r = 0; r <= maxRate + 1e-9; r += maxRate / 80) rates.push(r);
    const eco = rates.map(r => Fin.npv(r, m.flow));
    const pri = rates.map(r => Fin.npv(r, privateFlow));
    const lo = Math.min(0, ...eco, ...pri), hi = Math.max(0, ...eco, ...pri);
    const pad = (hi - lo) * 0.08 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 74, r: 16, t: 26, b: 42 },
      x: [0, maxRate], y: [lo - pad, hi + pad],
      xlab: T('tasa de descuento', 'discount rate'), ylab: T('VAN', 'NPV'),
      xlabFmt: v => (v * 100).toFixed(0) + '%', ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    f.plot.appendChild(svgEl('path', { d: pathOf(rates.map((r, i) => [f.sx(r), f.sy(pri[i])])), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none' }));
    f.plot.appendChild(svgEl('path', { d: pathOf(rates.map((r, i) => [f.sx(r), f.sy(eco[i])])), stroke: 'var(--leaf)', 'stroke-width': 2.4, fill: 'none', 'stroke-dasharray': '6 4' }));
    /* the two rates are usually a couple of points apart, so one label goes to
       the left of its line and the other to the right: side by side they would
       be crossed by the neighbouring line */
    const mark = (rate, colour, label, dy, izq) => {
      if (rate == null || rate < 0 || rate > maxRate) return;
      f.plot.appendChild(svgEl("line", { x1: f.sx(rate), x2: f.sx(rate), y1: f.m.t, y2: f.H - f.m.b, stroke: colour, "stroke-width": 1.5, "stroke-dasharray": "4 3" }));
      f.g.appendChild(svgEl("text", {
        x: f.sx(rate) + (izq ? -5 : 5), y: f.m.t + dy, "font-size": 10, "text-anchor": izq ? "end" : "start",
        class: "art-txt", "font-weight": 700, fill: colour, style: "paint-order:stroke; stroke:var(--surface-alt); stroke-width:3.5px;",
      }, label));
    };
    const juntas = m.privateRate != null && m.socialRate != null && Math.abs(f.sx(m.privateRate) - f.sx(m.socialRate)) < 90;
    mark(m.privateRate, "var(--sky)", T("tasa privada", "private rate"), 12, juntas);
    mark(m.socialRate, "var(--c8)", T("tasa social", "social rate"), juntas ? 12 : 28, false);
    legend(f, [
      [T('flujo privado del proyecto', 'private project flow'), 'var(--primary)', 'ln'],
      [T('flujo económico', 'economic flow'), 'var(--leaf)', 'ln'],
    ], 12);
  }

  /* ================================================================
     3 · the employment it creates
     ================================================================ */
  function drawJobs(svg, rows, daysPerJob) {
    if (!svg || !rows.length) { if (svg) Plot.clear(svg); return; }
    const hi = Math.max(...rows.map(r => r.jobs)) || 1;
    const f = frame(svg, {
      W: 700, H: 280, m: { l: 70, r: 56, t: 26, b: 42 },
      x: [rows[0].t - 0.6, rows[rows.length - 1].t + 0.6], y: [0, hi * 1.15],
      xlab: T('año del proyecto', 'project year'), ylab: T('jornales al año', 'labour days a year'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtNum(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.6);
    rows.forEach(r => {
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(r.t) - w / 2, y: f.sy(r.jobs), width: w, height: Math.max(0.6, f.sy(0) - f.sy(r.jobs)),
        rx: 1.5, fill: 'var(--leaf)', opacity: 0.85,
      }));
    });
    if (daysPerJob > 0) {
      f.g.appendChild(svgEl('text', {
        x: f.W - 8, y: (f.m.t + f.H - f.m.b) / 2, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600,
        transform: `rotate(-90 ${f.W - 8} ${(f.m.t + f.H - f.m.b) / 2})`,
      }, T('empleos permanentes', 'permanent jobs')));
      const top = Math.round(hi / daysPerJob * 10) / 10;
      f.g.appendChild(svgEl('text', { x: f.W - f.m.r + 6, y: f.sy(hi) + 4, 'font-size': 9.5, class: 'art-mut' }, fmtNum(top, 1)));
    }
  }

  /* ================================================================
     4 · how the value added is shared
     ================================================================ */
  function drawValueAdded(svg, rows) {
    if (!svg || !rows.length) { if (svg) Plot.clear(svg); return; }
    const hi = Math.max(...rows.map(r => Math.max(r.valueAdded, r.wages + r.taxes + r.interest + Math.max(0, r.surplus)))) || 1;
    const lo = Math.min(0, ...rows.map(r => r.surplus));
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 70, r: 16, t: 26, b: 42 },
      x: [rows[0].t - 0.6, rows[rows.length - 1].t + 0.6], y: [Math.min(0, lo * 1.1), hi * 1.14],
      xlab: T('año del proyecto', 'project year'), ylab: T('valor agregado', 'value added'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.62);
    rows.forEach(r => {
      /* the pieces that add stack upwards and the ones that subtract downwards:
         a negative surplus —the years of gestation, when the owner puts in and
         takes out nothing— would otherwise be painted over the wages */
      let arriba = 0, abajo = 0;
      [[r.wages, "var(--c1)"], [r.taxesPaid, "var(--c4)"], [r.interest, "var(--c6)"], [r.surplus, "var(--leaf)"]].forEach(([v, colour]) => {
        if (!v) return;
        const base = v >= 0 ? arriba : abajo;
        const y0 = f.sy(base), y1 = f.sy(base + v);
        f.plot.appendChild(svgEl('rect', {
          x: f.sx(r.t) - w / 2, y: Math.min(y0, y1), width: w, height: Math.max(0.6, Math.abs(y1 - y0)), rx: 1.5,
          fill: colour, opacity: 0.88,
        }));
        if (v >= 0) arriba += v; else abajo += v;
      });
    });
    legend(f, [
      [T('remuneraciones', 'wages'), 'var(--c1)', 'sq'],
      [T('impuestos', 'taxes'), 'var(--c4)', 'sq'],
      [T('intereses', 'interest'), 'var(--c6)', 'sq'],
      [T('excedente del dueño', "owner's surplus"), 'var(--leaf)', 'sq'],
    ], 12);
  }

  window.Plots8 = { drawBridge, drawProfiles, drawJobs, drawValueAdded };
})();
