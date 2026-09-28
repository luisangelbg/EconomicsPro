/* EconomicsPro — the figures of Block 5.

   The income statement seen whole, the two cash flows with the cash balance
   that says when the project runs dry, the classic break-even lines, and the
   debt service against the money there is to pay it with. */

(function () {

  const { frame, pathOf, legend } = Plot;

  /* ================================================================
     1 · the income statement
     ================================================================ */
  function drawIncome(svg, m) {
    if (!svg || !m.rows.length) { if (svg) Plot.clear(svg); return; }
    const rows = m.rows;
    const hi = Math.max(...rows.map(r => Math.max(r.revenue, r.cost + r.depreciation + r.interest + r.tax + r.ptu))) || 1;
    const lo = Math.min(0, ...rows.map(r => r.net));
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 70, r: 16, t: 26, b: 42 },
      x: [rows[0].t - 0.7, rows[rows.length - 1].t + 0.7], y: [lo * 1.1, hi * 1.14],
      xlab: T('año del proyecto', 'project year'), ylab: T('pesos', 'pesos'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = Math.max(3, (f.W - f.m.l - f.m.r) / rows.length * 0.28);
    rows.forEach(r => {
      /* the revenue of the year */
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(r.t) - w - 1, y: f.sy(r.revenue), width: w, height: Math.max(0.6, f.sy(0) - f.sy(r.revenue)),
        rx: 1.5, fill: 'var(--cash-in)', opacity: 0.85,
      }));
      /* what it is spent on, stacked */
      let acc = 0;
      [[r.cost, 'var(--c3)'], [r.depreciation, 'var(--text-muted)'], [r.interest, 'var(--c6)'], [r.tax + r.ptu, 'var(--c4)']].forEach(([v, colour]) => {
        if (v <= 0) return;
        const y0 = f.sy(acc), y1 = f.sy(acc + v);
        f.plot.appendChild(svgEl('rect', { x: f.sx(r.t) + 1, y: y1, width: w, height: Math.max(0.6, y0 - y1), rx: 1.5, fill: colour, opacity: 0.85 }));
        acc += v;
      });
    });
    /* the net profit */
    f.plot.appendChild(svgEl('path', { d: pathOf(rows.map(r => [f.sx(r.t), f.sy(r.net)])), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none' }));
    rows.forEach(r => f.plot.appendChild(svgEl('circle', { cx: f.sx(r.t), cy: f.sy(r.net), r: 2.6, fill: 'var(--primary)' })));
    legend(f, [
      [T('ingresos', 'revenue'), 'var(--cash-in)', 'sq'],
      [T('costos', 'costs'), 'var(--c3)', 'sq'],
      [T('depreciación', 'depreciation'), 'var(--text-muted)', 'sq'],
      [T('intereses', 'interest'), 'var(--c6)', 'sq'],
      [T('impuestos', 'taxes'), 'var(--c4)', 'sq'],
      [T('utilidad neta', 'net profit'), 'var(--primary)', 'ln'],
    ], 12);
  }

  /* ================================================================
     2 · the two cash flows and the cash balance
     ================================================================ */
  function drawFlows(svg, m) {
    if (!svg || !m.projectFlow.length) { if (svg) Plot.clear(svg); return; }
    const n = m.projectFlow.length;
    const cash = m.balance.map(b => b.cash);
    const all = m.projectFlow.concat(m.investorFlow, cash);
    const lo = Math.min(0, ...all), hi = Math.max(0, ...all);
    const pad = (hi - lo) * 0.1 || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 70, r: 16, t: 26, b: 42 },
      x: [-0.7, n - 0.3], y: [lo - pad, hi + pad],
      xlab: T('año del proyecto', 'project year'), ylab: T('pesos', 'pesos'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: Array.from({ length: n }, (_, i) => i).filter(i => n <= 16 || i % 2 === 0),
    });
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(0), y2: f.sy(0), stroke: 'var(--border-strong)', 'stroke-width': 1.2 }));
    const w = Math.max(3, (f.W - f.m.l - f.m.r) / n * 0.3);
    m.projectFlow.forEach((v, t) => {
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(t) - w - 1, y: f.sy(Math.max(0, v)), width: w, height: Math.max(0.6, Math.abs(f.sy(v) - f.sy(0))),
        rx: 1.5, fill: v >= 0 ? 'var(--cash-in)' : 'var(--cash-out)', opacity: 0.85,
      }));
    });
    m.investorFlow.forEach((v, t) => {
      f.plot.appendChild(svgEl('rect', {
        x: f.sx(t) + 1, y: f.sy(Math.max(0, v)), width: w, height: Math.max(0.6, Math.abs(f.sy(v) - f.sy(0))),
        rx: 1.5, fill: v >= 0 ? 'var(--leaf)' : 'var(--c6)', opacity: 0.8,
      }));
    });
    /* the cash balance: where it dips below zero, the project is short of money */
    f.plot.appendChild(svgEl('path', { d: pathOf(cash.map((v, t) => [f.sx(t), f.sy(v)])), stroke: 'var(--primary)', 'stroke-width': 2.4, fill: 'none', 'stroke-dasharray': '5 3' }));
    cash.forEach((v, t) => f.plot.appendChild(svgEl('circle', {
      cx: f.sx(t), cy: f.sy(v), r: v < 0 ? 4 : 2.6, fill: v < 0 ? 'var(--danger)' : 'var(--primary)',
    })));
    legend(f, [
      [T('flujo del proyecto', 'project flow'), 'var(--cash-in)', 'sq'],
      [T('flujo del inversionista', 'investor flow'), 'var(--leaf)', 'sq'],
      [T('saldo de caja', 'cash balance'), 'var(--primary)', 'ln'],
    ], 12);
  }

  /* ================================================================
     3 · the break-even of one year
     ================================================================ */
  function drawBreakeven(svg, m, index) {
    if (!svg || !m.breakeven.length) { if (svg) Plot.clear(svg); return; }
    const be = m.breakeven[Math.max(0, Math.min(index == null ? 0 : index, m.breakeven.length - 1))];
    const maxQ = Math.max(be.volume || 0, be.units || 0) * 1.25 || 1;
    const maxV = Math.max(be.price * maxQ, be.fixedCost + be.margin * 0 + (be.fixedCost + (be.price - be.margin) * maxQ)) || 1;
    const f = frame(svg, {
      W: 700, H: 300, m: { l: 74, r: 16, t: 26, b: 44 },
      x: [0, maxQ], y: [0, maxV * 1.05],
      xlab: T('volumen vendido', 'volume sold'), ylab: T('pesos', 'pesos'),
      ylabFmt: v => fmtMoney(v, 0),
    });
    const variableUnit = be.price - be.margin;
    const totalCost = q => be.fixedCost + variableUnit * q;
    /* revenue and cost lines */
    f.plot.appendChild(svgEl('path', { d: pathOf([[f.sx(0), f.sy(0)], [f.sx(maxQ), f.sy(be.price * maxQ)]]), stroke: 'var(--cash-in)', 'stroke-width': 2.4, fill: 'none' }));
    f.plot.appendChild(svgEl('path', { d: pathOf([[f.sx(0), f.sy(totalCost(0))], [f.sx(maxQ), f.sy(totalCost(maxQ))]]), stroke: 'var(--cash-out)', 'stroke-width': 2.4, fill: 'none' }));
    f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.W - f.m.r, y1: f.sy(be.fixedCost), y2: f.sy(be.fixedCost), stroke: 'var(--text-muted)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }));
    /* the point where they cross */
    if (be.units != null && be.units <= maxQ) {
      const x = f.sx(be.units), y = f.sy(be.price * be.units);
      f.plot.appendChild(svgEl('circle', { cx: x, cy: y, r: 5, fill: 'var(--accent)' }));
      f.plot.appendChild(svgEl('line', { x1: x, x2: x, y1: y, y2: f.sy(0), stroke: 'var(--accent)', 'stroke-width': 1.3, 'stroke-dasharray': '3 3' }));
      f.g.appendChild(svgEl('text', { x: x + 7, y: y - 8, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' },
        T('equilibrio ', 'break-even ') + fmtNum(be.units, 1)));
    }
    /* what the project actually sells that year */
    if (be.volume > 0 && be.volume <= maxQ) {
      f.plot.appendChild(svgEl('line', { x1: f.sx(be.volume), x2: f.sx(be.volume), y1: f.m.t, y2: f.sy(0), stroke: 'var(--primary)', 'stroke-width': 1.8, 'stroke-dasharray': '5 3' }));
      f.g.appendChild(svgEl('text', { x: f.sx(be.volume) - 6, y: f.m.t + 12, 'font-size': 10, 'text-anchor': 'end', class: 'art-txt', 'font-weight': 700, fill: 'var(--primary)' },
        T('lo que vende', 'what it sells')));
    }
    legend(f, [
      [T('ingreso total', 'total revenue'), 'var(--cash-in)', 'ln'],
      [T('costo total', 'total cost'), 'var(--cash-out)', 'ln'],
      [T('costos fijos', 'fixed costs'), 'var(--text-muted)', 'ln'],
    ], 12);
  }

  /* ================================================================
     4 · the debt service against what there is to pay it with
     ================================================================ */
  function drawDebt(svg, m) {
    if (!svg) return;
    const rows = m.ratios.filter(r => r.service > 0);
    if (!rows.length) { Plot.clear(svg); return; }
    const avail = rows.map(r => {
      const row = m.rows[r.t - 1];
      return row.net + row.depreciation + row.interest;
    });
    const hi = Math.max(...rows.map(r => r.service), ...avail) * 1.15 || 1;
    const f = frame(svg, {
      W: 700, H: 280, m: { l: 70, r: 50, t: 26, b: 42 },
      x: [rows[0].t - 0.7, rows[rows.length - 1].t + 0.7], y: [0, hi],
      xlab: T('año del proyecto', 'project year'), ylab: T('pesos', 'pesos'),
      xlabFmt: v => String(Math.round(v)), ylabFmt: v => fmtMoney(v, 0),
      xt: rows.map(r => r.t).filter(t => rows.length <= 16 || t % 2 === 0),
    });
    const w = Math.max(4, (f.W - f.m.l - f.m.r) / rows.length * 0.5);
    rows.forEach((r, i) => {
      const row = m.rows[r.t - 1];
      const interest = row.interest, principal = r.service - interest;
      let acc = 0;
      [[interest, 'var(--c6)'], [principal, 'var(--c1)']].forEach(([v, colour]) => {
        if (v <= 0) return;
        f.plot.appendChild(svgEl('rect', { x: f.sx(r.t) - w / 2, y: f.sy(acc + v), width: w, height: Math.max(0.6, f.sy(acc) - f.sy(acc + v)), rx: 1.5, fill: colour, opacity: 0.9 }));
        acc += v;
      });
      /* the money available to pay it */
      f.plot.appendChild(svgEl('circle', { cx: f.sx(r.t), cy: f.sy(avail[i]), r: 3.4, fill: avail[i] >= r.service * 1.2 ? 'var(--cash-in)' : 'var(--danger)' }));
    });
    f.plot.appendChild(svgEl('path', { d: pathOf(rows.map((r, i) => [f.sx(r.t), f.sy(avail[i])])), stroke: 'var(--cash-in)', 'stroke-width': 2.2, fill: 'none' }));
    legend(f, [
      [T('intereses', 'interest'), 'var(--c6)', 'sq'],
      [T('capital', 'principal'), 'var(--c1)', 'sq'],
      [T('flujo disponible para pagar', 'cash available to pay'), 'var(--cash-in)', 'ln'],
    ], 12);
  }

  window.Plots5 = { drawIncome, drawFlows, drawBreakeven, drawDebt };
})();
