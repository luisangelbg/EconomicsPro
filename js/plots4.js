/* EconomicsPro — the figures of Block 4.

   Where the money goes (the structure of the investment), when it has to be
   there (the calendar, with the working capital that nobody remembers until it
   is missing), and what it costs to keep the project running every year, with
   the unit cost that decides whether the price is enough. */

(function () {

  const { frame, pathOf, legend } = Plot;
  const KIND_COLOUR = {
    land: 'c9', works: 'c1', planting: 'c3', machinery: 'c5',
    equipment: 'c2', vehicles: 'c6', livestock: 'c4', other: 'c10',
  };
  const GROUP_COLOUR = {
    labour: 'c1', inputs: 'c3', machinery: 'c5', services: 'c2', admin: 'c8', other: 'c10',
  };

  /* ================================================================
     1 · the structure of the investment
     ================================================================ */
  function drawStructure(svg, model) {
    if (!svg) return;
    const kinds = Object.keys(model.summary.byKind)
      .map(k => ({ k, v: model.summary.byKind[k] }))
      .filter(x => x.v > 0)
      .sort((a, b) => b.v - a.v);
    const extra = [];
    if (model.summary.deferred > 0) extra.push({ k: 'deferred', v: model.summary.deferred });
    if (model.summary.workingCapital > 0) extra.push({ k: 'wc', v: model.summary.workingCapital });
    const all = kinds.concat(extra);
    if (!all.length) { Plot.clear(svg); return; }
    const total = all.reduce((a, x) => a + x.v, 0);
    const label = x => x.k === 'deferred' ? T('Inversión diferida', 'Pre-operating investment')
      : x.k === 'wc' ? T('Capital de trabajo', 'Working capital')
        : T(Budget.KINDS[x.k].es, Budget.KINDS[x.k].en);
    const colour = x => x.k === 'deferred' ? 'var(--c8)' : x.k === 'wc' ? 'var(--coin)' : `var(--${KIND_COLOUR[x.k] || 'c10'})`;

    const f = frame(svg, {
      W: 700, H: 40 + all.length * 30, m: { l: 220, r: 90, t: 16, b: 34 },
      x: [0, Math.max(...all.map(x => x.v)) * 1.08], y: [-0.6, all.length - 0.4], yt: [],
      xlab: T('inversión', 'investment'), xlabFmt: v => fmtMoney(v, 0),
    });
    const bh = (f.H - f.m.t - f.m.b) / all.length * 0.62;
    all.forEach((x, i) => {
      const y = f.sy(all.length - 1 - i) - bh / 2;
      f.plot.appendChild(svgEl('rect', { x: f.m.l, y, width: Math.max(1, f.sx(x.v) - f.m.l), height: bh, rx: 2.5, fill: colour(x), opacity: 0.9 }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' }, label(x)));
      f.g.appendChild(svgEl('text', { x: f.sx(x.v) + 6, y: y + bh / 2 + 3.5, 'font-size': 9.5, class: 'art-mut' },
        fmtMoney(x.v, 0) + '  ' + fmtPct(x.v / total, 0)));
    });
  }

  /* ================================================================
     2 · the calendar of what has to be paid
     ================================================================ */
  function drawSchedule(svg, model) {
    if (!svg || !model.schedule.length) { if (svg) Plot.clear(svg); return; }
    const rows = model.schedule;
    const hi = Math.max(...rows.map(r => r.total)) || 1;
    const f = frame(svg, {
      W: 700, H: 280, m: { l: 70, r: 16, t: 26, b: 42 },
      x: [-0.6, rows.length - 0.4], y: [0, hi * 1.12],
      xlab: T('año del proyecto', 'project year'), ylab: T('inversión', 'investment'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.6);
    const parts = [
      ['fixed', 'var(--c1)', T('inversión fija', 'fixed investment')],
      ['deferred', 'var(--c8)', T('diferida', 'pre-operating')],
      ['replacement', 'var(--c6)', T('reposiciones', 'replacements')],
      ['workingCapital', 'var(--coin)', T('capital de trabajo', 'working capital')],
    ];
    rows.forEach(r => {
      let acc = 0;
      parts.forEach(([key, colour]) => {
        const v = r[key] || 0;
        if (v <= 0) return;
        const y0 = f.sy(acc), y1 = f.sy(acc + v);
        f.plot.appendChild(svgEl('rect', { x: f.sx(r.t) - w / 2, y: y1, width: w, height: Math.max(0.6, y0 - y1), rx: 1.5, fill: colour, opacity: 0.9 }));
        acc += v;
      });
    });
    legend(f, parts.map(([, colour, label]) => [label, colour, 'sq']), 12);
  }

  /* ================================================================
     3 · the annual cost and what a tonne costs to produce
     ================================================================ */
  function drawCosts(svg, model, opt) {
    if (!svg || !model.costs.length) { if (svg) Plot.clear(svg); return; }
    const o = opt || {};
    const rows = model.costs;
    const dep = model.depreciation.byYear, amo = model.amortisation.byYear;
    const totalOf = r => r.variable + r.fixed + (dep[r.t] || 0) + (amo[r.t] || 0);
    const hi = Math.max(...rows.map(totalOf)) || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 70, r: 60, t: 26, b: 42 },
      x: [rows[0].t - 0.6, rows[rows.length - 1].t + 0.6], y: [0, hi * 1.14],
      xlab: T('año del proyecto', 'project year'), ylab: T('costo', 'cost'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.62);
    rows.forEach(r => {
      let acc = 0;
      const stack = [
        [r.variable, 'var(--c3)', 0.9],
        [r.fixed, 'var(--c5)', 0.9],
        [(dep[r.t] || 0) + (amo[r.t] || 0), 'var(--text-muted)', 0.45],
      ];
      stack.forEach(([v, colour, op]) => {
        if (v <= 0) return;
        const y0 = f.sy(acc), y1 = f.sy(acc + v);
        f.plot.appendChild(svgEl('rect', { x: f.sx(r.t) - w / 2, y: y1, width: w, height: Math.max(0.6, y0 - y1), rx: 1.5, fill: colour, opacity: op }));
        acc += v;
      });
    });
    /* the unit cost, on its own scale at the right: the number that has to be
       compared with the price of Block 3 */
    const unitVals = rows.map(r => r.perOutput).filter(v => v != null && isFinite(v) && v > 0);
    if (unitVals.length) {
      const umax = Math.max(...unitVals) * 1.2;
      const uy = v => f.sy(0) - (v / umax) * (f.sy(0) - f.m.t);
      const pts = rows.filter(r => r.perOutput != null && isFinite(r.perOutput) && r.perOutput > 0).map(r => [f.sx(r.t), uy(r.perOutput)]);
      f.plot.appendChild(svgEl('path', { d: pathOf(pts), stroke: 'var(--accent)', 'stroke-width': 2.2, fill: 'none', 'stroke-dasharray': '5 3' }));
      pts.forEach(pt => f.plot.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 2.4, fill: 'var(--accent)' })));
      /* the projected price, to see whether the cost fits under it */
      if (o.price > 0 && o.price < umax) {
        f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: uy(o.price), y2: uy(o.price), stroke: 'var(--cash-in)', 'stroke-width': 1.6, 'stroke-dasharray': '2 3' }));
        f.g.appendChild(svgEl('text', { x: f.m.l + 4, y: uy(o.price) - 5, 'font-size': 9.5, class: 'art-txt', fill: 'var(--cash-in)', 'font-weight': 600, stroke: 'var(--card-bg)', 'stroke-width': 3, 'paint-order': 'stroke' },
          T('precio ', 'price ') + fmtMoney(o.price, 0)));
      }
      f.g.appendChild(svgEl('text', {
        x: f.W - 8, y: (f.m.t + f.H - f.m.b) / 2, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600,
        transform: `rotate(-90 ${f.W - 8} ${(f.m.t + f.H - f.m.b) / 2})`,
      }, T('costo por tonelada', 'cost per tonne')));
    }
    legend(f, [
      [T('costos variables', 'variable costs'), 'var(--c3)', 'sq'],
      [T('costos fijos', 'fixed costs'), 'var(--c5)', 'sq'],
      [T('depreciación (no es salida de dinero)', 'depreciation (not a cash outflow)'), 'var(--text-muted)', 'sq'],
      [T('costo por tonelada', 'cost per tonne'), 'var(--accent)', 'ln'],
    ], 12);
  }

  /* ================================================================
     4 · where the annual cost goes, by group
     ================================================================ */
  function drawGroups(svg, model) {
    if (!svg) { return; }
    /* the year at full production, the same one the summary reports: the first
       producing year is not it while the plantation is still maturing */
    const pmax = Math.max(...model.costs.map(x => x.production || 0));
    const row = model.costs.find(r => !r.growing && r.cash > 0 && (pmax <= 0 || (r.production || 0) >= pmax * 0.999)) || model.costs[model.costs.length - 1];
    if (!row) { Plot.clear(svg); return; }
    const items = Object.keys(row.byGroup).map(g => ({ g, v: row.byGroup[g] })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    /* the annual fixed costs are not part of any technical group: they go in
       at the end, as their own bar */
    const annualFixed = (model.fixedList || []).reduce((a, f) => a + (Number(f.amount) || 0), 0);
    if (annualFixed > 0) items.push({ g: 'admin', v: annualFixed, isFixed: true });
    if (!items.length) { Plot.clear(svg); return; }
    const total = items.reduce((a, x) => a + x.v, 0);
    const f = frame(svg, {
      W: 700, H: 40 + items.length * 30, m: { l: 200, r: 90, t: 16, b: 34 },
      x: [0, Math.max(...items.map(x => x.v)) * 1.08], y: [-0.6, items.length - 0.4], yt: [],
      xlab: T('costo anual a plena producción', 'annual cost at full production'), xlabFmt: v => fmtMoney(v, 0),
    });
    const bh = (f.H - f.m.t - f.m.b) / items.length * 0.62;
    items.forEach((x, i) => {
      const y = f.sy(items.length - 1 - i) - bh / 2;
      f.plot.appendChild(svgEl('rect', {
        x: f.m.l, y, width: Math.max(1, f.sx(x.v) - f.m.l), height: bh, rx: 2.5,
        fill: `var(--${GROUP_COLOUR[x.g] || 'c10'})`, opacity: x.isFixed ? 0.55 : 0.9,
      }));
      f.g.appendChild(svgEl('text', { x: f.m.l - 8, y: y + bh / 2 + 3.5, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt' },
        x.isFixed ? T('Costos fijos del año', 'Annual fixed costs') : T(Budget.GROUPS[x.g].es, Budget.GROUPS[x.g].en)));
      f.g.appendChild(svgEl('text', { x: f.sx(x.v) + 6, y: y + bh / 2 + 3.5, 'font-size': 9.5, class: 'art-mut' },
        fmtMoney(x.v, 0) + '  ' + fmtPct(x.v / total, 0)));
    });
  }

  window.Plots4 = { drawStructure, drawSchedule, drawCosts, drawGroups };
})();
