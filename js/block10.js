/* EconomicsPro — Block 10: the figure studio, the report and the package.

   Nothing is computed here. This block only takes what the nine before it
   produced and turns it into files somebody else can read: a figure at the
   resolution a journal asks for, a report that opens in any browser and prints
   to PDF, and one .zip with the whole study inside, including the project file
   that reproduces it. */

(function () {

  let current = null;          /* the figure being shown in the studio */
  let composed = null;         /* what would be exported, already composed */

  function P() {
    if (!state.project) state.project = Project.load() || Project.defaults();
    return state.project;
  }

  /* ================================================================
     the figure studio
     ================================================================ */
  function fillFigureList() {
    const sel = el('b10Figure');
    if (!sel) return;
    const list = Fig.available();
    const keep = sel.value;
    sel.innerHTML = '';
    let block = 0;
    let group = null;
    list.forEach(f => {
      if (f.block !== block) {
        block = f.block;
        group = mk('optgroup', { label: `${T('Bloque', 'Block')} ${block}` });
        sel.appendChild(group);
      }
      group.appendChild(mk('option', { value: f.id }, T(f.es, f.en)));
    });
    if (!list.length) {
      sel.appendChild(mk('option', { value: '' }, T('todavía no hay figuras', 'no figures yet')));
    }
    sel.value = list.some(f => f.id === keep) ? keep : (list[0] ? list[0].id : '');
    const count = el('b10FigCount');
    if (count) {
      count.textContent = list.length
        ? T(`Hay ${list.length} figuras dibujadas en este estudio.`, `There are ${list.length} figures drawn in this study.`)
        : T('Todavía no hay ninguna figura: llena los bloques anteriores con datos.',
          'There are no figures yet: fill the previous blocks with data.');
    }
    return list;
  }

  function figureOf(id) { return Fig.CATALOG.find(f => f.id === id); }

  function renderStudio() {
    const sel = el('b10Figure');
    const host = el('b10Preview');
    if (!sel || !host) return;
    const f = figureOf(sel.value);
    const src = f ? Fig.sourceOf(f.id) : null;
    current = f;
    host.innerHTML = '';
    if (!src) {
      host.innerHTML = `<p class="hint">${L2('Esa figura todavía no se ha dibujado: entra al bloque que la produce y llénalo con datos.',
        'That figure has not been drawn yet: go to the block that produces it and fill it with data.')}</p>`;
      composed = null;
      updateSizeNote();
      return;
    }
    const titleField = el('b10Title');
    if (titleField && titleField.dataset.auto !== '0') titleField.value = T(f.es, f.en);
    composed = Fig.compose(src, {
      title: (titleField ? titleField.value : '') || '',
      note: el('b10Note') ? el('b10Note').value : '',
      theme: el('b10Theme') ? el('b10Theme').value : 'light',
      background: el('b10Background') ? el('b10Background').value : 'card',
    });
    const shown = composed.cloneNode(true);
    shown.removeAttribute('width');
    shown.removeAttribute('height');
    shown.setAttribute('style', 'width:100%;height:auto');
    /* the preview is a copy of a figure that is still on the page: its ids
       (the clip of the plot area) get a suffix so they are not repeated */
    const renamed = {};
    shown.querySelectorAll('[id]').forEach(n => { renamed[n.id] = n.id + '-pv'; n.id = renamed[n.id]; });
    if (Object.keys(renamed).length) shown.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
      const v = a.value.replace(/url\(#([^)]+)\)|^#(.+)$/g, (m, u, h) => renamed[u || h] ? (u ? 'url(#' + renamed[u] + ')' : '#' + renamed[h]) : m);
      if (v !== a.value) n.setAttribute(a.name, v);
    }));
    /* the preview lives inside the app, where the variables do resolve, but the
       figure that leaves must not depend on them: it is shown already baked */
    const holder = document.createElement('div');
    holder.innerHTML = Fig.bake(new XMLSerializer().serializeToString(shown),
      el('b10Theme') && el('b10Theme').value === 'dark' ? 'dark' : 'light');
    host.appendChild(holder.firstChild);
    updateSizeNote();
  }

  function updateSizeNote() {
    const note = el('b10SizeNote');
    if (!note) return;
    if (!composed) { note.textContent = ''; return; }
    const fmt = el('b10Format') ? el('b10Format').value : 'png';
    const dpi = Number(el('b10Dpi') ? el('b10Dpi').value : 300);
    const w = +composed.dataset.w, h = +composed.dataset.h;
    if (fmt === 'svg') {
      note.textContent = T(
        `Vectorial: se ve bien a cualquier tamaño. Mide ${w} × ${h} puntos, es decir ${(w / 96 * 2.54).toFixed(1)} × ${(h / 96 * 2.54).toFixed(1)} cm al 100 %.`,
        `Vector: it looks right at any size. It measures ${w} × ${h} points, that is ${(w / 96 * 2.54).toFixed(1)} × ${(h / 96 * 2.54).toFixed(1)} cm at 100 %.`);
      return;
    }
    const k = Fig.scaleFor(dpi);
    note.textContent = T(
      `A ${dpi} dpi saldrá de ${Math.round(w * k)} × ${Math.round(h * k)} píxeles, que impresos miden ${(w / 96 * 2.54).toFixed(1)} × ${(h / 96 * 2.54).toFixed(1)} cm.`,
      `At ${dpi} dpi it will come out at ${Math.round(w * k)} × ${Math.round(h * k)} pixels, which printed measure ${(w / 96 * 2.54).toFixed(1)} × ${(h / 96 * 2.54).toFixed(1)} cm.`);
  }

  async function downloadFigure() {
    if (!composed || !current) return;
    const fmt = el('b10Format').value;
    const dpi = Number(el('b10Dpi').value);
    try {
      const file = await Fig.fileOf(composed, { format: fmt, dpi, background: el('b10Background').value });
      download(file.blob, slug(P().name) + '-' + slug(T(current.es, current.en)) + '.' + file.ext);
      if (file.dpi && file.dpi < dpi) {
        notice(el('b10Messages'), 'warning', L2(
          `El navegador no pudo hacer una imagen tan grande: la figura salió a ${file.dpi} dpi. Para más resolución, descárgala como SVG.`,
          `The browser could not make an image that large: the figure came out at ${file.dpi} dpi. For more resolution, download it as SVG.`));
      }
    } catch (e) {
      notice(el('b10Messages'), 'error', L2(
        'No se pudo generar la imagen. Prueba con una resolución menor o descárgala como SVG.',
        'The image could not be generated. Try a lower resolution or download it as SVG.'));
    }
  }

  /* Every available figure as a file. If the browser refuses to rasterise one
     —an old machine, a canvas too large, a page opened under rules that taint
     it— that figure leaves as SVG instead of stopping the whole package. */
  async function figureFiles(o) {
    const opt = o || {};
    const files = [];
    const list = Fig.available();
    let fellBack = 0;
    for (const f of list) {
      const src = Fig.sourceOf(f.id);
      if (!src) continue;
      const svg = Fig.compose(src, { title: T(f.es, f.en), theme: opt.theme || 'light', background: opt.background || 'card' });
      let file;
      try {
        file = await Fig.fileOf(svg, { format: opt.format || 'png', dpi: opt.dpi || 300, background: opt.background || 'card' });
      } catch (e) {
        file = await Fig.fileOf(svg, { format: 'svg' });
        fellBack++;
      }
      files.push({ name: `figuras/bloque-${f.block}-${slug(T(f.es, f.en))}.${file.ext}`, data: file.blob });
    }
    files.fellBack = fellBack;
    return files;
  }

  async function downloadAllFigures() {
    const btn = el('b10AllFigures');
    if (btn) btn.disabled = true;
    try {
      const files = await figureFiles({
        format: el('b10Format').value === 'svg' ? 'svg' : el('b10Format').value,
        dpi: Number(el('b10Dpi').value), theme: el('b10Theme').value, background: el('b10Background').value,
      });
      if (!files.length) {
        notice(el('b10Messages'), 'warning', L2('Todavía no hay figuras que descargar.', 'There are no figures to download yet.'));
        return;
      }
      const blob = await Zip.build(files);
      download(blob, slug(P().name) + '-figuras.zip');
      notice(el('b10Messages'), 'info', L2(`Se descargaron ${files.length} figuras.`, `${files.length} figures were downloaded.`));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ================================================================
     the report
     ================================================================ */
  function reportOptions() {
    return {
      author: el('b10Author') ? el('b10Author').value.trim() : '',
      institution: el('b10Institution') ? el('b10Institution').value.trim() : '',
      figures: el('b10WithFigures') ? el('b10WithFigures').checked : true,
      methods: el('b10WithMethods') ? el('b10WithMethods').checked : true,
      record: el('b10WithRecord') ? el('b10WithRecord').checked : true,
      references: el('b10WithRefs') ? el('b10WithRefs').checked : true,
    };
  }

  function openReport(print) {
    const r = Report.build(reportOptions());
    if (!r.html) return;
    const w = window.open('', '_blank');
    if (!w) {
      notice(el('b10Messages'), 'warning', L2(
        'El navegador bloqueó la ventana nueva. Descarga el informe y ábrelo desde tu carpeta.',
        'The browser blocked the new window. Download the report and open it from your folder.'));
      return;
    }
    w.document.write(r.html);
    w.document.close();
    if (print) setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* the user prints it */ } }, 400);
  }

  function downloadReport() {
    const r = Report.build(reportOptions());
    if (!r.html) return;
    download(new Blob([r.html], { type: 'text/html;charset=utf-8' }), slug(P().name) + '-informe.html');
  }

  async function downloadPackage() {
    const btn = el('b10Package');
    if (btn) { btn.disabled = true; }
    try {
      const p = P();
      const opt = reportOptions();
      const r = Report.build(opt);
      const files = [{ name: 'informe.html', data: r.html }];
      files.push({ name: 'proyecto.json', data: JSON.stringify(p, null, 2) });
      Report.tables().forEach(t => files.push(t));
      const figs = await figureFiles({ format: 'png', dpi: 300 });
      figs.forEach(f => files.push(f));
      files.push({ name: 'LEEME.txt', data: readme() });
      const blob = await Zip.build(files);
      download(blob, slug(p.name) + '-estudio.zip');
      notice(el('b10Messages'), 'info', L2(
        `El paquete lleva el informe, ${figs.length} figuras, las tablas en .csv y el archivo del proyecto.${figs.fellBack ? ` ${figs.fellBack} salieron como SVG porque el navegador no pudo convertirlas a imagen.` : ''}`,
        `The package carries the report, ${figs.length} figures, the tables as .csv and the project file.${figs.fellBack ? ` ${figs.fellBack} came out as SVG because the browser could not turn them into an image.` : ''}`));
    } catch (e) {
      notice(el('b10Messages'), 'error', L2('No se pudo armar el paquete.', 'The package could not be built.'));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function readme() {
    const p = P();
    const date = new Date().toLocaleString(I18N.lang === 'en' ? 'en-GB' : 'es-MX');
    return T(
      `ESTUDIO: ${p.name || 'sin nombre'}\nGenerado con EconomicsPro el ${date}\n\n` +
      'Qué lleva este paquete\n' +
      '  informe.html      el informe completo; ábrelo con cualquier navegador y desde ahí imprímelo a PDF\n' +
      '  proyecto.json     el archivo del estudio; ábrelo en EconomicsPro (Bloque 2) para rehacer todos los cálculos\n' +
      '  figuras/          cada figura del estudio en PNG a 300 dpi\n' +
      '  tablas/           las tablas en .csv, listas para abrir en una hoja de cálculo\n\n' +
      'Los cálculos son responsabilidad de quien firma el estudio.\n',
      `STUDY: ${p.name || 'untitled'}\nGenerated with EconomicsPro on ${date}\n\n` +
      'What this package carries\n' +
      '  informe.html      the whole report; open it with any browser and print it to PDF from there\n' +
      '  proyecto.json     the study file; open it in EconomicsPro (Block 2) to redo every calculation\n' +
      '  figuras/          every figure of the study as a PNG at 300 dpi\n' +
      '  tablas/           the tables as .csv, ready to open in a spreadsheet\n\n' +
      'The calculations are the responsibility of whoever signs the study.\n');
  }

  /* ================================================================
     the final review: what the whole study says about itself
     ================================================================ */
  const SLOTS = [
    { n: 2, key: 'project', es: 'Proyecto y supuestos', en: 'Project and assumptions', msgs: () => Project.validate(state.project) },
    { n: 3, key: 'market', es: 'Mercado e ingresos', en: 'Market and revenue' },
    { n: 4, key: 'budget', es: 'Inversión y costos', en: 'Investment and costs' },
    { n: 5, key: 'statements', es: 'Financiamiento y estados', en: 'Financing and statements' },
    { n: 6, key: 'appraisal', es: 'Evaluación financiera', en: 'Financial appraisal' },
    { n: 7, key: 'risk', es: 'Riesgo', en: 'Risk' },
    { n: 8, key: 'social', es: 'Evaluación social', en: 'Social appraisal' },
    { n: 9, key: 'decisions', es: 'Decisiones', en: 'Decisions' },
  ];

  function review() {
    return SLOTS.map(s => {
      const model = s.key === 'project' ? state.project : state[s.key];
      const msgs = model ? (s.msgs ? s.msgs() : (model.messages || [])) : null;
      const errors = msgs ? msgs.filter(m => m.level === 'error').length : 0;
      const warnings = msgs ? msgs.filter(m => m.level === 'warning').length : 0;
      return { n: s.n, es: s.es, en: s.en, done: !!model, errors, warnings };
    });
  }

  function renderReview() {
    const host = el('b10Review');
    if (!host) return;
    const rows = review();
    const missing = rows.filter(r => !r.done).length;
    const errors = rows.reduce((a, r) => a + r.errors, 0);
    host.innerHTML = `<table class="mini-table"><thead><tr>
      <th>${L2('Bloque', 'Block')}</th><th>${L2('Estado', 'State')}</th>
      <th class="num">${L2('Errores', 'Errors')}</th><th class="num">${L2('Avisos', 'Warnings')}</th></tr></thead><tbody>` +
      rows.map(r => `<tr>
        <td>${r.n} · ${L2(r.es, r.en)}</td>
        <td>${r.done
          ? (r.errors ? `<span class="chip bad">${L2('con errores', 'with errors')}</span>`
            : `<span class="chip p">${L2('listo', 'done')}</span>`)
          : `<span class="chip">${L2('sin datos', 'no data')}</span>`}</td>
        <td class="num">${r.errors || '—'}</td>
        <td class="num">${r.warnings || '—'}</td></tr>`).join('') +
      '</tbody></table>';
    const box = el('b10Messages');
    if (box) {
      clearMessages(box);
      if (errors) {
        showMessage(box, 'error', L2(
          `Hay ${plural(errors, 'error', 'errores')} pendientes en los bloques anteriores. El informe se puede generar de todos modos, pero conviene resolverlos antes de entregarlo.`,
          `There are ${plural(errors, 'error', 'errors')} pending in the previous blocks. The report can be generated anyway, but they are worth solving before handing it in.`));
      }
      if (missing) {
        showMessage(box, 'info', L2(
          `${plural(missing, 'bloque', 'bloques')} sin datos: el informe saldrá sin esas secciones.`,
          `${plural(missing, 'block', 'blocks')} without data: the report will come out without those sections.`));
      }
      if (!errors && !missing) {
        showMessage(box, 'info', L2('El estudio está completo y sin errores: ya se puede entregar.',
          'The study is complete and free of errors: it is ready to hand in.'));
      }
    }
  }

  /* ================================================================
     wiring
     ================================================================ */
  function render() {
    fillFigureList();
    renderStudio();
    renderReview();
  }

  function wire() {
    const on = (id, ev, fn) => { const n = el(id); if (n) n.addEventListener(ev, fn); };
    on('b10Figure', 'change', () => {
      const t = el('b10Title');
      if (t) t.dataset.auto = '1';                 /* a new figure brings its own title back */
      renderStudio();
    });
    ['b10Theme', 'b10Background', 'b10Note'].forEach(id => on(id, 'input', renderStudio));
    ['b10Theme', 'b10Background'].forEach(id => on(id, 'change', renderStudio));
    on('b10Title', 'input', () => {
      const t = el('b10Title');
      if (t) t.dataset.auto = '0';
      renderStudio();
    });
    ['b10Format', 'b10Dpi'].forEach(id => on(id, 'change', updateSizeNote));
    on('b10Download', 'click', downloadFigure);
    on('b10AllFigures', 'click', downloadAllFigures);
    on('b10Open', 'click', () => openReport(false));
    on('b10Print', 'click', () => openReport(true));
    on('b10Html', 'click', downloadReport);
    on('b10Package', 'click', downloadPackage);
    on('b10Refresh', 'click', render);

    ['projectchange', 'marketchange', 'budgetchange', 'statementschange', 'appraisalchange',
      'riskchange', 'socialchange', 'decisionschange', 'projectloaded'].forEach(ev =>
        document.addEventListener(ev, () => { if (el('panel-10')) renderReview(); }));
    /* entering the block re-reads the figures: a block visited in between may
       have drawn one that was not there before */
    document.addEventListener('stepchange', e => { if (e.detail.step === 10) render(); });
    document.addEventListener('langchange', render);
    document.addEventListener('themechange', renderStudio);
  }

  function init() {
    if (!el('panel-10')) return;
    P();
    wire();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Block10 = { render, review, figureFiles, reportOptions, readme };
})();
