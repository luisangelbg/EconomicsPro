/* EconomicsPro — the figure studio of Block 10.

   Every figure of the study already lives on its own block's screen, drawn as
   an SVG that reads its colours from the stylesheet. To leave the app —for a
   thesis, a slide or a printed file— a figure has to become a file that stands
   on its own: the colours baked in, a title of its own, a white background and
   the resolution a journal asks for.

   That is all this file does. It takes the figure that is already on screen,
   copies it, resolves its colours, puts a title and a note around it and hands
   back an .svg, a .png or a .jpg at up to 900 dpi. Nothing is recomputed, so
   what is exported is exactly what the block showed. */

(function () {

  const NS = 'http://www.w3.org/2000/svg';

  /* ================================================================
     1 · the two palettes, written out
     ================================================================
     An exported file cannot ask the stylesheet for its colours, so the
     variables are resolved before it leaves. Both palettes are kept here,
     which also lets somebody working in dark mode export a figure for a paper
     that has to be printed on white. */
  const PALETTES = {
    light: {
      '--bg': '#f5f7f4', '--bg-soft': '#e9efe9', '--card-bg': '#ffffff',
      '--text': '#16221d', '--text-muted': '#5b6b63',
      '--border': '#dde6df', '--border-strong': '#c3d1c7',
      '--primary': '#145e4e', '--primary-dark': '#0e4639', '--primary-soft': 'rgba(20,94,78,0.09)',
      '--accent': '#b06e0c', '--accent-soft': 'rgba(176,110,12,0.12)',
      '--gold': '#dfa524', '--leaf': '#5a8f2b', '--sky': '#2d78b0', '--rose': '#c0406a',
      '--success': '#2f8f4a', '--danger': '#c43a2f', '--warning': '#c98014',
      '--c1': '#145e4e', '--c2': '#dfa524', '--c3': '#5a8f2b', '--c4': '#c0406a', '--c5': '#2d78b0',
      '--c6': '#d0682a', '--c7': '#3aa39a', '--c8': '#7b5ea7', '--c9': '#8a6a4a', '--c10': '#5f6b86',
      '--cash-in': '#2f8f4a', '--cash-out': '#c43a2f', '--coin': '#dfa524', '--coin-dark': '#a97c12',
      '--heat-lo': '#f2f7ef', '--heat-mid': '#7fbf94', '--heat-hi': '#0e4639',
    },
    dark: {
      '--bg': '#0d1512', '--bg-soft': '#14201b', '--card-bg': '#1a2622',
      '--text': '#e6efe9', '--text-muted': '#9aaba2',
      '--border': '#2a3a33', '--border-strong': '#3d5249',
      '--primary': '#4fb99b', '--primary-dark': '#3da588', '--primary-soft': 'rgba(79,185,155,0.14)',
      '--accent': '#eab54a', '--accent-soft': 'rgba(234,181,74,0.14)',
      '--gold': '#f2c14e', '--leaf': '#8fca5c', '--sky': '#6db3e8', '--rose': '#ef7ca3',
      '--success': '#5cc27a', '--danger': '#f07166', '--warning': '#f0b24a',
      '--c1': '#4fb99b', '--c2': '#eab54a', '--c3': '#8fca5c', '--c4': '#ef7ca3', '--c5': '#6db3e8',
      '--c6': '#f29a5c', '--c7': '#5fd0c3', '--c8': '#b49ae0', '--c9': '#c7a684', '--c10': '#9aa6c2',
      '--cash-in': '#5cc27a', '--cash-out': '#f07166', '--coin': '#f2c14e', '--coin-dark': '#c79a2a',
      '--heat-lo': '#17231e', '--heat-mid': '#2f7d68', '--heat-hi': '#d8f3e6',
    },
  };

  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  /* The classes the plotting kit uses, written as plain rules for a file that
     travels without the stylesheet. */
  function styleSheet(P) {
    return `text{font-family:${FONT}}
.art-txt:not([fill]){fill:${P['--text']}}
.art-mut:not([fill]){fill:${P['--text-muted']}}
.art-ax{stroke:${P['--border-strong']};fill:none}
.art-line{stroke:${P['--text-muted']};fill:none}
.art-bg{fill:${P['--bg-soft']}}
.art-card{fill:${P['--card-bg']};stroke:${P['--border']}}
.art-p{fill:${P['--primary']}}.art-a{fill:${P['--accent']}}.art-g{fill:${P['--gold']}}
.art-lf{fill:${P['--leaf']}}.art-s{fill:${P['--sky']}}.art-r{fill:${P['--rose']}}
.art-c1{fill:${P['--c1']}}.art-c2{fill:${P['--c2']}}.art-c3{fill:${P['--c3']}}.art-c4{fill:${P['--c4']}}.art-c5{fill:${P['--c5']}}
.art-c6{fill:${P['--c6']}}.art-c7{fill:${P['--c7']}}.art-c8{fill:${P['--c8']}}.art-c9{fill:${P['--c9']}}.art-c10{fill:${P['--c10']}}
.art-l1{stroke:${P['--c1']};fill:none}.art-l2{stroke:${P['--c2']};fill:none}.art-l3{stroke:${P['--c3']};fill:none}
.art-l4{stroke:${P['--c4']};fill:none}.art-l5{stroke:${P['--c5']};fill:none}`;
  }

  /* var(--x) inside an attribute is CSS, and CSS is what the exported file
     does not carry: every one is replaced by its value. */
  function bake(text, theme) {
    const P = PALETTES[theme] || PALETTES.light;
    return String(text).replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/gi,
      (all, name, fallback) => P[name] || (fallback ? fallback.trim() : '#145e4e'));
  }

  /* ================================================================
     2 · composing the figure that leaves
     ================================================================
     The figure of the block, with a title above it and a note below, on a
     background of its own. Everything is measured in the units of the
     original viewBox, so the proportions never change. */
  function compose(source, o) {
    const opt = o || {};
    const theme = opt.theme === 'dark' ? 'dark' : 'light';
    const P = PALETTES[theme];
    const vb = (source.getAttribute('viewBox') || '0 0 700 320').split(/\s+/).map(Number);
    const W = vb[2] || 700, H = vb[3] || 320;
    const title = (opt.title || '').trim();
    const note = (opt.note || '').trim();
    const pad = 10;
    const titleH = title ? 26 : 0;
    const noteLines = note ? wrapText(note, Math.floor(W / 5.6)) : [];
    const noteH = noteLines.length ? 8 + noteLines.length * 13 : 0;
    const total = H + titleH + noteH + pad * 2;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', `0 0 ${W} ${total}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', total);
    const style = document.createElementNS(NS, 'style');
    style.textContent = styleSheet(P);
    svg.appendChild(style);
    if (opt.background !== 'none') {
      svg.appendChild(rect(0, 0, W, total, opt.background === 'soft' ? P['--bg-soft'] : P['--card-bg']));
    }
    if (title) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', pad + 4); t.setAttribute('y', pad + 16);
      t.setAttribute('font-size', 14); t.setAttribute('font-weight', 700);
      t.setAttribute('fill', P['--text']);
      t.textContent = title;
      svg.appendChild(t);
    }
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(0 ${pad + titleH})`);
    /* the figure itself, exactly as the block drew it */
    [...source.childNodes].forEach(n => g.appendChild(n.cloneNode(true)));
    svg.appendChild(g);
    noteLines.forEach((line, i) => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', pad + 4);
      t.setAttribute('y', pad + titleH + H + 16 + i * 13);
      t.setAttribute('font-size', 10.5);
      t.setAttribute('fill', P['--text-muted']);
      t.textContent = line;
      svg.appendChild(t);
    });
    svg.dataset.w = W;
    svg.dataset.h = total;
    svg.dataset.theme = theme;
    return svg;
  }

  function rect(x, y, w, h, fill) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    r.setAttribute('fill', fill);
    return r;
  }

  function wrapText(text, perLine) {
    const words = String(text).split(/\s+/);
    const out = [];
    let line = '';
    words.forEach(w => {
      if ((line + ' ' + w).trim().length > perLine) { if (line) out.push(line); line = w; }
      else line = (line + ' ' + w).trim();
    });
    if (line) out.push(line);
    return out.slice(0, 6);
  }

  /* ================================================================
     3 · the file
     ================================================================ */
  function serialize(svg) {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.removeAttribute('data-w'); clone.removeAttribute('data-h'); clone.removeAttribute('data-theme');
    const text = new XMLSerializer().serializeToString(clone);
    return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
      bake(text, svg.dataset.theme === 'dark' ? 'dark' : 'light');
  }

  /* PNG carries its resolution in a pHYs chunk, and that is what a journal
     reads when it asks for 300 or 600 dpi. */
  function pngWithDpi(buffer, dpi) {
    const src = new Uint8Array(buffer);
    const ppm = Math.round(dpi / 0.0254);
    const chunk = new Uint8Array(21);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9);
    chunk.set([0x70, 0x48, 0x59, 0x73], 4);            /* pHYs */
    dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, Zip.crc32(chunk.subarray(4, 17)));
    /* the signature and IHDR take the first 33 bytes; pHYs goes right after */
    const out = new Uint8Array(src.length + chunk.length);
    out.set(src.subarray(0, 33), 0);
    out.set(chunk, 33);
    out.set(src.subarray(33), 33 + chunk.length);
    return out;
  }

  /* The browser writes "no units" in the JFIF header and every program then
     assumes 72 dpi; writing the real one costs five bytes. */
  function jpgWithDpi(buffer, dpi) {
    const b = new Uint8Array(buffer);
    const jfif = b[2] === 0xFF && b[3] === 0xE0 && b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0;
    if (jfif) {
      const d = Math.max(1, Math.min(65535, Math.round(dpi)));
      b[13] = 1; b[14] = d >> 8; b[15] = d & 255; b[16] = d >> 8; b[17] = d & 255;
    }
    return b;
  }

  /* The base of every figure is 700 units wide, which the browser draws at 96
     dpi: the scale that gives a resolution is dpi / 96. */
  const scaleFor = dpi => Math.max(1, dpi / 96);

  function toRaster(svg, o) {
    const opt = o || {};
    const dpi = opt.dpi || 300;
    const format = opt.format === 'jpg' ? 'jpg' : 'png';
    const w = +svg.dataset.w || 700, h = +svg.dataset.h || 320;
    let scale = scaleFor(dpi);
    /* no browser will make a canvas of any size: if it does not fit, the
       figure comes out at the largest resolution that does, and says so */
    const MAX = 16000;
    let realDpi = dpi;
    if (w * scale > MAX || h * scale > MAX) {
      scale = Math.min(MAX / w, MAX / h);
      realDpi = Math.round(scale * 96);
    }
    const blob = new Blob([serialize(svg)], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        const ctx = c.getContext('2d');
        if (!ctx || c.width !== Math.round(w * scale)) {
          URL.revokeObjectURL(url);
          reject(new Error('canvas'));
          return;
        }
        if (format === 'jpg' || opt.background !== 'none') {
          ctx.fillStyle = opt.background === 'none' ? '#ffffff'
            : (PALETTES[svg.dataset.theme === 'dark' ? 'dark' : 'light']['--card-bg']);
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => {
          if (!b) { reject(new Error('blob')); return; }
          b.arrayBuffer().then(ab => resolve({
            blob: new Blob([format === 'jpg' ? jpgWithDpi(ab, realDpi) : pngWithDpi(ab, realDpi)],
              { type: format === 'jpg' ? 'image/jpeg' : 'image/png' }),
            dpi: realDpi, width: c.width, height: c.height,
          }));
        }, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.97);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg')); };
      img.src = url;
    });
  }

  async function fileOf(svg, o) {
    const opt = o || {};
    if (opt.format === 'svg') {
      return { blob: new Blob([serialize(svg)], { type: 'image/svg+xml;charset=utf-8' }), ext: 'svg' };
    }
    const r = await toRaster(svg, opt);
    return { blob: r.blob, ext: opt.format === 'jpg' ? 'jpg' : 'png', dpi: r.dpi, width: r.width, height: r.height };
  }

  /* ================================================================
     4 · what figures the study has
     ================================================================
     Each one names the element the block already drew. Nothing is recomputed
     here: what leaves is what the screen showed. */
  const CATALOG = [
    { id: 'b2Timeline', block: 2, es: 'Línea de tiempo del proyecto', en: 'Timeline of the project' },
    { id: 'b2RateChart', block: 2, es: 'De qué se compone la tasa de descuento', en: 'What the discount rate is made of' },
    { id: 'b2DiscountChart', block: 2, es: 'Cuánto vale hoy un peso de cada año', en: 'What a peso of each year is worth today' },
    { id: 'b3PriceChart', block: 3, es: 'Precio: serie histórica y proyección', en: 'Price: history and forecast' },
    { id: 'b3YieldChart', block: 3, es: 'Rendimiento: serie histórica y proyección', en: 'Yield: history and forecast' },
    { id: 'b3MarketChart', block: 3, es: 'Demanda, oferta y participación', en: 'Demand, supply and market share' },
    { id: 'b3ProgChart', block: 3, es: 'Programa de producción y ventas', en: 'Production and sales programme' },
    { id: 'b4GroupChart', block: 4, es: 'Costos por grupo', en: 'Costs by group' },
    { id: 'b4StructChart', block: 4, es: 'Estructura de la inversión', en: 'Structure of the investment' },
    { id: 'b4ScheduleChart', block: 4, es: 'Calendario de inversiones', en: 'Investment schedule' },
    { id: 'b4CostChart', block: 4, es: 'Costos fijos y variables por año', en: 'Fixed and variable costs by year' },
    { id: 'b5IncomeChart', block: 5, es: 'Estado de resultados por año', en: 'Income statement by year' },
    { id: 'b5FlowChart', block: 5, es: 'Los dos flujos de efectivo', en: 'The two cash flows' },
    { id: 'b5BeChart', block: 5, es: 'Punto de equilibrio', en: 'Break-even point' },
    { id: 'b5DebtChart', block: 5, es: 'Servicio de la deuda y su cobertura', en: 'Debt service and its coverage' },
    { id: 'b6ProfileChart', block: 6, es: 'Perfil del VAN contra la tasa', en: 'NPV profile against the rate' },
    { id: 'b6WaterfallChart', block: 6, es: 'De dónde sale el VAN', en: 'Where the NPV comes from' },
    { id: 'b6PaybackChart', block: 6, es: 'Recuperación de la inversión', en: 'Recovery of the investment' },
    { id: 'b6MarginalChart', block: 6, es: 'Análisis marginal (CIMMYT)', en: 'Marginal analysis (CIMMYT)' },
    { id: 'b7SpiderChart', block: 7, es: 'Araña de sensibilidad', en: 'Sensitivity spider' },
    { id: 'b7TornadoChart', block: 7, es: 'Tornado', en: 'Tornado' },
    { id: 'b7HeatChart', block: 7, es: 'Tabla de dos variables', en: 'Two-variable table' },
    { id: 'b7HistChart', block: 7, es: 'Simulación de Monte Carlo', en: 'Monte Carlo simulation' },
    { id: 'b7DriverChart', block: 7, es: 'Qué explica la dispersión del VAN', en: 'What explains the spread of the NPV' },
    { id: 'b7TreeChart', block: 7, es: 'Árbol de decisión: invertir o esperar', en: 'Decision tree: invest or wait' },
    { id: 'b8BridgeChart', block: 8, es: 'Del VAN privado al VAN económico', en: 'From the private NPV to the economic one' },
    { id: 'b8ProfileChart', block: 8, es: 'Los dos perfiles: privado y económico', en: 'The two profiles: private and economic' },
    { id: 'b8JobsChart', block: 8, es: 'Empleo generado', en: 'Employment created' },
    { id: 'b8ValueChart', block: 8, es: 'Reparto del valor agregado', en: 'How the value added is shared' },
    { id: 'b9CompareChart', block: 9, es: 'Perfiles de las alternativas y cruce de Fisher', en: 'Profiles of the alternatives and Fisher crossing' },
    { id: 'b9RationingChart', block: 9, es: 'Qué cabe en el presupuesto', en: 'What fits in the budget' },
    { id: 'b9ReplacementChart', block: 9, es: 'Vida económica del equipo', en: 'Economic life of the machine' },
    { id: 'b9RotationChart', block: 9, es: 'Turno óptimo de la plantación', en: 'Optimal rotation of the plantation' },
  ];

  /* A figure counts as available when its block actually drew it. */
  const sourceOf = id => {
    const n = document.getElementById(id);
    return n && n.childElementCount > 0 ? n : null;
  };
  const available = () => CATALOG.filter(f => sourceOf(f.id));

  window.Fig = {
    PALETTES, CATALOG, FONT,
    bake, styleSheet, compose, serialize, toRaster, fileOf,
    pngWithDpi, jpgWithDpi, scaleFor, wrapText, sourceOf, available,
  };
})();
