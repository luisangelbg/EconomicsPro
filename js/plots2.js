/* EconomicsPro — the figures of Block 2.

   Three pictures, and each one exists to make a decision visible:
   the timeline shows what the horizon really covers, the composition of the
   rate shows where the discount rate came from, and the discount curve shows
   how much of the future that rate is throwing away. */

(function () {

  const { frame, pathOf, legend } = Plot;

  /* ================================================================
     1 · the timeline of the project
     ================================================================ */
  function drawTimeline(svg, p) {
    if (!svg) return;
    const n = Math.max(1, Math.round(Number(p.horizon) || 1));
    const g = Math.max(0, Math.round(Number(p.gestation) || 0));
    const ramp = Math.max(1, Math.round(Number(p.ramp) || 1));
    const f = frame(svg, {
      W: 700, H: 200, m: { l: 20, r: 18, t: 46, b: 40 },
      x: [-0.6, n + 0.6], y: [0, 1], yt: [],
      xlab: T('año del proyecto', 'project year'),
      xt: Array.from({ length: n + 1 }, (_, i) => i).filter(i => n <= 16 || i % (n > 30 ? 5 : 2) === 0),
      xlabFmt: v => String(Math.round(v)),
    });
    const band = (from, to, colour, opacity) => {
      const x0 = f.sx(from - 0.5), x1 = f.sx(to + 0.5);
      f.plot.appendChild(svgEl('rect', { x: x0, y: f.sy(0.78), width: Math.max(0, x1 - x0), height: f.sy(0.22) - f.sy(0.78), rx: 4, fill: colour, opacity: opacity == null ? 0.85 : opacity }));
    };
    const label = (at, text, colour, dy) => {
      f.g.appendChild(svgEl('text', { x: f.sx(at), y: f.sy(0.5) + (dy || 4), 'font-size': 10, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600, fill: colour }, text));
    };
    /* the investment */
    band(0, 0, 'var(--cash-out)');
    /* the years the plantation or the plant takes to produce */
    if (g >= 1) band(1, Math.min(g, n), 'var(--accent)', 0.55);
    /* the ramp up to full yield */
    const rampEnd = Math.min(n, g + ramp);
    if (rampEnd > g) band(g + 1, rampEnd, 'var(--leaf)', 0.55);
    /* full production */
    if (n > rampEnd) band(rampEnd + 1, n, 'var(--cash-in)', 0.85);

    /* the phase names, only when the band is wide enough to hold them */
    const wide = (from, to) => f.sx(to + 0.5) - f.sx(from - 0.5) > 70;
    if (wide(0, 0)) label(0, T('inversión', 'investment'), 'var(--card-bg)');
    if (g >= 1 && wide(1, Math.min(g, n))) label((1 + Math.min(g, n)) / 2, T('sin producir', 'not yet bearing'), 'var(--text)');
    if (rampEnd > g && wide(g + 1, rampEnd)) label((g + 1 + rampEnd) / 2, T('maduración', 'ramp up'), 'var(--text)');
    if (n > rampEnd && wide(rampEnd + 1, n)) label((rampEnd + 1 + n) / 2, T('producción plena', 'full production'), 'var(--card-bg)');

    /* the residual value at the end */
    const xEnd = f.sx(n);
    f.g.appendChild(svgEl('path', {
      d: `M${xEnd} ${f.sy(0.86)} l -5 -9 h 10 z`, fill: 'var(--coin)',
    }));
    f.g.appendChild(svgEl('text', { x: xEnd, y: f.sy(0.86) - 13, 'font-size': 9.5, 'text-anchor': 'end', class: 'art-txt', fill: 'var(--accent)', 'font-weight': 700 },
      T('valor residual ' + fmtPct(Number(p.salvage) || 0, 0), 'residual value ' + fmtPct(Number(p.salvage) || 0, 0))));
    /* the calendar years, so the reader can see which harvest is which */
    const base = Math.round(Number(p.baseYear) || new Date().getFullYear());
    f.g.appendChild(svgEl('text', { x: f.sx(0), y: f.H - 6, 'font-size': 9, 'text-anchor': 'start', class: 'art-mut' }, String(base)));
    f.g.appendChild(svgEl('text', { x: f.sx(n), y: f.H - 6, 'font-size': 9, 'text-anchor': 'end', class: 'art-mut' }, String(base + n)));
    legend(f, [
      [T('inversión', 'investment'), 'var(--cash-out)', 'sq'],
      [T('gestación', 'gestation'), 'var(--accent)', 'sq'],
      [T('maduración', 'ramp up'), 'var(--leaf)', 'sq'],
      [T('producción plena', 'full production'), 'var(--cash-in)', 'sq'],
    ], 14);
  }

  /* ================================================================
     2 · where the discount rate comes from
     ================================================================ */
  function drawRateChart(svg, R) {
    if (!svg) return;
    const parts = (R.parts || []).filter(p => Math.abs(p.value) > 1e-9);
    const total = parts.reduce((a, b) => a + b.value, 0);
    const top = Math.max(0.04, total * 1.35, (R.nominal || 0) * 1.35);
    const f = frame(svg, {
      W: 700, H: 220, m: { l: 20, r: 18, t: 40, b: 42 },
      x: [0, top], y: [0, 1], yt: [],
      xlab: T('tasa anual', 'annual rate'), xlabFmt: v => (v * 100).toFixed(0) + '%',
    });
    let acc = 0;
    parts.forEach(p => {
      const x0 = f.sx(Math.min(acc, acc + p.value)), x1 = f.sx(Math.max(acc, acc + p.value));
      f.plot.appendChild(svgEl('rect', { x: x0, y: f.sy(0.86), width: Math.max(1, x1 - x0), height: f.sy(0.4) - f.sy(0.86), rx: 3, fill: `var(--${p.colour})`, opacity: 0.9 }));
      if (x1 - x0 > 52) {
        f.g.appendChild(svgEl('text', { x: (x0 + x1) / 2, y: f.sy(0.63) + 4, 'font-size': 10, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 700, fill: 'var(--card-bg)' }, fmtPct(p.value, 1)));
      }
      acc += p.value;
    });
    /* the two rates and the one the appraisal will use */
    const mark = (value, colour, text, dy) => {
      if (value == null || !isFinite(value) || value < 0 || value > top) return;
      f.plot.appendChild(svgEl('line', { x1: f.sx(value), x2: f.sx(value), y1: f.m.t, y2: f.H - f.m.b, stroke: colour, 'stroke-width': 1.8, 'stroke-dasharray': '4 3' }));
      /* a negative dy hangs the label from the axis instead of the top, so the two
         rates never write over the bar */
      const y = dy < 0 ? f.H - f.m.b + dy : f.m.t + (dy || 12);
      f.g.appendChild(svgEl('text', { x: f.sx(value) + 5, y, 'font-size': 10.5, class: 'art-txt', 'font-weight': 700, fill: colour, stroke: 'var(--card-bg)', 'stroke-width': 3, 'paint-order': 'stroke' }, text));
    };
    /* the rate the appraisal uses is named by the arrow below, so it is not
       labelled twice: only the other one gets its tag at the top */
    const usada = v => R.used != null && v != null && Math.abs(v - R.used) < 5e-4;
    if (!usada(R.nominal)) mark(R.nominal, 'var(--primary)', T('nominal ', 'nominal ') + fmtPct(R.nominal, 2), 12);
    if (!usada(R.real)) mark(R.real, 'var(--leaf)', T('real ', 'real ') + fmtPct(R.real, 2), 28);
    /* the arrow that says which one enters the calculation */
    if (R.used != null && isFinite(R.used) && R.used >= 0 && R.used <= top) {
      const x = f.sx(R.used);
      f.plot.appendChild(svgEl('line', { x1: x, x2: x, y1: f.m.t, y2: f.H - f.m.b, stroke: 'var(--accent)', 'stroke-width': 1.8, 'stroke-dasharray': '4 3' }));
      f.g.appendChild(svgEl('path', { d: `M${x} ${f.sy(0.3)} l -6 12 h 12 z`, fill: 'var(--accent)' }));
      f.g.appendChild(svgEl('text', { x, y: f.sy(0.3) + 26, 'font-size': 10, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' },
        T('la que se usa: ', 'the one used: ') + fmtPct(R.used, 2)));
    }
    legend(f, parts.map(p => [T(p.es, p.en), `var(--${p.colour})`, 'sq']), 14);
  }

  /* ================================================================
     3 · what the rate does to the future
     ================================================================ */
  function drawDiscountChart(svg, R, p) {
    if (!svg) return;
    const n = Math.max(1, Math.round(Number(p.horizon) || 1));
    const i = R.used == null || !isFinite(R.used) ? 0 : R.used;
    const f = frame(svg, {
      W: 700, H: 240, m: { l: 52, r: 18, t: 30, b: 42 },
      x: [0, n], y: [0, 1],
      xlab: T('año', 'year'), ylab: T('valor hoy de $1', 'value today of $1'),
      xlabFmt: v => String(Math.round(v)),
      ylabFmt: v => v.toFixed(2),
    });
    const curve = rate => Array.from({ length: n + 1 }, (_, t) => [f.sx(t), f.sy(Math.pow(1 + rate, -t))]);
    /* two neighbouring rates, to see how much the choice matters */
    [[Math.max(0, i - 0.05), 'var(--text-muted)'], [i + 0.05, 'var(--text-muted)']].forEach(([r, c]) => {
      f.plot.appendChild(svgEl('path', { d: pathOf(curve(r)), stroke: c, 'stroke-width': 1.2, fill: 'none', opacity: 0.45, 'stroke-dasharray': '4 3' }));
    });
    f.plot.appendChild(svgEl('path', { d: pathOf(curve(i)), stroke: 'var(--primary)', 'stroke-width': 2.6, fill: 'none' }));
    /* the last year: what a peso of the final harvest is worth today */
    const last = Math.pow(1 + i, -n);
    f.plot.appendChild(svgEl('circle', { cx: f.sx(n), cy: f.sy(last), r: 4.6, fill: 'var(--accent)' }));
    f.g.appendChild(svgEl('text', { x: f.sx(n) - 6, y: f.sy(last) - 8, 'font-size': 10.5, 'text-anchor': 'end', class: 'art-txt', 'font-weight': 700, fill: 'var(--accent)' },
      fmtMoney(last, 2)));
    /* the year in which a peso is worth half of a peso today */
    if (i > 0) {
      const half = Math.log(2) / Math.log(1 + i);
      if (half <= n) {
        f.plot.appendChild(svgEl('line', { x1: f.sx(half), x2: f.sx(half), y1: f.sy(0.5), y2: f.sy(0), stroke: 'var(--leaf)', 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }));
        f.plot.appendChild(svgEl('line', { x1: f.m.l, x2: f.sx(half), y1: f.sy(0.5), y2: f.sy(0.5), stroke: 'var(--leaf)', 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }));
        f.g.appendChild(svgEl('text', { x: f.sx(half) + 6, y: f.sy(0.5) - 6, 'font-size': 10, class: 'art-txt', 'font-weight': 600, fill: 'var(--leaf)' },
          T(`a los ${fmtFixed(half, 1)} años vale la mitad`, `after ${fmtFixed(half, 1)} years it is worth half`)));
      }
    }
    legend(f, [
      [T(`tasa usada ${fmtPct(i, 2)}`, `rate used ${fmtPct(i, 2)}`), 'var(--primary)', 'ln'],
      [T('±5 puntos', '±5 points'), 'var(--text-muted)', 'ln'],
    ], 12);
  }

  window.Plots2 = { drawTimeline, drawRateChart, drawDiscountChart };
})();
