/* EconomicsPro — getting numbers into the app.

   Two ways, and both end in the same place: a small editable grid of inputs.

   · Typing, with the grid behaving like a spreadsheet: paste a block copied
     from Excel into any cell and it spreads over the rows and columns from
     there, arrow keys and Enter move the cursor.
   · A file: .csv, .txt or .tsv, read right here. A workbook (.xlsx, .ods) is
     not read: the app carries no libraries, and saving as .csv —or simply
     copying the block and pasting it— does the same in one step.

   Everything is text until the last moment: the numbers are only parsed when
   the block asks for them, with parseNum from core.js, which understands
   "1,250.50", "$1 250.50" and "(400)". */

(function () {

  /* ================================================================
     reading text
     ================================================================ */

  /* Splits a pasted or read text into rows and cells. The separator is worked
     out from the first lines: a tab (what Excel puts on the clipboard), a
     semicolon (Spanish-language spreadsheets) or a comma. */
  function detectSeparator(text) {
    const line = text.split(/\r?\n/).find(l => l.trim().length) || '';
    const counts = { '\t': (line.match(/\t/g) || []).length, ';': (line.match(/;/g) || []).length, ',': (line.match(/,/g) || []).length };
    if (counts['\t'] >= 1) return '\t';
    if (counts[';'] > counts[',']) return ';';
    if (counts[','] >= 1) return ',';
    return '\t';
  }

  /* A CSV parser that respects quotes, so a cell with a comma inside survives. */
  function parseDelimited(text, sep) {
    const s = sep || detectSeparator(text);
    const rows = [];
    let row = [], cell = '', quoted = false;
    const t = String(text).replace(/\r\n?/g, '\n');
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (quoted) {
        if (c === '"') {
          if (t[i + 1] === '"') { cell += '"'; i++; }
          else quoted = false;
        } else cell += c;
      } else if (c === '"') quoted = true;
      else if (c === s) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell);
    rows.push(row);
    /* trailing empty lines are not data */
    while (rows.length && rows[rows.length - 1].every(v => !String(v).trim())) rows.pop();
    return rows;
  }

  /* Reads a file and hands back a table of strings.

     Only text is read —.csv, .tsv or anything separated by tabs or semicolons—
     which is what a spreadsheet writes with "save as CSV". A workbook is a
     compressed format that would need a library of its own, and the app keeps
     no dependencies; pasting the block straight from the spreadsheet does the
     same job in one step and is what the grid is built for. */
  function readFile(file, done, fail) {
    const name = (file.name || '').toLowerCase();
    if (/\.(xlsx|xlsm|xlsb|xls|ods)$/.test(name)) {
      fail && fail(T('Ese archivo es un libro de cálculo. Guárdalo como .csv, o abre la hoja, copia el bloque y pégalo directamente en la tabla.',
        'That file is a spreadsheet workbook. Save it as .csv, or open the sheet, copy the block and paste it straight into the grid.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => fail && fail(T('No se pudo leer el archivo.', 'The file could not be read.'));
    reader.onload = () => {
      try {
        done(parseDelimited(reader.result), file.name);
      } catch (e) {
        fail && fail(T('El archivo no se pudo interpretar como una tabla.', 'The file could not be read as a table.'));
      }
    };
    reader.readAsText(file);
  }

  /* Drops a header row when the first row is clearly labels and not numbers. */
  function looksLikeHeader(row) {
    const nums = row.filter(v => parseNum(v) != null).length;
    return nums <= Math.floor(row.length / 2);
  }

  /* ================================================================
     the editable grid
     ================================================================ */

  /* Builds a table of inputs inside `host`.
       cols   [{key, es, en, width?, kind?}]
       rows   how many rows to draw
       values array of objects, one per row
       onchange(values) fires on every edit or paste
     The grid is deliberately small: it is for the ten or fifteen years of a
     price series or the dozen items of a budget, not for a database. */
  function grid(host, opt) {
    if (!host) return null;
    const cols = opt.cols;
    let values = (opt.values || []).map(v => Object.assign({}, v));
    const api = {};

    function cellAt(r, c) { return host.querySelector(`input[data-r="${r}"][data-c="${c}"]`); }

    function draw() {
      const n = Math.max(opt.rows || 0, values.length);
      let html = '<table class="grid-table"><thead><tr>' +
        (opt.rowLabel ? `<th class="grid-rh">${L2(opt.rowLabel[0], opt.rowLabel[1])}</th>` : '') +
        cols.map(c => `<th${c.wide ? ' class="grid-wide"' : c.med ? ' class="grid-med"' : ''}>${L2(c.es, c.en)}</th>`).join('') + '</tr></thead><tbody>';
      for (let r = 0; r < n; r++) {
        const v = values[r] || {};
        html += '<tr>' + (opt.rowLabel ? `<td class="grid-rh">${opt.rowLabelOf ? opt.rowLabelOf(r, v) : r + 1}</td>` : '');
        html += cols.map((c, ci) => {
          const raw = v[c.key];
          return `<td${c.wide ? ' class="grid-wide"' : c.med ? ' class="grid-med"' : ''}><input type="text" inputmode="decimal" data-r="${r}" data-c="${ci}" value="${esc(raw == null ? '' : raw)}"${c.ph ? ` placeholder="${esc(c.ph)}"` : ''}></td>`;
        }).join('');
        html += '</tr>';
      }
      host.innerHTML = html + '</tbody></table>';
    }

    function collect() {
      const n = host.querySelectorAll('tbody tr').length;
      const out = [];
      for (let r = 0; r < n; r++) {
        const row = {};
        cols.forEach((c, ci) => { const inp = cellAt(r, ci); row[c.key] = inp ? inp.value : ''; });
        out.push(row);
      }
      values = out;
      return out;
    }

    function emit() { if (opt.onchange) opt.onchange(collect()); }

    host.addEventListener('input', e => { if (e.target.matches('input')) emit(); });

    /* paste a block from a spreadsheet: it spreads down and to the right from
       the cell that has the cursor, adding rows if they are needed */
    host.addEventListener('paste', e => {
      const inp = e.target.closest('input');
      if (!inp) return;
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text || !/[\t\n;,]/.test(text)) return;          /* a single value pastes normally */
      e.preventDefault();
      const block = parseDelimited(text);
      const r0 = +inp.dataset.r, c0 = +inp.dataset.c;
      const need = r0 + block.length;
      if (need > host.querySelectorAll('tbody tr').length) {
        collect();
        while (values.length < need) values.push({});
        draw();
      }
      block.forEach((line, i) => line.forEach((cell, j) => {
        const target = cellAt(r0 + i, c0 + j);
        if (target) target.value = String(cell).trim();
      }));
      emit();
    });

    /* arrows and Enter move like a spreadsheet */
    host.addEventListener('keydown', e => {
      const inp = e.target.closest('input');
      if (!inp) return;
      const r = +inp.dataset.r, c = +inp.dataset.c;
      let to = null;
      if (e.key === 'ArrowDown' || e.key === 'Enter') to = cellAt(r + 1, c);
      else if (e.key === 'ArrowUp') to = cellAt(r - 1, c);
      else if (e.key === 'Tab' && !e.shiftKey && c === cols.length - 1) to = cellAt(r + 1, 0);
      if (to) { e.preventDefault(); to.focus(); to.select(); }
    });

    api.values = () => collect();
    api.set = v => { values = (v || []).map(x => Object.assign({}, x)); draw(); };
    api.addRows = k => { collect(); for (let i = 0; i < (k || 1); i++) values.push({}); draw(); emit(); };
    api.removeEmpty = () => {
      collect();
      values = values.filter(v => cols.some(c => String(v[c.key] || '').trim() !== ''));
      draw(); emit();
    };
    api.redraw = draw;
    draw();
    return api;
  }

  /* Turns the strings of a grid into numbers, dropping the rows that are
     empty and reporting the ones that could not be read. */
  function numericRows(rows, keys) {
    const out = [], bad = [];
    rows.forEach((row, i) => {
      const empty = keys.every(k => String(row[k] == null ? '' : row[k]).trim() === '');
      if (empty) return;
      const parsed = {};
      let ok = true;
      keys.forEach(k => {
        const raw = String(row[k] == null ? '' : row[k]).trim();
        if (raw === '') { parsed[k] = null; return; }
        const v = parseNum(raw);
        if (v == null) { ok = false; parsed[k] = null; } else parsed[k] = v;
      });
      if (!ok) bad.push(i + 1);
      out.push(parsed);
    });
    return { rows: out, bad };
  }

  window.Import = { detectSeparator, parseDelimited, readFile, looksLikeHeader, grid, numericRows };
})();
