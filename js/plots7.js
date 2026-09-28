/* EconomicsPro — the figures of Block 7.

   The spider of one-way sensitivity, the tornado, the heat map of two
   variables at once with the line where the project stops being worth doing,
   the histogram of the simulated NPV with its loss tail, what explains that
   spread, and the decision tree of waiting a year. */

(function () {

  const { frame, pathOf, legend } = Plot;
  const COLOURS = { price: 'var(--c1)', yield: 'var(--c3)', cost: 'var(--c4)', invest: 'var(--c6)', rate: 'var(--c5)' };

  /* ================================================================
     1 · the spider
     ================================================================ */
  function drawSpider(svg, lines) {
    if (!svg || !lines.length) { if (svg) Plot.clear(svg); return; }
    const changes = lines[0].points.map(p => p.change);
    const vals = lines.reduce((a, l) => a.concat(l.points.map(p => p.npv)), []);
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const pad = (hi - lo) * 0.08 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 74, r: 16, t: 26, b: 42 },
      x: [Math.min(...changes), Math.max(...changes)], y: [lo - pad, hi + pad],
      xlab: T('cambio en la variable', 'change in the variable'), ylab: T('VAN', 'NPV'),
      xlabFmt: v => (v > 0 ? '+' : '') + (v * 100).toFixed(0) + '%',
      ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    f.plot.appendChild(svgEl('line', { x1: f.sx(0), x2: f.sx(0), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
    /* the label of each line goes at its right end; when two lines finish close
       together the names would sit on top of each other, so they are pushed
       apart just enough to be read */
    const marcas = [];
    lines.forEach(l => {
      f.plot.appendChild(svgEl('path', {
        d: pathOf(l.points.map(p => [f.sx(p.change), f.sy(p.npv)])),
        stroke: COLOURS[l.key] || 'var(--c10)', 'stroke-width': 2.2, fill: 'none',
      }));
      const last = l.points[l.points.length - 1];
      marcas.push({ y: f.sy(last.npv) - 5, txt: T(l.es, l.en), col: COLOURS[l.key] || 'var(--c10)' });
    });
    marcas.sort((a, b) => a.y - b.y);
    const hueco = 12;
    for (let i = 1; i < marcas.length; i++) {
      if (marcas[i].y - marcas[i - 1].y < hueco) marcas[i].y = marcas[i - 1].y + hueco;
    }
    const fondo = f.H - f.m.b - 2;
    for (let i = marcas.length - 1; i >= 0; i--) {
      if (marcas[i].y > fondo) marcas[i].y = fondo;
      if (i > 0 && marcas[i].y - marcas[i - 1].y < hueco) marcas[i - 1].y = marcas[i].y - hueco;
    }
    marcas.forEach(m => {
      f.g.appendChild(svgEl('text', {
        x: f.W - f.m.r - 4, y: m.y, 'font-size': 9.5, 'text-anchor': 'end',
        class: 'art-txt', 'font-weight': 600, fill: m.col,
        style: 'paint-order:stroke; stroke:var(--surface); stroke-width:3px;',
      }, m.txt));
    });
    legend(f, lines.map(l => [T(l.es, l.en), COLOURS[l.key] || 'var(--c10)', 'ln']), 12);
  }

  /* ================================================================
     2 · the tornado
     ================================================================ */
  function drawTornado(svg, rows, baseNpv) {
    if (!svg || !rows.length) { if (svg) Plot.clear(svg); return; }
    const lo = Math.min(baseNpv, ...rows.map(r => r.low)), hi = Math.max(baseNpv, ...rows.map(r => r.high));
    const pad = (hi - lo) * 0.12 || 1;
    const f = frame(svg, {
      W: 700, H: 60 + rows.length * 34, m: { l: 150, r: 20, t: 20, b: 40 },
      x: [lo - pad, hi + pad], y: [-0.6, rows.length - 0.4], yt: [],
      xlab: T('VAN', 'NPV'), xlabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.sx(baseNpv), x2: f.sx(baseNpv), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--border-strong)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }));
    if (lo < 0 && hi > 0) {
      f.plot.appendChild(svgEl('line', { x1: f.sx(0), x2: f.sx(0), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--danger)', 'stroke-width': 1.4 }));
      f.g.appendChild(svgEl('text', { x: f.sx(0) + 4, y: f.m.t + 10, 'font-size': 9.5, class: 'art-txt', fill: 'var(--danger)', 'font-weight': 700 }, 'VAN = 0'));
    }
    const bh = (f.H - f.m.t - f.m.b) / rows.length * 0.56;
    rows.forEach((r, i) => {
      const y = f.sy(rows.length - 1 - i) - bh / 2;
      f.plot.appendChild(svgEl('rect', { x: Math.min(f.sx(r.low), f.sx(baseNpv)), y, width: Math.abs(f.sx(baseNpv) - f.sx(r.low)), height: bh, rx: 2, fill: 'var(--cash-out)', opacity: 0.85 }));
      f.plot.appendChild(svgEl('rect', { x: Math.min(f.sx(r.high), f.sx(baseNpv)), y, width: Math.abs(f.sx(r.high) - f.sx(baseNpv)), height: bh, rx: 2, fill: 'var(--cash-in)', opacity: 0.85 }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' }, T(r.es, r.en)));
    });
  }

  /* ================================================================
     3 · two variables at once
     ================================================================ */
  function drawHeat(svg, g, labels) {
    if (!svg || !g || !g.rows.length) { if (svg) Plot.clear(svg); return; }
    const vals = g.rows.reduce((a, r) => a.concat(r.values), []);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const n = g.changes.length;
    const f = frame(svg, {
      W: 700, H: 340, m: { l: 74, r: 20, t: 26, b: 50 },
      x: [-0.5, n - 0.5], y: [-0.5, n - 0.5], xt: [], yt: [],
      xlab: labels ? labels.a : '', ylab: labels ? labels.b : '',
    });
    const cw = (f.W - f.m.l - f.m.r) / n, ch = (f.H - f.m.t - f.m.b) / n;
    /* a negative NPV is red, a positive one green, and the scale is shared */
    /* the fill never gets so dark that the number stops being readable: the
       scale runs from a light tint to a firm one, not to a solid block */
    const colourOf = v => {
      if (v >= 0) {
        const t = hi > 0 ? Math.min(1, v / hi) : 0;
        return `rgba(var(--leaf-rgb), ${(0.12 + 0.56 * t).toFixed(3)})`;
      }
      const t = lo < 0 ? Math.min(1, v / lo) : 0;
      return `rgba(196, 58, 47, ${(0.12 + 0.56 * t).toFixed(3)})`;
    };
    g.rows.forEach((row, j) => {
      row.values.forEach((v, i) => {
        f.plot.appendChild(svgEl('rect', {
          x: f.sx(i) - cw / 2, y: f.sy(j) - ch / 2, width: cw - 1, height: ch - 1, rx: 2,
          fill: colourOf(v),
        }));
        if (cw > 52) {
          f.g.appendChild(svgEl('text', {
            x: f.sx(i), y: f.sy(j) + 3.5, 'font-size': 9, 'text-anchor': 'middle',
            class: 'art-txt', 'font-weight': v >= 0 ? 500 : 700,
          }, fmtMoney(v, 0)));
        }
      });
    });
    /* the axis labels: the percentage change of each variable */
    g.changes.forEach((c, i) => {
      f.g.appendChild(svgEl('text', { x: f.sx(i), y: f.H - f.m.b + 14, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-mut' },
        (c > 0 ? '+' : '') + (c * 100).toFixed(0) + '%'));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: f.sy(i) + 3.5, 'font-size': 9.5, 'text-anchor': 'end', class: 'art-mut' },
        (c > 0 ? '+' : '') + (c * 100).toFixed(0) + '%'));
    });
  }

  /* ================================================================
     4 · the simulation
     ================================================================ */
  function drawHistogram(svg, sim) {
    if (!svg || !sim) { if (svg) Plot.clear(svg); return; }
    const h = Stats.histogram(sim.values, 28);
    const maxP = Math.max(...h.bins.map(b => b.p));
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 62, r: 16, t: 30, b: 42 },
      x: [h.min, h.max], y: [0, maxP * 1.14],
      xlab: T('VAN simulado', 'simulated NPV'), ylab: T('frecuencia', 'frequency'),
      xlabFmt: v => fmtMoney(v, 0), ylabFmt: v => (v * 100).toFixed(0) + '%',
    });
    h.bins.forEach(b => {
      const x = f.sx(b.from), w = Math.max(1, f.sx(b.to) - f.sx(b.from) - 1);
      f.plot.appendChild(svgEl('rect', {
        x, y: f.sy(b.p), width: w, height: Math.max(0.5, f.sy(0) - f.sy(b.p)), rx: 1.4,
        fill: b.to <= 0 ? 'var(--cash-out)' : 'var(--primary)', opacity: 0.85,
      }));
    });
    if (h.min < 0 && h.max > 0) {
      f.plot.appendChild(svgEl('line', { x1: f.sx(0), x2: f.sx(0), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--danger)', 'stroke-width': 1.8 }));
      f.g.appendChild(svgEl('text', { x: f.sx(0) + 5, y: f.m.t + 28, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: 'var(--danger)', style: 'paint-order:stroke; stroke:var(--surface); stroke-width:3px;' },
        `P(VAN < 0) = ${fmtPct(sim.pLoss, 1)}`));
    }
    [['p05', 'P5'], ['median', T('mediana', 'median')], ['p95', 'P95']].forEach(([k, label]) => {
      const v = sim[k];
      if (v == null || v < h.min || v > h.max) return;
      f.plot.appendChild(svgEl('line', { x1: f.sx(v), x2: f.sx(v), y1: f.sy(maxP * 1.05), y2: f.sy(0), stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': k === 'median' ? '' : '3 3', opacity: 0.9 }));
      f.g.appendChild(svgEl('text', { x: f.sx(v), y: f.sy(maxP * 1.07), 'font-size': 9, 'text-anchor': 'middle', class: 'art-mut', style: 'paint-order:stroke; stroke:var(--surface); stroke-width:3px;' }, label));
    });
  }

  /* what explains the spread of the result */
  function drawDrivers(svg, drivers) {
    if (!svg || !drivers || !drivers.length) { if (svg) Plot.clear(svg); return; }
    const f = frame(svg, {
      W: 700, H: 50 + drivers.length * 32, m: { l: 150, r: 20, t: 16, b: 38 },
      x: [-1, 1], y: [-0.6, drivers.length - 0.4], yt: [],
      xlab: T('correlación con el VAN', 'correlation with the NPV'), xlabFmt: v => v.toFixed(1),
    });
    f.plot.appendChild(svgEl('line', { x1: f.sx(0), x2: f.sx(0), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const bh = (f.H - f.m.t - f.m.b) / drivers.length * 0.56;
    drivers.forEach((d, i) => {
      const y = f.sy(drivers.length - 1 - i) - bh / 2;
      f.plot.appendChild(svgEl('rect', {
        x: Math.min(f.sx(0), f.sx(d.r)), y, width: Math.abs(f.sx(d.r) - f.sx(0)), height: bh, rx: 2,
        fill: d.r >= 0 ? 'var(--cash-in)' : 'var(--cash-out)', opacity: 0.85,
      }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' }, T(d.es, d.en)));
      f.g.appendChild(svgEl('text', {
        x: f.sx(d.r) + (d.r >= 0 ? 6 : -6), y: y + bh / 2 + 3.5, 'font-size': 9.5,
        'text-anchor': d.r >= 0 ? 'start' : 'end', class: 'art-mut',
      }, fmtFixed(d.r, 2)));
    });
  }

  /* ================================================================
     5 · the decision tree
     ================================================================ */
  function drawTree(svg, tree) {
    if (!svg || !tree) { if (svg) Plot.clear(svg); return; }
    Plot.clear(svg);
    svg.setAttribute('viewBox', '0 0 700 280');
    const g = svgEl('g');
    svg.appendChild(g);
    const money = v => fmtMoney(v, 0);
    const node = (x, y, kind, label) => {
      if (kind === 'decision') g.appendChild(svgEl('rect', { x: x - 9, y: y - 9, width: 18, height: 18, rx: 2, fill: 'var(--primary)' }));
      else g.appendChild(svgEl('circle', { cx: x, cy: y, r: 9, fill: 'var(--accent)' }));
      if (label) g.appendChild(svgEl('text', { x, y: y - 16, 'font-size': 10, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600 }, label));
    };
    const branch = (x1, y1, x2, y2, label, colour) => {
      g.appendChild(svgEl('path', { d: `M${x1} ${y1} L${x2} ${y2}`, stroke: colour || 'var(--border-strong)', 'stroke-width': 1.8, fill: 'none' }));
      if (label) g.appendChild(svgEl('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, 'font-size': 9.5, 'text-anchor': 'middle', class: 'art-mut', style: 'paint-order:stroke; stroke:var(--surface-alt); stroke-width:3.5px;' }, label));
    };
    const leaf = (x, y, value, label, best) => {
      g.appendChild(svgEl('rect', { x, y: y - 16, width: 150, height: 32, rx: 5, fill: value >= 0 ? 'rgba(var(--leaf-rgb),0.16)' : 'rgba(196,58,47,0.14)', stroke: best ? 'var(--accent)' : 'none', 'stroke-width': 2 }));
      g.appendChild(svgEl('text', { x: x + 10, y: y - 2, 'font-size': 10, class: 'art-txt', 'font-weight': 600 }, label));
      g.appendChild(svgEl('text', { x: x + 10, y: y + 11, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700 }, money(value)));
    };
    /* the decision */
    node(40, 140, 'decision');
    /* invest now */
    branch(49, 140, 150, 70, T('invertir ahora', 'invest now'), 'var(--primary)');
    leaf(150, 70, tree.now, T('VAN esperado', 'expected NPV'), tree.best === 'now');
    /* wait a year */
    branch(49, 140, 150, 210, T('esperar un año', 'wait a year'), 'var(--c5)');
    node(159, 210, 'chance');
    branch(168, 210, 300, 170, `${T('bueno', 'good')} ${fmtPct(tree.q, 0)}`, 'var(--cash-in)');
    leaf(300, 170, Math.max(0, tree.good), tree.good > 0 ? T('se invierte', 'invest') : T('no se invierte', 'do not invest'), false);
    branch(168, 210, 300, 250, `${T('malo', 'bad')} ${fmtPct(1 - tree.q, 0)}`, 'var(--cash-out)');
    leaf(300, 250, Math.max(0, tree.bad), tree.bad > 0 ? T('se invierte', 'invest') : T('no se invierte', 'do not invest'), false);
    /* the value of waiting, already discounted one year */
    g.appendChild(svgEl('text', { x: 480, y: 206, 'font-size': 10, class: 'art-mut' }, T('valor de esperar, descontado un año', 'value of waiting, discounted one year')));
    leaf(480, 226, tree.wait, T('esperar', 'wait'), tree.best === 'wait');
  }

  window.Plots7 = { drawSpider, drawTornado, drawHeat, drawHistogram, drawDrivers, drawTree };
})();
