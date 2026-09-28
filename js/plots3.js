/* EconomicsPro — the figures of Block 3.

   The history and the forecast in one picture (with the band, because a
   forecast without its uncertainty is a guess dressed up as a number), the
   market the project enters, and the revenue programme year by year. */

(function () {

  const { frame, pathOf, legend } = Plot;

  /* ================================================================
     1 · the series, its fit and its forecast
     ================================================================ */
  function drawSeries(svg, desc, fc, opt) {
    if (!svg) return;
    const o = opt || {};
    const hist = (desc.years || []).map((y, i) => ({ year: y, value: desc.values[i] }));
    const fut = (fc && fc.values) || [];
    if (!hist.length && !fut.length) { Plot.clear(svg); return; }
    const years = hist.map(h => h.year).concat(fut.map(f => f.year));
    const vals = hist.map(h => h.value).concat(fut.map(f => f.value), fut.map(f => f.low), fut.map(f => f.high));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 62, r: 16, t: 26, b: 42 },
      x: [Math.min(...years) - 0.5, Math.max(...years) + 0.5],
      y: [Math.max(0, lo - pad), hi + pad],
      xlab: T('año', 'year'), ylab: o.ylab || T('precio real', 'real price'),
      xlabFmt: v => String(Math.round(v)),
      ylabFmt: o.money === false ? Plot.tickLabel : v => fmtMoney(v, 0),
    });
    /* the band of the forecast */
    if (fut.length) {
      const up = fut.map(p => [f.sx(p.year), f.sy(p.high)]);
      const dn = fut.map(p => [f.sx(p.year), f.sy(p.low)]).reverse();
      const start = hist.length ? [[f.sx(hist[hist.length - 1].year), f.sy(hist[hist.length - 1].value)]] : [];
      f.plot.appendChild(svgEl('path', {
        d: pathOf(start.concat(up)) + ' ' + pathOf(dn).replace('M', 'L') + ' Z',
        fill: 'var(--primary)', opacity: 0.14, stroke: 'none',
      }));
    }
    /* the straight line of the trend, over the years it was fitted on */
    if (o.showTrend && desc.trend && hist.length > 1) {
      const y0 = desc.trend.a + desc.trend.b * hist[0].year;
      const y1 = desc.trend.a + desc.trend.b * hist[hist.length - 1].year;
      f.plot.appendChild(svgEl('line', {
        x1: f.sx(hist[0].year), y1: f.sy(y0), x2: f.sx(hist[hist.length - 1].year), y2: f.sy(y1),
        stroke: 'var(--accent)', 'stroke-width': 1.8, 'stroke-dasharray': '5 3',
      }));
    }
    /* the history */
    if (hist.length) {
      f.plot.appendChild(svgEl('path', { d: pathOf(hist.map(h => [f.sx(h.year), f.sy(h.value)])), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none' }));
      hist.forEach(h => f.plot.appendChild(svgEl('circle', { cx: f.sx(h.year), cy: f.sy(h.value), r: 3.2, fill: 'var(--primary)' })));
    }
    /* the forecast */
    if (fut.length) {
      const join = hist.length ? [[f.sx(hist[hist.length - 1].year), f.sy(hist[hist.length - 1].value)]] : [];
      f.plot.appendChild(svgEl('path', {
        d: pathOf(join.concat(fut.map(p => [f.sx(p.year), f.sy(p.value)]))),
        stroke: 'var(--leaf)', 'stroke-width': 2.4, fill: 'none', 'stroke-dasharray': '6 4',
      }));
      fut.forEach(p => f.plot.appendChild(svgEl('circle', { cx: f.sx(p.year), cy: f.sy(p.value), r: 2.6, fill: 'var(--leaf)' })));
      /* the line that separates what happened from what is assumed */
      const cut = (hist.length ? hist[hist.length - 1].year : fut[0].year - 1) + 0.5;
      f.plot.appendChild(svgEl('line', { x1: f.sx(cut), x2: f.sx(cut), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--border-strong)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
      f.g.appendChild(svgEl('text', { x: f.sx(cut) + 5, y: f.m.t + 11, 'font-size': 9.5, class: 'art-mut' }, T('proyección →', 'forecast →')));
    }
    legend(f, [
      [T('observado', 'observed'), 'var(--primary)', 'ln'],
      [T('proyectado', 'projected'), 'var(--leaf)', 'ln'],
    ].concat(o.showTrend && desc.trend ? [[T('tendencia', 'trend'), 'var(--accent)', 'ln']] : []), 12);
  }

  /* ================================================================
     2 · the market: demand, supply and the gap the project fits into
     ================================================================ */
  function drawMarket(svg, balance, opt) {
    if (!svg || !balance || !balance.rows.length) { if (svg) Plot.clear(svg); return; }
    const o = opt || {};
    const rows = balance.rows;
    const hi = Math.max(...rows.map(r => Math.max(r.demand, r.supply)));
    const f = frame(svg, {
      W: 700, H: 280, m: { l: 66, r: 16, t: 26, b: 42 },
      x: [rows[0].t - 0.5, rows[rows.length - 1].t + 0.5], y: [0, hi * 1.12],
      xlab: T('año del proyecto', 'project year'), ylab: o.unit || T('volumen', 'volume'),
      xlabFmt: v => String(Math.round(v)),
    });
    /* the unsatisfied demand, as an area between the two lines */
    const dem = rows.map(r => [f.sx(r.t), f.sy(r.demand)]);
    const sup = rows.map(r => [f.sx(r.t), f.sy(r.supply)]).reverse();
    f.plot.appendChild(svgEl('path', { d: pathOf(dem) + ' ' + pathOf(sup).replace('M', 'L') + ' Z', fill: 'var(--leaf)', opacity: 0.16 }));
    f.plot.appendChild(svgEl('path', { d: pathOf(dem), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none' }));
    f.plot.appendChild(svgEl('path', { d: pathOf(rows.map(r => [f.sx(r.t), f.sy(r.supply)])), stroke: 'var(--accent)', 'stroke-width': 2.4, fill: 'none' }));
    /* what the project would add */
    if (o.projectVolume > 0) {
      rows.forEach(r => {
        const h = f.sy(r.supply) - f.sy(r.supply + o.projectVolume);
        const w = Math.max(3, (f.W - f.m.l - f.m.r) / rows.length * 0.42);
        f.plot.appendChild(svgEl('rect', { x: f.sx(r.t) - w / 2, y: f.sy(r.supply + o.projectVolume), width: w, height: Math.max(1, h), fill: 'var(--c1)', opacity: 0.75, rx: 1.4 }));
      });
    }
    legend(f, [
      [T('demanda', 'demand'), 'var(--primary)', 'ln'],
      [T('oferta', 'supply'), 'var(--accent)', 'ln'],
      [T('demanda insatisfecha', 'unsatisfied demand'), 'var(--leaf)', 'sq'],
    ].concat(o.projectVolume > 0 ? [[T('el proyecto', 'the project'), 'var(--c1)', 'sq']] : []), 12);
  }

  /* ================================================================
     3 · the revenue programme
     ================================================================ */
  function drawProgramme(svg, prog) {
    if (!svg || !prog || !prog.rows.length) { if (svg) Plot.clear(svg); return; }
    const rows = prog.rows;
    const hi = Math.max(...rows.map(r => r.total)) || 1;
    const maxProd = Math.max(...rows.map(r => r.production)) || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 66, r: 52, t: 26, b: 42 },
      x: [rows[0].t - 0.6, rows[rows.length - 1].t + 0.6], y: [0, hi * 1.15],
      xlab: T('año del proyecto', 'project year'), ylab: T('ingreso', 'revenue'),
      xlabFmt: v => String(Math.round(v)),
      ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.62);
    rows.forEach(r => {
      const x = f.sx(r.t) - w / 2;
      /* the main product and, on top of it, the by-products and other income */
      const h1 = f.sy(0) - f.sy(r.revenue);
      f.plot.appendChild(svgEl('rect', { x, y: f.sy(r.revenue), width: w, height: Math.max(0.5, h1), rx: 1.5, fill: 'var(--cash-in)', opacity: 0.9 }));
      const extra = r.byproducts + r.other;
      if (extra > 0) {
        const h2 = f.sy(r.revenue) - f.sy(r.revenue + extra);
        f.plot.appendChild(svgEl('rect', { x, y: f.sy(r.revenue + extra), width: w, height: Math.max(0.5, h2), rx: 1.5, fill: 'var(--accent)', opacity: 0.85 }));
      }
    });
    /* the production, on its own scale at the right */
    const py = v => f.sy(0) - (v / maxProd) * (f.sy(0) - f.m.t) * 0.92;
    f.plot.appendChild(svgEl('path', { d: pathOf(rows.map(r => [f.sx(r.t), py(r.production)])), stroke: 'var(--primary)', 'stroke-width': 2.2, fill: 'none', 'stroke-dasharray': '5 3' }));
    rows.forEach(r => f.plot.appendChild(svgEl('circle', { cx: f.sx(r.t), cy: py(r.production), r: 2.4, fill: 'var(--primary)' })));
    f.g.appendChild(svgEl('text', {
      x: f.W - f.m.r + 6, y: py(maxProd) + 4, 'font-size': 9.5, class: 'art-mut',
    }, fmtNum(maxProd, 1)));
    f.g.appendChild(svgEl('text', {
      x: f.W - 8, y: (f.m.t + f.H - f.m.b) / 2, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600,
      transform: `rotate(-90 ${f.W - 8} ${(f.m.t + f.H - f.m.b) / 2})`,
    }, T('producción', 'production')));
    legend(f, [
      [T('producto principal', 'main product'), 'var(--cash-in)', 'sq'],
      [T('subproductos y otros', 'by-products and other'), 'var(--accent)', 'sq'],
      [T('producción', 'production'), 'var(--primary)', 'ln'],
    ], 12);
  }

  window.Plots3 = { drawSeries, drawMarket, drawProgramme };
})();
