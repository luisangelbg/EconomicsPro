/* EconomicsPro — the figures of Block 9.

   The profiles of the alternatives with Fisher's crossing, the package that
   fits in the budget, the equivalent annual cost that finds the economic life
   of a machine, and the land expectation value that finds the rotation. */

(function () {

  const { frame, pathOf, legend } = Plot;
  const COLOURS = ['var(--c1)', 'var(--c3)', 'var(--c2)', 'var(--c5)', 'var(--c4)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];
  /* a long project name does not fit next to a bar or in a legend */
  const short = (s, n) => { const t = String(s || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

  /* ================================================================
     1 · the profiles and Fisher's intersection
     ================================================================ */
  function drawCompare(svg, alts, rate, comparison) {
    if (!svg || !alts.length) { if (svg) Plot.clear(svg); return; }
    const irrs = alts.map(a => a.irr).filter(v => v != null && isFinite(v));
    const maxRate = Math.max(0.4, rate * 2, (irrs.length ? Math.max(...irrs) * 1.4 : 0.4));
    const rates = [];
    for (let r = 0; r <= maxRate + 1e-9; r += maxRate / 70) rates.push(r);
    const curves = alts.map(a => rates.map(r => Fin.npv(r, a.flow)));
    const all = curves.reduce((x, c) => x.concat(c), [0]);
    const lo = Math.min(...all), hi = Math.max(...all);
    const pad = (hi - lo) * 0.08 || 1;
    const f = frame(svg, {
      W: 700, H: 320, m: { l: 78, r: 16, t: 26, b: 42 },
      x: [0, maxRate], y: [lo - pad, hi + pad],
      xlab: T('tasa de descuento', 'discount rate'), ylab: T('VAN', 'NPV'),
      xlabFmt: v => (v * 100).toFixed(0) + '%', ylabFmt: v => fmtMoney(v, 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    curves.forEach((c, i) => {
      f.plot.appendChild(svgEl('path', {
        d: pathOf(c.map((v, j) => [f.sx(rates[j]), f.sy(v)])),
        stroke: COLOURS[i % COLOURS.length], 'stroke-width': 2.4, fill: 'none',
      }));
    });
    /* the rate in use */
    f.plot.appendChild(svgEl('line', { x1: f.sx(rate), x2: f.sx(rate), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--sky)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
    f.g.appendChild(svgEl('text', { x: f.sx(rate) + 4, y: f.m.t + 12, 'font-size': 10, class: 'art-txt', 'font-weight': 700, fill: 'var(--sky)' }, T('tu tasa', 'your rate')));
    /* Fisher's crossing */
    if (comparison && comparison.incrementalIRR != null && comparison.incrementalIRR > 0 && comparison.incrementalIRR < maxRate) {
      const x = f.sx(comparison.incrementalIRR);
      const y = f.sy(Fin.npv(comparison.incrementalIRR, comparison.small.flow));
      f.plot.appendChild(svgEl('circle', { cx: x, cy: y, r: 6, fill: 'var(--accent)' }));
      f.plot.appendChild(svgEl('line', { x1: x, x2: x, y1: y, y2: f.H - f.m.b, stroke: 'var(--accent)', 'stroke-width': 1.3, 'stroke-dasharray': '3 3' }));
      f.g.appendChild(svgEl('text', { x: x + 8, y: y - 8, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' },
        T('Fisher ', 'Fisher ') + fmtPct(comparison.incrementalIRR, 1)));
    }
    legend(f, alts.map((a, i) => [short(a.name || String(i + 1), 22), COLOURS[i % COLOURS.length], 'ln']), 12);
  }

  /* ================================================================
     2 · the package that fits the budget
     ================================================================ */
  function drawRationing(svg, r) {
    if (!svg || !r || !r.items.length) { if (svg) Plot.clear(svg); return; }
    const items = r.items.slice().sort((a, b) => (b.pi || 0) - (a.pi || 0));
    const chosen = new Set((r.best ? r.best.pick : r.greedy).map(a => a.i));
    const hi = Math.max(...items.map(a => a.investment)) || 1;
    const f = frame(svg, {
      W: 700, H: 60 + items.length * 32, m: { l: 150, r: 110, t: 20, b: 40 },
      x: [0, hi * 1.08], y: [-0.6, items.length - 0.4], yt: [],
      xlab: T('inversión', 'investment'), xlabFmt: v => fmtMoney(v, 0),
    });
    const bh = (f.H - f.m.t - f.m.b) / items.length * 0.58;
    items.forEach((a, i) => {
      const y = f.sy(items.length - 1 - i) - bh / 2;
      const inside = chosen.has(a.i);
      f.plot.appendChild(svgEl('rect', {
        x: f.m.l, y, width: Math.max(1, f.sx(a.investment) - f.m.l), height: bh, rx: 2.5,
        fill: inside ? 'var(--cash-in)' : 'var(--text-muted)', opacity: inside ? 0.9 : 0.35,
      }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' }, short(a.name, 24) || String(a.i + 1)));
      f.g.appendChild(svgEl('text', { x: f.sx(a.investment) + 6, y: y + bh / 2 + 3.5, 'font-size': 9.5, class: 'art-mut' },
        `IR ${a.pi == null ? '—' : fmtFixed(a.pi, 2)} · ${fmtMoney(a.npv, 0)}`));
    });
    /* the budget */
    if (r.budget > 0 && r.budget <= hi * 1.08) {
      f.plot.appendChild(svgEl('line', { x1: f.sx(r.budget), x2: f.sx(r.budget), y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--danger)', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }));
      f.g.appendChild(svgEl('text', { x: f.sx(r.budget) + 4, y: f.m.t + 10, 'font-size': 9.5, class: 'art-txt', 'font-weight': 700, fill: 'var(--danger)' }, T('presupuesto', 'budget')));
    }
  }

  /* ================================================================
     3 · the economic life of a machine
     ================================================================ */
  function drawReplacement(svg, r) {
    if (!svg || !r || !r.rows.length) { if (svg) Plot.clear(svg); return; }
    const rows = r.rows;
    const hi = Math.max(...rows.map(x => x.eac)) * 1.1;
    const lo = Math.min(...rows.map(x => Math.min(x.capital, x.running))) * 0.9;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 78, r: 16, t: 26, b: 42 },
      x: [rows[0].n, rows[rows.length - 1].n], y: [Math.max(0, lo), hi],
      xlab: T('años que se conserva', 'years it is kept'), ylab: T('costo anual equivalente', 'equivalent annual cost'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
    });
    const line = (key, colour, dash) => f.plot.appendChild(svgEl('path', {
      d: pathOf(rows.map(x => [f.sx(x.n), f.sy(x[key])])), stroke: colour, 'stroke-width': key === 'eac' ? 2.8 : 1.8,
      fill: 'none', 'stroke-dasharray': dash || '',
    }));
    line('capital', 'var(--c6)', '4 3');
    line('running', 'var(--c3)', '4 3');
    line('eac', 'var(--primary)');
    rows.forEach(x => f.plot.appendChild(svgEl('circle', { cx: f.sx(x.n), cy: f.sy(x.eac), r: 2.6, fill: 'var(--primary)' })));
    if (r.best) {
      f.plot.appendChild(svgEl('circle', { cx: f.sx(r.best.n), cy: f.sy(r.best.eac), r: 6, fill: 'var(--accent)' }));
      f.plot.appendChild(svgEl('line', { x1: f.sx(r.best.n), x2: f.sx(r.best.n), y1: f.sy(r.best.eac), y2: f.H - f.m.b, stroke: 'var(--accent)', 'stroke-width': 1.3, 'stroke-dasharray': '3 3' }));
      /* when the minimum falls near the right edge the label would be cut off,
         so it turns around and goes to the left of its point */
      const cabe = f.sx(r.best.n) < f.W - f.m.r - 150;
      f.g.appendChild(svgEl("text", {
        x: f.sx(r.best.n) + (cabe ? 8 : -8), y: f.sy(r.best.eac) - 8, "font-size": 10.5,
        "text-anchor": cabe ? "start" : "end", class: "art-txt", "font-weight": 700, fill: "var(--accent)",
        style: "paint-order:stroke; stroke:var(--surface-alt); stroke-width:3.5px;",
      }, T(`vida económica: ${r.best.n} años`, `economic life: ${r.best.n} years`)));
    }
    legend(f, [
      [T('costo anual equivalente', 'equivalent annual cost'), 'var(--primary)', 'ln'],
      [T('parte de capital', 'capital part'), 'var(--c6)', 'ln'],
      [T('parte de operación', 'running part'), 'var(--c3)', 'ln'],
    ], 12);
  }

  /* ================================================================
     4 · the optimal rotation
     ================================================================ */
  function drawRotation(svg, r) {
    if (!svg || !r || !r.rows.length) { if (svg) Plot.clear(svg); return; }
    const rows = r.rows;
    const vals = rows.map(x => x.lev).concat(rows.map(x => x.npv));
    const lo = Math.min(0, ...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 78, r: 16, t: 26, b: 42 },
      x: [rows[0].years - 0.6, rows[rows.length - 1].years + 0.6], y: [lo - pad, hi + pad],
      xlab: T('años del turno', 'years of the rotation'), ylab: T('valor', 'value'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(x => x.years),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = Math.max(6, (f.W - f.m.l - f.m.r) / rows.length * 0.42);
    rows.forEach(x => {
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(x.years) - w - 1, y: Math.min(f.sy(0), f.sy(x.npv)), width: w,
        height: Math.max(1, Math.abs(f.sy(x.npv) - f.sy(0))), rx: 2, fill: 'var(--c3)', opacity: 0.8,
      }));
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(x.years) + 1, y: Math.min(f.sy(0), f.sy(x.lev)), width: w,
        height: Math.max(1, Math.abs(f.sy(x.lev) - f.sy(0))), rx: 2,
        fill: r.best && x.years === r.best.years ? 'var(--accent)' : 'var(--primary)', opacity: 0.9,
      }));
    });
    if (r.best) {
      f.g.appendChild(svgEl('text', {
        x: f.sx(r.best.years), y: f.sy(r.best.lev) - 10, 'font-size': 10.5, 'text-anchor': 'middle',
        class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)',
      }, T(`turno óptimo: ${r.best.years} años`, `optimal rotation: ${r.best.years} years`)));
    }
    legend(f, [
      [T('VAN de una rotación', 'NPV of one rotation'), 'var(--c3)', 'sq'],
      [T('valor de la tierra (Faustmann)', 'land expectation value (Faustmann)'), 'var(--primary)', 'sq'],
    ], 12);
  }

  window.Plots9 = { drawCompare, drawRationing, drawReplacement, drawRotation };
})();
