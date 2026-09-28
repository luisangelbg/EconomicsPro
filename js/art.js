/* EconomicsPro — hand-drawn SVG illustrations.
   Every picture is generated here with CSS-variable colours, so the whole app
   follows the light/dark theme and nothing depends on external images.
   Each function returns an SVG string. */

(function () {

  const f1 = v => (+v).toFixed(1);
  const V = n => `var(--${n})`;
  /* the same picture may be drawn more than once on the page (gallery, theory
     cards): every id inside it gets a suffix of its own so ids stay unique and
     each url(#…) points to the marker or gradient of its own picture */
  let artSerial = 0;
  function uniqueIds(inner) {
    const ids = [];
    inner.replace(/\sid="([^"]+)"/g, (m, id) => { ids.push(id); return m; });
    if (!ids.length) return inner;
    const k = '-' + (++artSerial);
    ids.forEach(id => {
      const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      inner = inner.replace(new RegExp('(\\sid="|url\\(#|href="#)' + e + '(["\\)])', 'g'), '$1' + id + k + '$2');
    });
    return inner;
  }
  function wrap(vb, inner, extra) { return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${extra || ''}>${uniqueIds(inner)}</svg>`; }
  function txt(x, y, s, fill, size, anchor, extra) {
    return `<text x="${f1(x)}" y="${f1(y)}" fill="${fill || V('text-muted')}" font-size="${size || 8}" text-anchor="${anchor || 'start'}" class="art-font" ${extra || ''}>${s}</text>`;
  }
  const line = (x1, y1, x2, y2, stroke, w, extra) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${w || 1}" ${extra || ''}/>`;
  const circ = (cx, cy, r, fill, extra) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}" ${extra || ''}/>`;
  const rect = (x, y, w, h, fill, extra) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}" fill="${fill}" ${extra || ''}/>`;
  const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join(' ');
  const path = (d, stroke, w, extra) => `<path d="${d}" stroke="${stroke}" stroke-width="${w || 1.4}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;
  const fillPath = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${extra || ''}/>`;

  /* a pair of axes with the zero line marked */
  function axes(x0, y0, x1, y1, zero) {
    let s = line(x0, y1, x1, y1, V('border-strong'), 1);
    s += line(x0, y0, x0, y1, V('border-strong'), 1);
    if (zero != null) s += line(x0, zero, x1, zero, V('border-strong'), 0.8, 'stroke-dasharray="3 3"');
    return s;
  }

  /* a coin seen at an angle: the unit of everything in this app */
  function coin(cx, cy, r, tone) {
    const c = tone || 'coin';
    return `<ellipse cx="${f1(cx)}" cy="${f1(cy + r * 0.28)}" rx="${f1(r)}" ry="${f1(r * 0.72)}" fill="${V(c + '-dark')}"/>` +
      `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(r * 0.72)}" fill="${V(c)}"/>` +
      `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 0.62)}" ry="${f1(r * 0.44)}" fill="none" stroke="${V(c + '-dark')}" stroke-width="0.8" opacity="0.7"/>`;
  }
  /* a stack of coins of a given height */
  function coinStack(cx, yBase, r, n, tone) {
    let s = '';
    for (let i = 0; i < n; i++) s += coin(cx, yBase - i * r * 0.62, r, tone);
    return s;
  }
  /* the profile of a field with furrows, the ground of most illustrations */
  function ground(x0, x1, y, rows) {
    let s = fillPath(`M${f1(x0)} ${f1(y)} L${f1(x1)} ${f1(y)} L${f1(x1)} ${f1(y + 16)} L${f1(x0)} ${f1(y + 16)}Z`, V('leaf'), 'opacity="0.16"');
    const k = rows || 6;
    for (let i = 0; i <= k; i++) {
      const t = i / k;
      s += line(x0 + t * (x1 - x0), y, x0 + (t - 0.08) * (x1 - x0), y + 16, V('leaf'), 0.7, 'opacity="0.45"');
    }
    return s;
  }
  /* a young tree of an orchard */
  function tree(cx, yBase, h, tone) {
    const c = tone || 'leaf';
    return path(`M${f1(cx)} ${f1(yBase)} L${f1(cx)} ${f1(yBase - h * 0.45)}`, V('c9'), h * 0.09) +
      `<ellipse cx="${f1(cx)}" cy="${f1(yBase - h * 0.68)}" rx="${f1(h * 0.34)}" ry="${f1(h * 0.33)}" fill="${V(c)}" opacity="0.85"/>` +
      circ(cx - h * 0.14, yBase - h * 0.74, h * 0.07, V('accent')) + circ(cx + h * 0.16, yBase - h * 0.62, h * 0.06, V('accent'));
  }

  /* the series of net flows that every figure of the app draws: three years of
     investment and then the annual benefit of a plantation coming into bearing */
  const DEMO = [-100, -42, -18, 22, 46, 62, 70, 74, 76, 78];

  /* bars of a cash flow, negative down and positive up */
  function flowBars(x0, y0, x1, y1, flows, opt) {
    const o = opt || {};
    const n = flows.length;
    const max = Math.max(...flows.map(Math.abs));
    const w = (x1 - x0) / n;
    const zero = y0 + (y1 - y0) * 0.62;
    let s = axes(x0 - 2, y0, x1, y1, zero);
    flows.forEach((f, i) => {
      const h = Math.abs(f) / max * (f > 0 ? (zero - y0) * 0.92 : (y1 - zero) * 0.92);
      const x = x0 + i * w + w * 0.18;
      s += rect(x, f > 0 ? zero - h : zero, w * 0.64, h, f > 0 ? V('cash-in') : V('cash-out'), 'rx="1.2" opacity="0.92"');
    });
    if (o.cumulative) {
      let acc = 0;
      const pts = flows.map((f, i) => { acc += f; return [x0 + i * w + w * 0.5, zero - acc / max * (zero - y0) * 0.5]; });
      s += path(poly(pts), V('primary'), 1.8, 'stroke-dasharray="4 3"');
    }
    return s;
  }

  /* ============================================================
     HERO — a project seen whole: the field that produces, the flows it
     generates year by year, the discounting that brings them to today and the
     two numbers that decide, the NPV and the IRR.
     ============================================================ */
  function hero() {
    const W = 540, H = 450;
    let s = `<defs>
      <linearGradient id="epSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--primary)" stop-opacity="0.12"/><stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient>
      <marker id="epAh" markerWidth="8" markerHeight="8" refX="6.4" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 z" fill="var(--accent)"/></marker>
    </defs>`;
    s += rect(0, 0, W, H, 'url(#epSky)');

    /* --- the orchard at the top: the productive unit --- */
    s += ground(24, W - 24, 104, 9);
    for (let i = 0; i < 7; i++) s += tree(52 + i * 68, 108, 46 + (i % 3) * 5);
    s += `<g opacity="0.9">${coinStack(W - 58, 96, 11, 4)}</g>`;
    s += txt(26, 28, T('PROYECTO AGROINDUSTRIAL', 'AGRIFOOD PROJECT'), V('primary'), 11, 'start', 'letter-spacing="1.6" font-weight="700"');
    s += txt(26, 44, T('inversión · producción · mercado', 'investment · production · market'), V('text-muted'), 10);

    /* --- the flows, year by year --- */
    const x0 = 46, x1 = W - 40, yTop = 150, yBot = 300;
    s += flowBars(x0, yTop, x1, yBot, DEMO, {});
    const n = DEMO.length, w = (x1 - x0) / n;
    const zero = yTop + (yBot - yTop) * 0.62;
    for (let i = 0; i < n; i += 3) s += txt(x0 + i * w + w * 0.5, yBot + 12, String(i), V('text-muted'), 8.5, 'middle');
    s += txt(x0 - 6, yTop - 6, T('flujo neto', 'net cash flow'), V('text-muted'), 9);
    s += txt(x1, yBot + 12, T('año', 'year'), V('text-muted'), 9, 'end');
    s += txt(x0 + 6, zero - 4, '+', V('cash-in'), 12, 'start', 'font-weight="700"');
    s += txt(x0 + 6, zero + 14, '−', V('cash-out'), 13, 'start', 'font-weight="700"');

    /* --- the arrows that bring every flow back to today --- */
    for (let i = 3; i < n; i += 2) {
      const xs = x0 + i * w + w * 0.5;
      s += path(`M${f1(xs)} ${f1(zero - 62)} C ${f1(xs - 30)} ${f1(zero - 96)}, ${f1(x0 + 60)} ${f1(zero - 104)}, ${f1(x0 + 26)} ${f1(zero - 70)}`,
        V('accent'), 1.1, 'stroke-dasharray="3 3" opacity="0.75" marker-end="url(#epAh)"');
    }
    s += txt(x0 + 34, yTop + 4, '÷ (1 + i)ᵗ', V('accent'), 11, 'start', 'font-weight="700"');

    /* --- the NPV profile and the IRR --- */
    const gx0 = 46, gx1 = W - 40, gy0 = 332, gy1 = 420;
    const rates = [];
    for (let r = 0; r <= 0.36; r += 0.01) rates.push(r);
    const vals = rates.map(r => DEMO.reduce((a, f, t) => a + f / Math.pow(1 + r, t), 0));
    const vmax = Math.max(...vals), vmin = Math.min(...vals);
    const zeroY = gy1 - (0 - vmin) / (vmax - vmin) * (gy1 - gy0);
    s += axes(gx0, gy0 - 8, gx1, gy1, zeroY);
    const pts = vals.map((v, i) => [gx0 + i / (vals.length - 1) * (gx1 - gx0), gy1 - (v - vmin) / (vmax - vmin) * (gy1 - gy0)]);
    s += path(poly(pts), V('primary'), 2.4);
    /* the crossing: the internal rate of return */
    let ci = 0;
    for (let i = 1; i < vals.length; i++) if (vals[i - 1] > 0 && vals[i] <= 0) { ci = i; break; }
    if (ci) {
      const px = pts[ci][0];
      s += circ(px, zeroY, 4.6, V('accent'));
      s += line(px, zeroY, px, gy1 + 2, V('accent'), 1, 'stroke-dasharray="2 3"');
      s += txt(px + 8, zeroY - 8, T('TIR', 'IRR'), V('accent'), 10.5, 'start', 'font-weight="700"');
    }
    s += circ(pts[0][0], pts[0][1], 4, V('primary'));
    s += txt(pts[0][0] + 8, pts[0][1] - 6, T('VAN', 'NPV'), V('primary'), 10.5, 'start', 'font-weight="700"');
    s += txt(gx1, gy1 + 12, T('tasa de descuento', 'discount rate'), V('text-muted'), 9, 'end');
    return wrap(`0 0 ${W} ${H}`, s, 'role="img"');
  }

  /* ============================================================
     Block cards
     ============================================================ */
  const MW = 200, MH = 120;                      /* the canvas of the small figures */
  const mini = inner => wrap(`0 0 ${MW} ${MH}`, inner);

  /* 2 · the project and its assumptions: a horizon line with the rate on top */
  function projSetup() {
    let s = line(18, 84, 186, 84, V('border-strong'), 1.2);
    for (let i = 0; i <= 8; i++) {
      const x = 18 + i * 21;
      s += line(x, 80, x, 88, V('border-strong'), 1);
      if (i % 2 === 0) s += txt(x, 100, String(i), V('text-muted'), 8, 'middle');
    }
    s += rect(18, 60, 21, 18, V('cash-out'), 'rx="2" opacity="0.85"');
    for (let i = 1; i < 8; i++) s += rect(18 + i * 21 + 2, 66, 17, 12, V('cash-in'), 'rx="2" opacity="' + (0.35 + i * 0.08) + '"');
    s += txt(18, 30, T('i = TREMA', 'i = MARR'), V('primary'), 12, 'start', 'font-weight="700"');
    s += txt(18, 46, T('inflación · impuestos · horizonte', 'inflation · taxes · horizon'), V('text-muted'), 8.5);
    s += coin(170, 28, 12);
    return mini(s);
  }
  /* 3 · market: a price series with its trend and a band of uncertainty */
  function marketPrice() {
    const pts = [], lo = [], hi = [];
    const data = [40, 44, 39, 47, 52, 49, 58, 61, 57, 66];
    data.forEach((v, i) => {
      const x = 20 + i * 17.5, y = 96 - v * 0.9;
      pts.push([x, y]); lo.push([x, y + 7 + i * 0.6]); hi.push([x, y - 7 - i * 0.6]);
    });
    let s = axes(16, 14, 190, 96);
    s += fillPath(poly(hi) + ' ' + poly(lo.slice().reverse()).replace('M', 'L') + 'Z', V('primary'), 'opacity="0.12"');
    s += path(poly(pts), V('primary'), 2);
    s += path(poly([[20, 60], [177, 30]]), V('accent'), 1.6, 'stroke-dasharray="5 3"');
    pts.forEach(p => { s += circ(p[0], p[1], 2.2, V('primary')); });
    s += txt(20, 110, T('precio real · tendencia · proyección', 'real price · trend · forecast'), V('text-muted'), 8.5);
    return mini(s);
  }
  /* 4 · investment and costs: a stacked column of cost items */
  function investCost() {
    const items = [['c1', 34], ['c2', 26], ['c3', 20], ['c5', 12], ['c6', 8]];
    let y = 96, s = axes(16, 14, 190, 96);
    items.forEach(([c, v], i) => { const h = v * 1.6; y -= h; s += rect(28, y, 42, h - 1.5, V(c), 'rx="2" opacity="0.9"'); });
    const labels = T(['terreno y obra', 'maquinaria', 'plantación', 'diferidos', 'capital de trabajo'], ['land and works', 'machinery', 'planting', 'pre-operating', 'working capital']);
    labels.forEach((t, i) => {
      s += rect(86, 26 + i * 14, 8, 8, V(items[i][0]), 'rx="1.6"');
      s += txt(99, 33 + i * 14, t, V('text-muted'), 8);
    });
    return mini(s);
  }
  /* 5 · pro-forma statements: a ledger with its totals */
  function proforma() {
    let s = rect(20, 14, 160, 92, V('card-bg'), 'rx="4" stroke="' + V('border') + '"');
    s += rect(20, 14, 160, 16, V('primary'), 'rx="4" opacity="0.14"');
    for (let i = 0; i < 5; i++) s += line(20, 30 + i * 15, 180, 30 + i * 15, V('border'), 0.8);
    [0, 1, 2, 3].forEach(i => {
      s += rect(28, 36 + i * 15, 52 - i * 6, 5, V('text-muted'), 'rx="2" opacity="0.4"');
      s += rect(112, 36 + i * 15, 26, 5, V(i === 3 ? 'cash-in' : 'primary'), 'rx="2" opacity="0.7"');
      s += rect(146, 36 + i * 15, 26, 5, V(i === 3 ? 'cash-in' : 'accent'), 'rx="2" opacity="0.55"');
    });
    s += line(108, 92, 180, 92, V('primary'), 1.4);
    s += txt(28, 25, T('estado de resultados · flujo · balance', 'income · cash flow · balance sheet'), V('primary'), 7.6, 'start', 'font-weight="700"');
    return mini(s);
  }
  /* 6 · financial appraisal: the NPV profile crossing zero at the IRR */
  function npvProfile() {
    const rates = []; for (let r = 0; r <= 0.4; r += 0.02) rates.push(r);
    const vals = rates.map(r => DEMO.reduce((a, f, t) => a + f / Math.pow(1 + r, t), 0));
    const vmax = Math.max(...vals), vmin = Math.min(...vals);
    const y = v => 100 - (v - vmin) / (vmax - vmin) * 82;
    let s = axes(18, 14, 190, 104, y(0));
    const pts = vals.map((v, i) => [18 + i / (vals.length - 1) * 168, y(v)]);
    s += path(poly(pts), V('primary'), 2.4);
    let ci = 0; for (let i = 1; i < vals.length; i++) if (vals[i - 1] > 0 && vals[i] <= 0) { ci = i; break; }
    if (ci) { s += circ(pts[ci][0], y(0), 4.4, V('accent')); s += txt(pts[ci][0] + 6, y(0) - 7, T('TIR', 'IRR'), V('accent'), 9.5, 'start', 'font-weight="700"'); }
    s += circ(pts[0][0], pts[0][1], 3.6, V('primary'));
    s += txt(24, pts[0][1] - 6, T('VAN', 'NPV'), V('primary'), 9.5, 'start', 'font-weight="700"');
    return mini(s);
  }
  /* 7 · risk: the histogram of the simulated NPV with its loss tail */
  function riskFan() {
    const bars = [2, 5, 9, 14, 20, 25, 27, 24, 18, 12, 7, 4, 2];
    const max = Math.max(...bars);
    let s = axes(18, 14, 190, 100);
    bars.forEach((b, i) => {
      const x = 20 + i * 13, h = b / max * 80;
      s += rect(x, 100 - h, 11, h, V(i < 4 ? 'cash-out' : 'primary'), 'rx="1.4" opacity="' + (i < 4 ? 0.8 : 0.85) + '"');
    });
    s += line(72, 12, 72, 104, V('danger'), 1.2, 'stroke-dasharray="3 3"');
    /* the "less than" sign is written as an entity: inside SVG text a bare "<"
       opens a tag and swallows the rest of the label */
    s += txt(22, 24, T('P(VAN &lt; 0)', 'P(NPV &lt; 0)'), V('danger'), 9, 'start', 'font-weight="700"');
    s += txt(112, 116, T('VAN simulado', 'simulated NPV'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  /* 8 · social appraisal: the balance that weighs market prices against
     accounting prices, with people on one side */
  function socialScale() {
    let s = line(100, 24, 100, 96, V('border-strong'), 2);
    s += line(46, 34, 154, 34, V('primary'), 2.4);
    s += circ(100, 24, 5, V('primary'));
    /* the two pans are filled and outlined, so they are drawn with fillPath:
       path() already writes fill="none" and a second fill would be invalid */
    s += fillPath('M46 34 L34 58 L58 58 Z', V('accent-soft'), 'stroke="' + V('accent') + '" stroke-width="1.4"');
    s += fillPath('M154 34 L142 52 L166 52 Z', 'rgba(var(--leaf-rgb),0.18)', 'stroke="' + V('leaf') + '" stroke-width="1.4"');
    s += coin(46, 46, 7); s += coin(154, 42, 6, 'coin');
    [78, 92, 106, 122].forEach((x, i) => {
      s += circ(x, 82, 4.4, V(i % 2 ? 'leaf' : 'primary'), 'opacity="0.85"');
      s += fillPath(`M${x - 5} 96 q5 -9 10 0Z`, V(i % 2 ? 'leaf' : 'primary'), 'opacity="0.7"');
    });
    s += txt(100, 112, T('precios de mercado vs. precios cuenta', 'market vs. accounting prices'), V('text-muted'), 8, 'middle');
    return mini(s);
  }
  /* 9 · decisions: two projects and the fork between them */
  function decisionFork() {
    let s = circ(30, 60, 6, V('primary'));
    s += path('M36 60 C 70 60, 70 30, 104 30', V('primary'), 1.8);
    s += path('M36 60 C 70 60, 70 90, 104 90', V('accent'), 1.8);
    s += rect(106, 18, 70, 24, V('primary'), 'rx="4" opacity="0.16"');
    s += rect(106, 78, 70, 24, V('accent'), 'rx="4" opacity="0.16"');
    s += txt(141, 33, T('VAN 1', 'NPV 1'), V('primary'), 9.5, 'middle', 'font-weight="700"');
    s += txt(141, 93, T('VAN 2', 'NPV 2'), V('accent'), 9.5, 'middle', 'font-weight="700"');
    s += txt(70, 54, 'A', V('primary'), 9, 'middle'); s += txt(70, 78, 'B', V('accent'), 9, 'middle');
    s += coin(30, 96, 8);
    return mini(s);
  }
  /* 10 · report: the document with its figure and its table */
  function reportDoc() {
    let s = fillPath('M46 12 L134 12 L156 34 L156 108 L46 108 Z', V('card-bg'), 'stroke="' + V('border-strong') + '" stroke-width="1.2"');
    s += fillPath('M134 12 L156 34 L134 34 Z', V('primary'), 'opacity="0.25"');
    s += rect(58, 26, 52, 5, V('primary'), 'rx="2" opacity="0.6"');
    [0, 1, 2].forEach(i => { s += rect(58, 40 + i * 9, 86 - i * 12, 4, V('text-muted'), 'rx="2" opacity="0.35"'); });
    s += rect(58, 72, 86, 26, V('bg-soft'), 'rx="3"');
    [10, 16, 22, 14, 20].forEach((h, i) => s += rect(62 + i * 16, 96 - h, 11, h, V(i % 2 ? 'accent' : 'primary'), 'rx="1.2" opacity="0.8"'));
    return mini(s);
  }

  /* ============================================================
     The kinds of project the app was written for
     ============================================================ */
  function matAnnual() {
    let s = ground(14, 186, 84, 10);
    for (let i = 0; i < 9; i++) {
      const x = 22 + i * 20;
      s += path(`M${x} 88 L${x} ${62 - (i % 3) * 3}`, V('leaf'), 2);
      s += path(`M${x} ${70 - (i % 3) * 2} q -9 -8 -12 -18 M${x} ${74 - (i % 3) * 2} q 9 -8 12 -18`, V('leaf'), 1.6);
      s += `<ellipse cx="${x + 1}" cy="${54 - (i % 3) * 3}" rx="3.6" ry="7" fill="${V('accent')}" opacity="0.9"/>`;
    }
    return mini(s);
  }
  function matOrchard() {
    let s = ground(14, 186, 92, 8);
    [30, 70, 110, 150].forEach((x, i) => { s += tree(x, 96, 52 + (i % 2) * 8); });
    s += coin(176, 40, 9);
    return mini(s);
  }
  function matGreenhouse() {
    let s = ground(14, 186, 96, 8);
    s += fillPath('M34 96 L34 54 L100 26 L166 54 L166 96 Z', V('sky'), 'opacity="0.14" stroke="' + V('sky') + '" stroke-width="1.4"');
    s += line(100, 26, 100, 96, V('sky'), 1);
    [52, 76, 124, 148].forEach(x => s += line(x, 96, x, 40 + Math.abs(100 - x) * 0.2, V('sky'), 0.8, 'opacity="0.6"'));
    [50, 74, 126, 150].forEach(x => { s += path(`M${x} 94 L${x} 74`, V('leaf'), 1.8); s += circ(x, 72, 4, V('rose'), 'opacity="0.85"'); });
    return mini(s);
  }
  function matLivestock() {
    let s = ground(14, 186, 92, 9);
    const cow = (x, y, k) => fillPath(`M${x} ${y} q 4 -14 18 -14 h 22 q 14 0 18 14 v 10 h -6 v -8 h -8 v 8 h -6 v -8 h -16 v 8 h -6 v -8 h -8 v 8 h -8 Z`, V(k), 'opacity="0.9"') +
      fillPath(`M${x + 54} ${y - 12} q 12 -2 14 8 q 2 8 -8 8 q -8 0 -8 -8 Z`, V(k), 'opacity="0.9"');
    s += cow(34, 82, 'c9');
    s += cow(96, 88, 'primary');
    s += coin(176, 40, 9);
    return mini(s);
  }
  function matAgroindustry() {
    let s = ground(14, 186, 96, 8);
    s += rect(30, 52, 78, 44, V('primary'), 'opacity="0.16" rx="2"');
    s += path('M30 52 L46 38 L62 52 M62 52 L78 38 L94 52 M94 52 L108 40 L108 52', V('primary'), 1.6);
    s += rect(118, 34, 16, 62, V('c9'), 'opacity="0.55" rx="2"');
    s += path('M126 34 q -4 -12 4 -18 q 8 -6 4 -14', V('text-muted'), 1.6, 'opacity="0.55"');
    [42, 62, 82].forEach(x => s += rect(x, 76, 14, 20, V('accent'), 'rx="1.6" opacity="0.8"'));
    s += rect(146, 64, 34, 32, V('sky'), 'opacity="0.2" rx="3"');
    s += coin(163, 76, 8);
    return mini(s);
  }
  function matIrrigation() {
    let s = ground(14, 186, 92, 9);
    s += fillPath('M14 92 q 40 -18 86 0 q 46 18 86 0 v 16 h -172 Z', V('sky'), 'opacity="0.22"');
    s += path('M24 60 q 30 -34 62 0 q 32 34 64 0', V('sky'), 2);
    [40, 70, 100, 130].forEach((x, i) => { s += circ(x, 48 + (i % 2) * 8, 3.4, V('sky'), 'opacity="0.7"'); });
    s += rect(150, 34, 26, 26, V('c9'), 'opacity="0.5" rx="3"');
    s += circ(163, 47, 8, V('primary'), 'opacity="0.7"');
    return mini(s);
  }
  function matForestry() {
    let s = ground(14, 186, 96, 8);
    [34, 70, 110, 154].forEach((x, i) => {
      const h = 60 + (i % 3) * 12;
      s += path(`M${x} 96 L${x} ${96 - h * 0.5}`, V('c9'), 4);
      s += fillPath(`M${x} ${96 - h} L${x - 16} ${96 - h * 0.55} L${x + 16} ${96 - h * 0.55} Z`, V('leaf'), 'opacity="0.85"');
      s += fillPath(`M${x} ${96 - h * 0.82} L${x - 20} ${96 - h * 0.34} L${x + 20} ${96 - h * 0.34} Z`, V('leaf'), 'opacity="0.7"');
    });
    return mini(s);
  }
  function matSocial() {
    let s = ground(14, 186, 96, 8);
    const person = (x, c) => circ(x, 60, 7, V(c), 'opacity="0.9"') + fillPath(`M${x - 11} 96 q 11 -22 22 0 Z`, V(c), 'opacity="0.75"');
    s += person(46, 'primary') + person(74, 'leaf') + person(102, 'accent') + person(130, 'sky');
    s += path('M36 34 q 60 -18 124 0', V('primary'), 1.6, 'stroke-dasharray="4 3"');
    s += txt(98, 26, T('empleo · divisas · bienestar', 'jobs · foreign exchange · welfare'), V('text-muted'), 8, 'middle');
    return mini(s);
  }

  /* ============================================================
     Method gallery
     ============================================================ */
  function npvBars() {
    let s = flowBars(20, 16, 186, 96, DEMO, {});
    s += txt(24, 112, T('VAN = Σ Fₜ / (1+i)ᵗ', 'NPV = Σ Fₜ / (1+i)ᵗ'), V('primary'), 10, 'start', 'font-weight="700"');
    return mini(s);
  }
  function irrCross() { return npvProfile(); }
  function mirrArrow() {
    let s = axes(20, 16, 186, 92, 66);
    s += rect(24, 66, 16, 22, V('cash-out'), 'rx="1.6"');
    s += rect(46, 66, 16, 12, V('cash-out'), 'rx="1.6" opacity="0.8"');
    [0, 1, 2, 3].forEach(i => s += rect(88 + i * 22, 44 - i * 4, 16, 22 + i * 4, V('cash-in'), 'rx="1.6" opacity="0.9"'));
    s += path('M60 84 C 40 100, 26 100, 24 94', V('accent'), 1.4, 'marker-end="url(#epAh2)"');
    s += path('M92 34 C 130 12, 160 14, 174 40', V('primary'), 1.4, 'marker-end="url(#epAh2)"');
    s += `<defs><marker id="epAh2" markerWidth="7" markerHeight="7" refX="5.6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--primary)"/></marker></defs>`;
    s += txt(100, 112, T('TIRM', 'MIRR'), V('primary'), 10, 'middle', 'font-weight="700"');
    return mini(s);
  }
  function bcScale() {
    let s = line(100, 20, 100, 92, V('border-strong'), 2);
    s += line(40, 32, 160, 26, V('primary'), 2.2);
    s += coin(44, 44, 8); s += coin(44, 34, 8);
    s += coin(156, 38, 8);
    s += txt(44, 76, 'B', V('cash-in'), 13, 'middle', 'font-weight="700"');
    s += txt(156, 76, 'C', V('cash-out'), 13, 'middle', 'font-weight="700"');
    s += txt(100, 110, 'B/C > 1', V('text-muted'), 9.5, 'middle');
    return mini(s);
  }
  function paybackLine() {
    const cum = []; let acc = 0;
    DEMO.forEach(f => { acc += f; cum.push(acc); });
    const max = Math.max(...cum.map(Math.abs));
    const y = v => 60 - v / max * 44;
    let s = axes(18, 12, 188, 104, y(0));
    const pts = cum.map((v, i) => [20 + i * 18, y(v)]);
    s += path(poly(pts), V('primary'), 2.2);
    pts.forEach(p => s += circ(p[0], p[1], 2.2, V('primary')));
    let k = cum.findIndex(v => v >= 0);
    if (k > 0) {
      const x = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * (-cum[k - 1] / (cum[k] - cum[k - 1]));
      s += line(x, y(0), x, 104, V('accent'), 1.4, 'stroke-dasharray="3 3"');
      s += circ(x, y(0), 4, V('accent'));
      s += txt(x + 6, 100, T('PR', 'PB'), V('accent'), 9.5, 'start', 'font-weight="700"');
    }
    return mini(s);
  }
  function eaaBars() {
    let s = axes(18, 14, 188, 96);
    s += rect(26, 30, 26, 66, V('primary'), 'rx="2" opacity="0.3"');
    s += txt(39, 24, T('VAN', 'NPV'), V('primary'), 8.5, 'middle');
    for (let i = 0; i < 6; i++) s += rect(74 + i * 19, 66, 14, 30, V('accent'), 'rx="2" opacity="0.85"');
    s += path('M56 60 L70 60', V('text-muted'), 1.2, 'marker-end="url(#epAh2)"');
    s += `<defs><marker id="epAh2" markerWidth="7" markerHeight="7" refX="5.6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--text-muted)"/></marker></defs>`;
    s += txt(131, 112, T('anualidad equivalente', 'equivalent annual value'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function piStack() {
    let s = '';
    const items = [[30, 4, 'primary'], [70, 3, 'accent'], [110, 5, 'leaf'], [150, 2, 'sky']];
    items.forEach(([x, n, c]) => { s += coinStack(x, 92, 10, n, 'coin'); s += rect(x - 14, 100, 28, 6, V(c), 'rx="2" opacity="0.7"'); });
    s += line(14, 44, 186, 44, V('danger'), 1.4, 'stroke-dasharray="4 3"');
    s += txt(16, 38, T('presupuesto', 'budget'), V('danger'), 8.5);
    return mini(s);
  }
  function waccMix() {
    let s = `<g transform="translate(64,58)">`;
    const arc = (a0, a1, r, c) => {
      const p = (a) => [r * Math.cos(a), r * Math.sin(a)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return fillPath(`M0 0 L${f1(x0)} ${f1(y0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f1(x1)} ${f1(y1)} Z`, V(c), 'opacity="0.85"');
    };
    s += arc(-Math.PI / 2, Math.PI * 0.35, 40, 'primary');
    s += arc(Math.PI * 0.35, Math.PI * 1.5, 40, 'accent');
    s += `</g>`;
    s += rect(122, 34, 9, 9, V('primary'), 'rx="2"'); s += txt(136, 42, T('capital', 'equity'), V('text-muted'), 8.5);
    s += rect(122, 52, 9, 9, V('accent'), 'rx="2"'); s += txt(136, 60, T('deuda', 'debt'), V('text-muted'), 8.5);
    s += txt(122, 82, T('CPPC', 'WACC'), V('primary'), 11, 'start', 'font-weight="700"');
    return mini(s);
  }
  function capmLine() {
    let s = axes(20, 14, 186, 96);
    s += path('M20 88 L182 26', V('primary'), 2.2);
    [[50, 76], [88, 62], [126, 47], [160, 33]].forEach(p => s += circ(p[0], p[1], 3.2, V('accent')));
    s += circ(20, 88, 3.4, V('leaf'));
    s += txt(26, 86, 'rᶠ', V('leaf'), 9);
    s += txt(100, 112, T('β · prima de mercado', 'β · market premium'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function fisherFig() {
    let s = axes(20, 14, 186, 96, 56);
    s += path('M22 78 C 70 78, 90 40, 180 28', V('primary'), 2.2);
    s += path('M22 86 C 70 86, 90 66, 180 62', V('accent'), 2, 'stroke-dasharray="5 3"');
    s += txt(112, 34, 'nominal', V('primary'), 8.5);
    s += txt(112, 76, 'real', V('accent'), 8.5);
    s += txt(100, 112, '(1+i) = (1+r)(1+π)', V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function amortTable() {
    let s = rect(22, 14, 156, 92, V('card-bg'), 'rx="4" stroke="' + V('border') + '"');
    s += rect(22, 14, 156, 14, V('accent'), 'rx="4" opacity="0.18"');
    for (let i = 0; i < 5; i++) {
      const y = 36 + i * 14;
      s += rect(30, y, 18, 5, V('text-muted'), 'rx="2" opacity="0.4"');
      s += rect(58, y, 40 - i * 4, 5, V('cash-out'), 'rx="2" opacity="0.6"');
      s += rect(106, y, 20 + i * 4, 5, V('primary'), 'rx="2" opacity="0.7"');
      s += rect(150, y, 20, 5, V('text-muted'), 'rx="2" opacity="0.3"');
    }
    s += txt(30, 25, T('interés · capital · saldo', 'interest · principal · balance'), V('accent'), 7.6, 'start', 'font-weight="700"');
    return mini(s);
  }
  function cashTable() {
    let s = axes(18, 14, 188, 96, 62);
    const flows = [-90, -30, 18, 34, 44, 50, 54, 58];
    const w = 168 / flows.length;
    flows.forEach((f, i) => {
      const h = Math.abs(f) * 0.45;
      s += rect(20 + i * w + 2, f > 0 ? 62 - h : 62, w - 6, h, f > 0 ? V('cash-in') : V('cash-out'), 'rx="1.4" opacity="0.9"');
    });
    let acc = 0; const pts = flows.map((f, i) => { acc += f; return [20 + i * w + w / 2, 62 - acc * 0.32]; });
    s += path(poly(pts), V('primary'), 1.8, 'stroke-dasharray="4 3"');
    s += txt(100, 112, T('flujo de efectivo acumulado', 'cumulative cash flow'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function workingCapital() {
    let s = `<g transform="translate(100,58)">`;
    s += `<circle r="36" fill="none" stroke="${V('primary')}" stroke-width="3" stroke-dasharray="14 6" opacity="0.8"/>`;
    s += `</g>`;
    s += circ(100, 22, 8, V('leaf'), 'opacity="0.9"');
    s += circ(136, 58, 8, V('accent'), 'opacity="0.9"');
    s += circ(100, 94, 8, V('coin'));
    s += circ(64, 58, 8, V('sky'), 'opacity="0.9"');
    s += txt(100, 14, T('siembra', 'sowing'), V('text-muted'), 7.5, 'middle');
    s += txt(160, 60, T('cosecha', 'harvest'), V('text-muted'), 7.5, 'middle');
    s += txt(100, 110, T('cobro', 'payment'), V('text-muted'), 7.5, 'middle');
    s += txt(40, 60, T('insumos', 'inputs'), V('text-muted'), 7.5, 'middle');
    return mini(s);
  }
  function depreciationStep() {
    let s = axes(20, 14, 186, 96);
    let y = 24;
    for (let i = 0; i < 6; i++) {
      s += line(24 + i * 26, y, 50 + i * 26, y, V('primary'), 2.2);
      s += line(50 + i * 26, y, 50 + i * 26, y + 11, V('primary'), 1.2, 'stroke-dasharray="2 2"');
      y += 11;
    }
    s += rect(24, 24, 156, 2, V('primary'), 'opacity="0"');
    s += txt(100, 112, T('valor en libros', 'book value'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function breakevenCross() {
    let s = axes(20, 14, 186, 96);
    s += path('M20 96 L182 20', V('cash-in'), 2.2);
    s += path('M20 60 L182 28', V('cash-out'), 2.2);
    s += line(20, 78, 182, 78, V('text-muted'), 1.4, 'stroke-dasharray="4 3"');
    const bx = 96, by = 47;
    s += circ(bx, by, 4.4, V('accent'));
    s += line(bx, by, bx, 96, V('accent'), 1, 'stroke-dasharray="2 3"');
    s += txt(bx + 6, by - 6, T('PE', 'BE'), V('accent'), 10, 'start', 'font-weight="700"');
    s += txt(146, 18, T('ingreso', 'revenue'), V('cash-in'), 8);
    s += txt(146, 38, T('costo', 'cost'), V('cash-out'), 8);
    return mini(s);
  }
  function leverageBeam() {
    let s = fillPath('M96 92 L112 92 L104 70 Z', V('primary'), 'opacity="0.7"');
    s += line(24, 66, 184, 74, V('border-strong'), 3);
    s += coin(38, 58, 9);
    s += rect(150, 52, 26, 16, V('accent'), 'rx="3" opacity="0.8"');
    s += txt(100, 34, T('apalancamiento', 'leverage'), V('text-muted'), 9, 'middle');
    return mini(s);
  }
  function incomeStatement() { return proforma(); }
  function priceTrend() { return marketPrice(); }
  function demandCurve() {
    let s = axes(22, 14, 186, 96);
    s += path('M30 22 C 70 76, 110 88, 180 92', V('primary'), 2.2);
    s += path('M30 90 C 78 78, 120 40, 180 20', V('accent'), 2.2);
    s += circ(103, 63, 4.4, V('coin'));
    s += txt(36, 26, T('demanda', 'demand'), V('primary'), 8);
    s += txt(140, 26, T('oferta', 'supply'), V('accent'), 8);
    s += txt(100, 112, T('precio de equilibrio', 'equilibrium price'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function salesProgram() {
    let s = axes(20, 14, 186, 96);
    const v = [18, 34, 52, 66, 74, 78, 78];
    v.forEach((h, i) => {
      s += rect(26 + i * 23, 96 - h, 17, h, V('primary'), 'rx="2" opacity="' + (0.35 + i * 0.09) + '"');
    });
    s += path('M34 78 C 70 48, 110 26, 168 20', V('accent'), 1.6, 'stroke-dasharray="4 3"');
    s += txt(100, 112, T('programa de producción y ventas', 'production and sales programme'), V('text-muted'), 8, 'middle');
    return mini(s);
  }
  function elasticityFig() {
    let s = axes(22, 14, 186, 96);
    s += path('M32 22 L176 94', V('primary'), 2.2);
    s += path('M32 46 L176 62', V('accent'), 2.2);
    s += txt(120, 32, T('elástica', 'elastic'), V('primary'), 8);
    s += txt(120, 80, T('inelástica', 'inelastic'), V('accent'), 8);
    return mini(s);
  }
  function tornadoFig() {
    let s = line(100, 12, 100, 104, V('border-strong'), 1.2);
    const rows = [[44, 'primary'], [34, 'accent'], [26, 'leaf'], [18, 'sky'], [10, 'rose']];
    rows.forEach(([w, c], i) => {
      const y = 22 + i * 17;
      s += rect(100 - w, y, w, 11, V(c), 'rx="2" opacity="0.85"');
      s += rect(100, y, w * 0.86, 11, V(c), 'rx="2" opacity="0.5"');
    });
    s += txt(100, 116, '−10 %      +10 %', V('text-muted'), 8, 'middle');
    return mini(s);
  }
  function montecarloHist() { return riskFan(); }
  function scenarioCards() {
    const cards = [['pesimista', 'cash-out'], ['esperado', 'primary'], ['optimista', 'cash-in']];
    let s = '';
    cards.forEach(([t, c], i) => {
      s += rect(16 + i * 58, 26 + (1 - Math.abs(i - 1)) * -8, 50, 68, V(c), 'rx="5" opacity="0.16"');
      s += rect(16 + i * 58, 26 + (1 - Math.abs(i - 1)) * -8, 50, 16, V(c), 'rx="5" opacity="0.5"');
      s += txt(41 + i * 58, 70, ['−', '=', '+'][i], V(c), 16, 'middle', 'font-weight="700"');
    });
    return mini(s);
  }
  function switchingFig() {
    let s = axes(20, 14, 186, 96, 56);
    s += path('M24 24 L180 88', V('primary'), 2.2);
    const x = 128;
    s += circ(x, 56, 4.4, V('danger'));
    s += line(x, 56, x, 96, V('danger'), 1.2, 'stroke-dasharray="3 3"');
    s += txt(x + 6, 50, T('valor límite', 'switching value'), V('danger'), 8.5);
    s += txt(26, 20, T('VAN', 'NPV'), V('text-muted'), 8.5);
    return mini(s);
  }
  function decisionTree() {
    let s = rect(18, 52, 12, 12, V('primary'), 'rx="2"');
    s += path('M30 58 L64 34 M30 58 L64 82', V('primary'), 1.6);
    s += circ(68, 34, 5, V('accent')); s += circ(68, 82, 5, V('accent'));
    s += path('M73 34 L112 22 M73 34 L112 46 M73 82 L112 70 M73 82 L112 94', V('accent'), 1.2);
    [22, 46, 70, 94].forEach((y, i) => {
      s += rect(114, y - 7, 46, 14, V(i % 2 ? 'leaf' : 'sky'), 'rx="3" opacity="0.22"');
      s += txt(137, y + 4, ['+62', '+18', '−12', '−40'][i], V(i < 2 ? 'cash-in' : 'cash-out'), 8.5, 'middle');
    });
    return mini(s);
  }
  function shadowPrice() {
    let s = axes(20, 14, 186, 96);
    s += rect(34, 34, 40, 62, V('primary'), 'rx="2" opacity="0.8"');
    s += rect(112, 52, 40, 44, V('leaf'), 'rx="2" opacity="0.8"');
    s += path('M78 46 L108 60', V('accent'), 1.6, 'stroke-dasharray="4 3" marker-end="url(#epAh3)"');
    s += `<defs><marker id="epAh3" markerWidth="7" markerHeight="7" refX="5.6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--accent)"/></marker></defs>`;
    s += txt(54, 26, T('mercado', 'market'), V('primary'), 8, 'middle');
    s += txt(132, 44, T('cuenta', 'accounting'), V('leaf'), 8, 'middle');
    s += txt(100, 112, T('factor de conversión', 'conversion factor'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function employmentFig() {
    let s = ground(14, 186, 96, 10);
    const person = (x, c, h) => circ(x, 96 - h, 6, V(c), 'opacity="0.9"') + fillPath(`M${x - 9} 96 q 9 -${h - 8} 18 0 Z`, V(c), 'opacity="0.7"');
    [[34, 'primary', 40], [62, 'leaf', 46], [90, 'accent', 36], [118, 'sky', 50], [146, 'rose', 42]].forEach(p => s += person(p[0], p[1], p[2]));
    s += txt(100, 24, T('jornales generados', 'labour days created'), V('text-muted'), 9, 'middle');
    return mini(s);
  }
  function foreignExchange() {
    let s = circ(60, 56, 26, V('primary'), 'opacity="0.18"');
    s += circ(140, 56, 26, V('accent'), 'opacity="0.18"');
    s += txt(60, 62, '$', V('primary'), 22, 'middle', 'font-weight="700"');
    s += txt(140, 62, 'US$', V('accent'), 15, 'middle', 'font-weight="700"');
    s += path('M88 44 q 12 -12 24 0', V('text-muted'), 1.4, 'marker-end="url(#epAh4)"');
    s += path('M112 68 q -12 12 -24 0', V('text-muted'), 1.4, 'marker-end="url(#epAh4)"');
    s += `<defs><marker id="epAh4" markerWidth="7" markerHeight="7" refX="5.6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--text-muted)"/></marker></defs>`;
    s += txt(100, 104, T('divisas generadas', 'foreign exchange earned'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function socialBC() { return socialScale(); }
  function compareProjects() {
    let s = axes(20, 14, 186, 96);
    [[36, 62, 'primary'], [76, 48, 'accent'], [116, 70, 'leaf'], [152, 34, 'sky']].forEach(([x, h, c], i) => {
      s += rect(x, 96 - h, 28, h, V(c), 'rx="2" opacity="0.85"');
      s += txt(x + 14, 92 - h, ['A', 'B', 'C', 'D'][i], V(c), 9, 'middle', 'font-weight="700"');
    });
    s += line(20, 52, 186, 52, V('danger'), 1.2, 'stroke-dasharray="4 3"');
    return mini(s);
  }
  function incrementalFig() {
    let s = axes(20, 14, 186, 96, 60);
    s += path('M24 26 C 70 54, 120 70, 180 80', V('primary'), 2.2);
    s += path('M24 44 C 70 56, 120 62, 180 64', V('accent'), 2.2);
    s += circ(92, 59, 4.4, V('danger'));
    s += line(92, 59, 92, 96, V('danger'), 1, 'stroke-dasharray="3 3"');
    s += txt(96, 34, 'intersección de Fisher', V('danger'), 8);
    return mini(s);
  }
  function rationingFig() { return piStack(); }
  function replacementFig() {
    let s = axes(20, 14, 186, 96);
    s += path('M26 30 C 60 78, 90 88, 120 72 C 150 58, 166 34, 176 22', V('primary'), 2.2);
    const x = 104;
    s += circ(x, 82, 4.4, V('accent'));
    s += line(x, 82, x, 96, V('accent'), 1.2, 'stroke-dasharray="3 3"');
    s += txt(x + 6, 74, T('vida óptima', 'optimal life'), V('accent'), 8.5);
    s += txt(26, 24, T('CAUE', 'EAC'), V('primary'), 9);
    return mini(s);
  }
  function faustmannFig() {
    let s = ground(14, 186, 96, 9);
    [30, 66, 102, 138, 172].forEach((x, i) => { s += tree(x, 96, 22 + i * 14); });
    s += path('M172 30 C 186 20, 26 18, 26 44', V('accent'), 1.4, 'stroke-dasharray="4 3" marker-end="url(#epAh5)"');
    s += `<defs><marker id="epAh5" markerWidth="7" markerHeight="7" refX="5.6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--accent)"/></marker></defs>`;
    s += txt(100, 18, T('rotación', 'rotation'), V('accent'), 8.5, 'middle');
    return mini(s);
  }
  function partialBudget() {
    let s = rect(20, 16, 76, 88, V('cash-in'), 'rx="4" opacity="0.14"');
    s += rect(104, 16, 76, 88, V('cash-out'), 'rx="4" opacity="0.14"');
    s += txt(58, 32, '+', V('cash-in'), 16, 'middle', 'font-weight="700"');
    s += txt(142, 32, '−', V('cash-out'), 16, 'middle', 'font-weight="700"');
    [0, 1, 2].forEach(i => {
      s += rect(30, 46 + i * 14, 56 - i * 8, 6, V('cash-in'), 'rx="2" opacity="0.55"');
      s += rect(114, 46 + i * 14, 48 - i * 10, 6, V('cash-out'), 'rx="2" opacity="0.55"');
    });
    s += txt(100, 116, T('presupuesto parcial', 'partial budget'), V('text-muted'), 8.5, 'middle');
    return mini(s);
  }
  function marginalRate() {
    let s = axes(22, 14, 186, 96);
    const pts = [[34, 88], [62, 70], [96, 52], [128, 44], [166, 42]];
    s += path(poly(pts), V('primary'), 2);
    pts.forEach((p, i) => s += circ(p[0], p[1], 3.4, V(i === 2 ? 'accent' : 'primary')));
    s += path('M34 92 L44 92', V('danger'), 1.4);
    s += circ(50, 92, 3.2, V('danger'));
    s += txt(56, 100, T('dominado', 'dominated'), V('danger'), 7.5);
    s += txt(112, 26, T('TRM', 'MRR'), V('accent'), 9.5, 'middle', 'font-weight="700"');
    return mini(s);
  }

  /* theory figures reuse the gallery drawings */
  window.Art = {
    hero, coin, coinStack, tree, ground, flowBars, mini, axes, wrap, txt, poly, path, rect, circ, line, V,
    /* blocks */
    projSetup, marketPrice, investCost, proforma, npvProfile, riskFan, socialScale, decisionFork, reportDoc,
    /* project types */
    matAnnual, matOrchard, matGreenhouse, matLivestock, matAgroindustry, matIrrigation, matForestry, matSocial,
    /* methods */
    npvBars, irrCross, mirrArrow, bcScale, paybackLine, eaaBars, piStack,
    waccMix, capmLine, fisherFig, amortTable,
    cashTable, workingCapital, depreciationStep, breakevenCross, leverageBeam, incomeStatement,
    priceTrend, demandCurve, salesProgram, elasticityFig,
    tornadoFig, montecarloHist, scenarioCards, switchingFig, decisionTree,
    shadowPrice, employmentFig, foreignExchange, socialBC,
    compareProjects, incrementalFig, rationingFig, replacementFig, faustmannFig,
    partialBudget, marginalRate,
  };
})();
