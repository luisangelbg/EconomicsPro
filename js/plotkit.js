/* EconomicsPro — the small plotting kit shared by every block.

   It draws real SVG nodes (not a string), so a figure can be redrawn when the
   language or the theme changes, exported at high resolution by the figure
   studio of Block 10, and inspected element by element in the browser. Colours
   always come from the CSS variables, never hard-coded, so light and dark
   themes follow by themselves. */

(function () {

  /* Ticks a human would choose: 1, 2 or 5 times a power of ten. */
  let clipSerial = 0;                 /* ids of the plot clips never repeat */
  function niceTicks(lo, hi, n) {
    if (!(hi > lo)) hi = lo + 1;
    const raw = (hi - lo) / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw))), e = raw / mag;
    const step = mag * (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1);
    const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toFixed(10));
    return out;
  }
  /* Money on an axis is written short: 1.2M, 340k, 85. */
  function tickLabel(v) {
    const a = Math.abs(v);
    let s;
    if (a >= 1e6) s = (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
    else if (a >= 1e3) s = (v / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k';
    else s = a >= 100 ? v.toFixed(0) : a >= 10 ? (+v.toFixed(1)).toString() : (+v.toFixed(2)).toString();
    return s.startsWith('-') ? '−' + s.slice(1) : s;
  }
  const pctTick = v => (v * 100).toFixed(Math.abs(v) < 0.1 ? 1 : 0) + '%';
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  /* Axes, grid, labels and a clipped group to draw inside. */
  function frame(svg, o) {
    const W = o.W, H = o.H, m = o.m;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    clear(svg);
    const [x0, x1] = o.x, [y0, y1] = o.y;
    /* what the figure editor needs to find its way: the plot area and the range of each axis */
    svg.setAttribute('data-plot', `${m.l} ${m.t} ${W - m.l - m.r} ${H - m.t - m.b}`);
    svg.setAttribute('data-xr', `${x0} ${x1}`); svg.setAttribute('data-yr', `${y0} ${y1}`);
    if (o.y2) svg.setAttribute('data-y2r', `${o.y2[0]} ${o.y2[1]}`); else svg.removeAttribute('data-y2r');
    const sx = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
    const sy = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    const g = svgEl('g');
    svg.appendChild(g);
    (o.yt || niceTicks(y0, y1, o.ny || 5)).forEach(t => {
      if (t < y0 - 1e-9 || t > y1 + 1e-9) return;
      g.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t), class: 'art-ax art-grid', 'stroke-width': 0.6, opacity: 0.55 }));
      g.appendChild(svgEl('text', { x: m.l - 5, y: sy(t) + 3, 'font-size': 9, 'text-anchor': 'end', class: 'art-mut', 'data-role': 'ytick' }, (o.ylabFmt || tickLabel)(t)));
    });
    (o.xt || niceTicks(x0, x1, o.nx || 5)).forEach(t => {
      if (t < x0 - 1e-9 || t > x1 + 1e-9) return;
      g.appendChild(svgEl('line', { x1: sx(t), x2: sx(t), y1: H - m.b, y2: H - m.b + 4, class: 'art-ax', 'stroke-width': 1 }));
      g.appendChild(svgEl('text', { x: sx(t), y: H - m.b + 14, 'font-size': 9, 'text-anchor': 'middle', class: 'art-mut', 'data-role': 'xtick' }, (o.xlabFmt || tickLabel)(t)));
    });
    g.appendChild(svgEl('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: 'art-ax', 'stroke-width': 1.2 }));
    g.appendChild(svgEl('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, class: 'art-ax', 'stroke-width': 1.2 }));
    if (o.xlab) g.appendChild(svgEl('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600, 'data-role': 'xlab' }, o.xlab));
    if (o.ylab) g.appendChild(svgEl('text', { x: 13, y: (m.t + H - m.b) / 2, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': 600, 'data-role': 'ylab', transform: `rotate(-90 13 ${(m.t + H - m.b) / 2})` }, o.ylab));
    /* the clip keeps a line from spilling over the axes */
    const id = 'clip' + (++clipSerial) + Math.random().toString(36).slice(2, 6);
    const defs = svgEl('defs'), cp = svgEl('clipPath', { id });
    cp.appendChild(svgEl('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }));
    defs.appendChild(cp); svg.appendChild(defs);
    const plot = svgEl('g', { 'clip-path': `url(#${id})` });
    svg.appendChild(plot);
    return { sx, sy, g, plot, W, H, m };
  }
  const pathOf = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  /* A legend along the top of a figure: ['label', colour, 'sq' | 'ln']. */
  function legend(f, items, y) {
    const g = svgEl('g', { 'data-role': 'legend' });
    const yy = y == null ? 8 : y;
    let x = f.m.l + 2;
    /* each entry is a mark and its label, tagged with the same index so the figure editor can pair them */
    items.forEach(([label, colour, kind], k) => {
      if (kind === 'ln') g.appendChild(svgEl('line', { x1: x, x2: x + 12, y1: yy, y2: yy, stroke: colour, 'stroke-width': 2.2, 'stroke-dasharray': '4 3', 'data-li': k }));
      else g.appendChild(svgEl('rect', { x, y: yy - 4, width: 10, height: 9, rx: 2, fill: colour, opacity: 0.9, 'data-li': k }));
      g.appendChild(svgEl('text', { x: x + 16, y: yy + 4, 'font-size': 9.5, class: 'art-mut', 'data-li': k }, label));
      x += 26 + label.length * 5.4;
    });
    f.g.appendChild(g);
  }

  /* A slider and the box that shows what it currently means. */
  function bindSlider(id, fmt, onInput) {
    const s = el(id), v = el(id + 'Val');
    if (!s) return;
    const show = () => { if (v) v.innerHTML = fmt(+s.value); };
    s.addEventListener('input', () => { show(); onInput(); });
    show();
  }
  const val = id => +el(id).value;
  function setSlider(id, x) { const s = el(id); if (s) s.value = x; }

  window.Plot = { niceTicks, tickLabel, pctTick, clear, frame, pathOf, legend, bindSlider, val, setSlider };
})();
