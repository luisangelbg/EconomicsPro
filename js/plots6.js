/* EconomicsPro — the figures of Block 6.

   The NPV profile of the two flows, the waterfall that takes the NPV apart,
   the discounted recovery of the investment, and the net benefit curve of the
   marginal analysis of the treatments. */

(function () {
  const { frame, pathOf, legend } = Plot;

  /* ================================================================
     1 · the NPV profile
     ================================================================ */
  function drawProfile(svg, m) {
    if (!svg || !m.profile.length) { if (svg) Plot.clear(svg); return; }
    const pts = m.profile;
    const vals = pts.map(p => p.project).concat(pts.map(p => p.investor));
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = (hi - lo) * 0.08 || 1;
    const maxRate = pts[pts.length - 1].rate;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 74, r: 16, t: 26, b: 42 },
      x: [0, maxRate], y: [lo - pad, hi + pad],
      xlab: T('tasa de descuento', 'discount rate'), ylab: T('VAN', 'NPV'),
      xlabFmt: v => (v * 100).toFixed(0) + '%', ylabFmt: v => fmtMoney(v, 0),
    });
    /* the band of rates at which the project is still worth doing */
    if (m.project.irr != null && m.project.irr > 0) {
      f.plot.appendChild(svgEl('rect', {
        x: f.m.l, y: f.m.t, width: Math.max(0, f.sx(Math.min(m.project.irr, maxRate)) - f.m.l),
        height: f.H - f.m.t - f.m.b, fill: 'var(--leaf)', opacity: 0.09,
      }));
    }
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    f.plot.appendChild(svgEl('path', { d: pathOf(pts.map(p => [f.sx(p.rate), f.sy(p.project)])), stroke: 'var(--primary)', 'stroke-width': 2.6, fill: 'none' }));
    f.plot.appendChild(svgEl('path', { d: pathOf(pts.map(p => [f.sx(p.rate), f.sy(p.investor)])), stroke: 'var(--leaf)', 'stroke-width': 2.2, fill: 'none', 'stroke-dasharray': '6 4' }));
    /* the two rates in use and the two internal rates */
    const mark = (rate, colour, label, dy) => {
      if (rate == null || !isFinite(rate) || rate < 0 || rate > maxRate) return;
      f.plot.appendChild(svgEl('line', { x1: f.sx(rate), x2: f.sx(rate), y1: f.m.t, y2: f.H - f.m.b, stroke: colour, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
      f.g.appendChild(svgEl('text', { x: f.sx(rate) + 4, y: f.m.t + (dy || 12), 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: colour }, label));
    };
    mark(m.rateProject, 'var(--sky)', T('tasa del proyecto', 'project rate'), 12);
    if (Math.abs(m.rateEquity - m.rateProject) > 1e-6) mark(m.rateEquity, 'var(--c8)', T('tasa del dueño', "owner's rate"), 28);
    [[m.project.irr, 'var(--primary)', 'TIR'], [m.investor.irr, 'var(--leaf)', T('TIR del dueño', "owner's IRR")]].forEach(([irr, colour, label]) => {
      if (irr == null || irr > maxRate || irr < 0) return;
      f.plot.appendChild(svgEl('circle', { cx: f.sx(irr), cy: f.sy(0), r: 5, fill: colour }));
      f.g.appendChild(svgEl('text', { x: f.sx(irr) + 7, y: f.sy(0) - 8, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700, fill: colour }, `${label} ${fmtPct(irr, 1)}`));
    });
    legend(f, [
      [T('flujo del proyecto', 'project flow'), 'var(--primary)', 'ln'],
      [T('flujo del inversionista', 'investor flow'), 'var(--leaf)', 'ln'],
    ], 12);
  }

  /* ================================================================
     2 · the NPV, taken apart
     ================================================================ */
  function drawWaterfall(svg, m) {
    if (!svg) return;
    const p = m.parts;
    const steps = [
      { es: 'Ingresos', en: 'Revenue', v: p.revenue, colour: 'var(--cash-in)' },
      { es: 'Costos de operación', en: 'Operating costs', v: -p.cost, colour: 'var(--c3)' },
      { es: 'Impuestos', en: 'Taxes', v: -p.tax, colour: 'var(--c4)' },
      { es: 'Inversión', en: 'Investment', v: -p.investment, colour: 'var(--cash-out)' },
      { es: 'Valor de rescate', en: 'Salvage value', v: p.salvage, colour: 'var(--coin)' },
    ];
    let acc = 0;
    const tops = steps.map(s => { const from = acc; acc += s.v; return { from, to: acc, s }; });
    const all = tops.map(t => t.to).concat(tops.map(t => t.from), [0, p.npv]);
    const lo = Math.min(...all), hi = Math.max(...all);
    const pad = (hi - lo) * 0.12 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 74, r: 16, t: 26, b: 64 },
      x: [-0.6, steps.length + 0.4], y: [lo - pad, hi + pad], xt: [],
      ylab: T('valor presente', 'present value'), ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = (f.W - f.m.l - f.m.r) / (steps.length + 1) * 0.62;
    tops.forEach((t, i) => {
      const y0 = f.sy(t.from), y1 = f.sy(t.to);
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(i) - w / 2, y: Math.min(y0, y1), width: w, height: Math.max(1, Math.abs(y1 - y0)),
        rx: 2, fill: t.s.colour, opacity: 0.9,
      }));
      /* the connecting line between one step and the next */
      if (i < tops.length - 1) {
        f.plot.appendChild(svgEl('line', { x1: f.sx(i) + w / 2, x2: f.sx(i + 1) - w / 2, y1: f.sy(t.to), y2: f.sy(t.to), stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '2 2' }));
      }
      f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 14, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-mut' }, T(t.s.es, t.s.en)));
      f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 26, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-txt' }, fmtMoney(t.s.v, 0)));
    });
    /* the NPV itself */
    const i = steps.length;
    f.plot.appendChild(svgEl('rect', {
      x: f.sx(i) - w / 2, y: Math.min(f.sy(0), f.sy(p.npv)), width: w, height: Math.max(1, Math.abs(f.sy(p.npv) - f.sy(0))),
      rx: 2, fill: p.npv >= 0 ? 'var(--primary)' : 'var(--danger)', opacity: 0.95,
    }));
    f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 14, 'font-size': 10, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 700 }, T('VAN', 'NPV')));
    f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 26, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 700 }, fmtMoney(p.npv, 0)));
  }

  /* ================================================================
     3 · the recovery of the investment
     ================================================================ */
  function drawPayback(svg, m) {
    if (!svg) return;
    const flow = m.flows.project;
    let acc = 0, accD = 0;
    const simple = flow.map(v => (acc += v));
    const disc = flow.map((v, t) => (accD += v / Math.pow(1 + m.rateProject, t)));
    const lo = Math.min(0, ...simple, ...disc), hi = Math.max(0, ...simple, ...disc);
    const pad = (hi - lo) * 0.1 || 1;
    const f = frame(svg, {
      W: 700, H: 280, m: { l: 74, r: 16, t: 26, b: 42 },
      x: [0, flow.length - 1], y: [lo - pad, hi + pad],
      xlab: T('año del proyecto', 'project year'), ylab: T('acumulado', 'accumulated'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    f.plot.appendChild(svgEl('path', { d: pathOf(simple.map((v, t) => [f.sx(t), f.sy(v)])), stroke: 'var(--text-muted)', 'stroke-width': 1.8, fill: 'none', 'stroke-dasharray': '4 3' }));
    f.plot.appendChild(svgEl('path', { d: pathOf(disc.map((v, t) => [f.sx(t), f.sy(v)])), stroke: 'var(--primary)', 'stroke-width': 2.6, fill: 'none' }));
    disc.forEach((v, t) => f.plot.appendChild(svgEl('circle', { cx: f.sx(t), cy: f.sy(v), r: 2.6, fill: 'var(--primary)' })));
    [[m.project.payback, 'var(--text-muted)', T('simple', 'simple')], [m.project.discountedPayback, 'var(--accent)', T('descontado', 'discounted')]].forEach(([pb, colour, label], k) => {
      if (pb == null) return;
      f.plot.appendChild(svgEl('line', { x1: f.sx(pb), x2: f.sx(pb), y1: f.m.t, y2: f.H - f.m.b, stroke: colour, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
      f.g.appendChild(svgEl('text', { x: f.sx(pb) + 4, y: f.m.t + 12 + k * 14, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: colour },
        `${label} ${fmtFixed(pb, 1)} ${T('años', 'years')}`));
    });
    legend(f, [
      [T('acumulado sin descontar', 'accumulated, not discounted'), 'var(--text-muted)', 'ln'],
      [T('acumulado descontado', 'accumulated, discounted'), 'var(--primary)', 'ln'],
    ], 12);
  }

  /* ================================================================
     4 · the net benefit curve of the marginal analysis
     ================================================================ */
  function drawMarginal(svg, mg) {
    if (!svg || !mg || !mg.rows.length) { if (svg) Plot.clear(svg); return; }
    const rows = mg.rows;
    const xs = rows.map(r => r.varCost), ys = rows.map(r => r.net);
    /* the curve is read by its slope —that is the marginal rate of return— so the
       axis frames the data instead of forcing a zero that flattens every step */
    const lo = Math.min(...ys), hi = Math.max(...ys);
    const pad = Math.max((hi - lo) * 0.35, Math.abs(hi) * 0.06) || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 78, r: 20, t: 26, b: 44 },
      x: [Math.min(0, ...xs) - Math.max(...xs) * 0.06, Math.max(...xs) * 1.1 || 1],
      y: [lo < 0 ? lo - pad : Math.max(0, lo - pad), hi + pad],
      xlab: T('costos que varían', 'costs that vary'), ylab: T('beneficio neto', 'net benefit'),
      xlabFmt: v => fmtMoney(v, 0), ylabFmt: v => fmtMoney(v, 0),
    });
    /* the frontier of what is not dominated */
    const kept = mg.kept;
    if (kept.length > 1) {
      f.plot.appendChild(svgEl('path', { d: pathOf(kept.map(r => [f.sx(r.varCost), f.sy(r.net)])), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none' }));
    }
    rows.forEach(r => {
      const isRec = mg.recommended && r === mg.recommended;
      f.plot.appendChild(svgEl('circle', {
        cx: f.sx(r.varCost), cy: f.sy(r.net), r: isRec ? 7 : 5,
        fill: r.dominated ? 'var(--card-bg)' : (isRec ? 'var(--accent)' : 'var(--primary)'),
        stroke: r.dominated ? 'var(--danger)' : 'none', 'stroke-width': 1.6,
      }));
      f.g.appendChild(svgEl('text', {
        x: f.sx(r.varCost), y: f.sy(r.net) - 11, 'font-size': 9.5, 'text-anchor': 'middle',
        class: 'art-txt', 'font-weight': isRec ? 700 : 500,
      }, r.name || String(r.i + 1)));
    });
    legend(f, [
      [T('no dominado', 'not dominated'), 'var(--primary)', 'sq'],
      [T('dominado', 'dominated'), 'var(--danger)', 'sq'],
      [T('recomendado', 'recommended'), 'var(--accent)', 'sq'],
    ], 12);
  }

  window.Plots6 = { drawProfile, drawWaterfall, drawPayback, drawMarginal };
})();
