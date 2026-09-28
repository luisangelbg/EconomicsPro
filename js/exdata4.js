/* EconomicsPro — example budgets for Block 4.

   Same warning as the series of Block 3: these budgets are ILLUSTRATIVE. The
   items are the ones a real budget has and the amounts are of the right order
   of magnitude for central Mexico in 2026, but they are not quotations. Every
   study has to price its own items, and the app keeps the quantity and the
   unit cost apart precisely so that updating a price is one cell.

   The quantities are written per productive unit (per hectare, per head, per
   processing line), except where the basis says otherwise. */

(function () {

  const B = {
    /* ---------------- avocado orchard, per hectare ---------------- */
    avocado: {
      es: 'Huerta de aguacate', en: 'Avocado orchard',
      note: ['El terreno va con cantidad cero: márcalo solo si el proyecto lo compra.', 'Land is entered with a quantity of zero: fill it in only if the project buys it.'],
      investments: [
        { name: 'Terreno', kind: 'land', qty: 0, unitCost: 150000, year: 0, life: 0, salvagePct: 0, replace: false },
        { name: 'Preparación del terreno y trazo', kind: 'works', qty: 10, unitCost: 8000, year: 0, life: 20, salvagePct: 0, replace: false },
        { name: 'Sistema de riego presurizado', kind: 'works', qty: 10, unitCost: 45000, year: 0, life: 15, salvagePct: 0.05, replace: true },
        { name: 'Planta y establecimiento', kind: 'planting', qty: 10, unitCost: 62000, year: 0, life: 25, salvagePct: 0, replace: false },
        { name: 'Cerco perimetral y caseta', kind: 'works', qty: 10, unitCost: 6000, year: 0, life: 20, salvagePct: 0, replace: false },
        { name: 'Equipo de aspersión y herramienta', kind: 'equipment', qty: 10, unitCost: 4500, year: 0, life: 5, salvagePct: 0.05, replace: true },
        { name: 'Vehículo de trabajo', kind: 'vehicles', qty: 1, unitCost: 280000, year: 0, life: 8, salvagePct: 0.15, replace: true },
      ],
      deferred: [
        { name: 'Estudios y proyecto ejecutivo', amount: 60000, year: 0 },
        { name: 'Permisos, constitución y trámites', amount: 25000, year: 0 },
        { name: 'Capacitación y asistencia técnica inicial', amount: 15000, year: 0 },
      ],
      establishment: [
        { name: 'Jornales de mantenimiento', group: 'labour', base: 'unit', qty: 24, unitCost: 350, variable: true },
        { name: 'Fertilizantes y enmiendas', group: 'inputs', base: 'unit', qty: 1, unitCost: 14000, variable: true },
        { name: 'Control fitosanitario', group: 'inputs', base: 'unit', qty: 1, unitCost: 9000, variable: true },
        { name: 'Energía para riego', group: 'machinery', base: 'unit', qty: 1, unitCost: 6500, variable: true },
        { name: 'Podas y labores mecánicas', group: 'machinery', base: 'unit', qty: 1, unitCost: 5000, variable: true },
      ],
      operating: [
        { name: 'Jornales', group: 'labour', base: 'unit', qty: 30, unitCost: 350, variable: true },
        { name: 'Fertilización', group: 'inputs', base: 'unit', qty: 1, unitCost: 22000, variable: true },
        { name: 'Control fitosanitario', group: 'inputs', base: 'unit', qty: 1, unitCost: 16000, variable: true },
        { name: 'Energía para riego', group: 'machinery', base: 'unit', qty: 1, unitCost: 8000, variable: true },
        { name: 'Labores mecánicas y podas', group: 'machinery', base: 'unit', qty: 1, unitCost: 6000, variable: true },
        { name: 'Cosecha, empaque y flete', group: 'services', base: 'output', qty: 1, unitCost: 2500, variable: true },
      ],
      fixed: [
        { name: 'Administración', amount: 180000 },
        { name: 'Seguro agrícola', amount: 35000 },
        { name: 'Contabilidad y servicios', amount: 24000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 60, wcDaysReceivable: 30, wcDaysPayable: 20 },
    },

    /* ---------------- rain-fed maize, per hectare ---------------- */
    maize: {
      es: 'Maíz de temporal', en: 'Rain-fed maize',
      note: ['El ciclo de caja es largo porque el dinero se adelanta en la siembra y vuelve con la cosecha.', 'The cash cycle is long because the money goes in at sowing and comes back with the harvest.'],
      investments: [
        { name: 'Terreno', kind: 'land', qty: 0, unitCost: 90000, year: 0, life: 0, salvagePct: 0, replace: false },
        { name: 'Preparación inicial del terreno', kind: 'works', qty: 20, unitCost: 2500, year: 0, life: 10, salvagePct: 0, replace: false },
        { name: 'Implementos agrícolas', kind: 'equipment', qty: 1, unitCost: 180000, year: 0, life: 8, salvagePct: 0.1, replace: true },
        { name: 'Bodega y piso de secado', kind: 'works', qty: 1, unitCost: 220000, year: 0, life: 20, salvagePct: 0.1, replace: false },
        { name: 'Herramienta y equipo menor', kind: 'equipment', qty: 20, unitCost: 600, year: 0, life: 5, salvagePct: 0, replace: true },
      ],
      deferred: [
        { name: 'Estudios y gestión del proyecto', amount: 25000, year: 0 },
      ],
      establishment: [],
      operating: [
        { name: 'Semilla', group: 'inputs', base: 'unit', qty: 1, unitCost: 2200, variable: true },
        { name: 'Fertilizante', group: 'inputs', base: 'unit', qty: 1, unitCost: 4200, variable: true },
        { name: 'Herbicidas e insecticidas', group: 'inputs', base: 'unit', qty: 1, unitCost: 1500, variable: true },
        { name: 'Jornales', group: 'labour', base: 'unit', qty: 6, unitCost: 350, variable: true },
        { name: 'Maquila de labores', group: 'machinery', base: 'unit', qty: 1, unitCost: 1000, variable: true },
        { name: 'Cosecha, acarreo y flete', group: 'services', base: 'output', qty: 1, unitCost: 1400, variable: true },
      ],
      fixed: [
        { name: 'Administración y gestión', amount: 30000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 150, wcDaysReceivable: 20, wcDaysPayable: 30 },
    },

    /* ---------------- tomato greenhouse, per hectare ---------------- */
    greenhouse: {
      es: 'Invernadero de jitomate', en: 'Tomato greenhouse',
      note: ['Casi toda la inversión es la estructura, y casi todo el costo son plántula, fertilizantes y jornales.', 'Almost all the investment is the structure, and almost all the cost is seedlings, fertiliser and labour.'],
      investments: [
        { name: 'Estructura y cubierta', kind: 'works', qty: 0.5, unitCost: 3200000, year: 0, life: 15, salvagePct: 0.05, replace: true },
        { name: 'Riego y fertirriego', kind: 'equipment', qty: 0.5, unitCost: 900000, year: 0, life: 10, salvagePct: 0.05, replace: true },
        { name: 'Cabezal, bombeo y pozo', kind: 'equipment', qty: 1, unitCost: 280000, year: 0, life: 10, salvagePct: 0.1, replace: true },
        { name: 'Tanques, obra civil y caminos', kind: 'works', qty: 1, unitCost: 180000, year: 0, life: 20, salvagePct: 0, replace: false },
        { name: 'Equipo de cosecha y empaque', kind: 'equipment', qty: 1, unitCost: 220000, year: 0, life: 8, salvagePct: 0.1, replace: true },
      ],
      deferred: [
        { name: 'Proyecto, estudios y permisos', amount: 120000, year: 0 },
        { name: 'Capacitación y puesta en marcha', amount: 80000, year: 0 },
      ],
      establishment: [],
      operating: [
        { name: 'Plántula injertada', group: 'inputs', base: 'unit', qty: 1, unitCost: 420000, variable: true },
        { name: 'Sustrato y materiales', group: 'inputs', base: 'unit', qty: 1, unitCost: 180000, variable: true },
        { name: 'Fertilizantes y solución nutritiva', group: 'inputs', base: 'unit', qty: 1, unitCost: 520000, variable: true },
        { name: 'Agroquímicos y control biológico', group: 'inputs', base: 'unit', qty: 1, unitCost: 260000, variable: true },
        { name: 'Jornales', group: 'labour', base: 'unit', qty: 1200, unitCost: 350, variable: true },
        { name: 'Energía eléctrica y agua', group: 'machinery', base: 'unit', qty: 1, unitCost: 180000, variable: true },
        { name: 'Empaque y flete', group: 'services', base: 'output', qty: 1, unitCost: 4000, variable: true },
      ],
      fixed: [
        { name: 'Técnico responsable', amount: 320000 },
        { name: 'Administración y seguros', amount: 100000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 45, wcDaysReceivable: 30, wcDaysPayable: 25 },
    },

    /* ---------------- cattle feedlot, per head ---------------- */
    feedlot: {
      es: 'Engorda de bovinos', en: 'Cattle feedlot',
      note: ['El ingreso del ejemplo es el peso ganado, así que la compra del becerro no entra como costo; si evalúas la operación completa, agrégala y cambia el ingreso.',
        'In this example the revenue is the weight gained, so the purchase of the calf is not a cost; if you appraise the whole operation, add it and change the revenue.'],
      investments: [
        { name: 'Corrales, comederos y sombras', kind: 'works', qty: 200, unitCost: 3200, year: 0, life: 15, salvagePct: 0.05, replace: true },
        { name: 'Bodega y molino de alimentos', kind: 'works', qty: 1, unitCost: 280000, year: 0, life: 15, salvagePct: 0.1, replace: true },
        { name: 'Báscula y manga de manejo', kind: 'equipment', qty: 1, unitCost: 180000, year: 0, life: 10, salvagePct: 0.1, replace: true },
        { name: 'Equipo menor y herramienta', kind: 'equipment', qty: 1, unitCost: 60000, year: 0, life: 5, salvagePct: 0, replace: true },
      ],
      deferred: [
        { name: 'Estudios, permisos y sanidad', amount: 45000, year: 0 },
      ],
      establishment: [],
      operating: [
        { name: 'Alimentación', group: 'inputs', base: 'unit', qty: 1, unitCost: 9500, variable: true },
        { name: 'Sanidad y medicamentos', group: 'inputs', base: 'unit', qty: 1, unitCost: 600, variable: true },
        { name: 'Jornales y manejo', group: 'labour', base: 'unit', qty: 4, unitCost: 350, variable: true },
        { name: 'Energía y agua', group: 'machinery', base: 'unit', qty: 1, unitCost: 500, variable: true },
        { name: 'Fletes y comisiones de venta', group: 'services', base: 'output', qty: 1, unitCost: 3000, variable: true },
      ],
      fixed: [
        { name: 'Administración', amount: 120000 },
        { name: 'Asesoría zootécnica', amount: 60000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 120, wcDaysReceivable: 15, wcDaysPayable: 30 },
    },

    /* ---------------- cheese plant, per processing line ---------------- */
    dairy: {
      es: 'Planta de quesos', en: 'Cheese plant',
      note: ['La leche es el costo dominante: está escrita como litros por línea y su precio, para que actualizarla sea una celda.', 'Milk is the dominant cost: it is written as litres per line and its price, so updating it is one cell.'],
      investments: [
        { name: 'Obra civil de la planta', kind: 'works', qty: 1, unitCost: 2400000, year: 0, life: 20, salvagePct: 0.1, replace: false },
        { name: 'Equipo de proceso (tinas, prensas, pasteurizador)', kind: 'machinery', qty: 8, unitCost: 420000, year: 0, life: 10, salvagePct: 0.1, replace: true },
        { name: 'Cámara fría', kind: 'equipment', qty: 1, unitCost: 680000, year: 0, life: 10, salvagePct: 0.1, replace: true },
        { name: 'Vehículo de reparto refrigerado', kind: 'vehicles', qty: 1, unitCost: 420000, year: 0, life: 8, salvagePct: 0.15, replace: true },
        { name: 'Laboratorio y utensilios', kind: 'equipment', qty: 1, unitCost: 180000, year: 0, life: 5, salvagePct: 0, replace: true },
      ],
      deferred: [
        { name: 'Proyecto, permisos y registro sanitario', amount: 180000, year: 0 },
        { name: 'Marca, etiquetado y puesta en marcha', amount: 120000, year: 0 },
      ],
      establishment: [],
      operating: [
        { name: 'Leche', group: 'inputs', base: 'unit', qty: 350000, unitCost: 9.5, variable: true },
        { name: 'Sal, cuajo, cultivos y empaque', group: 'inputs', base: 'unit', qty: 1, unitCost: 95000, variable: true },
        { name: 'Energía, gas y agua', group: 'machinery', base: 'unit', qty: 1, unitCost: 120000, variable: true },
        { name: 'Mano de obra de proceso', group: 'labour', base: 'unit', qty: 1, unitCost: 180000, variable: true },
        { name: 'Flete y comisión de venta', group: 'services', base: 'output', qty: 1, unitCost: 1800, variable: true },
      ],
      fixed: [
        { name: 'Administración y ventas', amount: 600000 },
        { name: 'Mantenimiento y seguros', amount: 180000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 20, wcDaysReceivable: 30, wcDaysPayable: 15 },
    },

    /* ---------------- irrigation scheme, per hectare ---------------- */
    irrigation: {
      es: 'Riego tecnificado', en: 'Irrigation scheme',
      note: ['Proyecto incremental: solo entran la inversión y los costos que el riego agrega sobre la situación sin proyecto.', 'An incremental project: only the investment and the costs that irrigation adds over the situation without the project are counted.'],
      investments: [
        { name: 'Obra de captación y almacenamiento', kind: 'works', qty: 1, unitCost: 240000, year: 0, life: 20, salvagePct: 0, replace: false },
        { name: 'Equipo de bombeo', kind: 'machinery', qty: 1, unitCost: 320000, year: 0, life: 12, salvagePct: 0.1, replace: true },
        { name: 'Línea de conducción y goteo', kind: 'works', qty: 40, unitCost: 48000, year: 0, life: 12, salvagePct: 0.05, replace: true },
        { name: 'Automatización y medición', kind: 'equipment', qty: 1, unitCost: 180000, year: 0, life: 8, salvagePct: 0.1, replace: true },
      ],
      deferred: [
        { name: 'Proyecto ejecutivo y concesión de agua', amount: 90000, year: 0 },
      ],
      establishment: [],
      operating: [
        { name: 'Energía eléctrica del bombeo', group: 'machinery', base: 'unit', qty: 1, unitCost: 3200, variable: true },
        { name: 'Mantenimiento del sistema', group: 'services', base: 'unit', qty: 1, unitCost: 900, variable: true },
        { name: 'Jornales de riego', group: 'labour', base: 'unit', qty: 1, unitCost: 400, variable: true },
        { name: 'Cosecha y flete del rendimiento adicional', group: 'services', base: 'output', qty: 1, unitCost: 900, variable: true },
      ],
      fixed: [
        { name: 'Administración del módulo', amount: 40000 },
      ],
      wc: { wcMethod: 'cycle', wcDaysInventory: 60, wcDaysReceivable: 20, wcDaysPayable: 20 },
    },
  };


  /* the rows the grids of the block expect, as strings.
     The kind, the group and the basis are written as words, in the language
     that is on screen: the app reads them back with Budget.parseKind and its
     sisters, so the user can type "maquinaria" or "machinery" or "tractor". */
  const str = v => (v == null ? '' : String(v));
  const kindWord = k => T(Budget.KINDS[k].es, Budget.KINDS[k].en);
  const groupWord = g => T(Budget.GROUPS[g].es, Budget.GROUPS[g].en);
  const baseWord = b => ({
    unit: T('por unidad', 'per unit'), output: T('por tonelada', 'per tonne'), total: T('total al año', 'lump sum a year'),
  })[b] || T('por unidad', 'per unit');
  function gridsFor(key) {
    const b = B[key] || B.maize;
    return {
      investments: b.investments.map(i => ({
        name: i.name, kind: kindWord(i.kind), qty: str(i.qty), unitCost: str(i.unitCost),
        year: str(i.year), life: str(i.life), salvagePct: str(i.salvagePct * 100), replace: i.replace === false ? T('no', 'no') : T('sí', 'yes'),
      })),
      deferred: b.deferred.map(d => ({ name: d.name, amount: str(d.amount), year: str(d.year) })),
      establishment: b.establishment.map(c => ({ name: c.name, group: groupWord(c.group), base: baseWord(c.base), qty: str(c.qty), unitCost: str(c.unitCost) })),
      operating: b.operating.map(c => ({ name: c.name, group: groupWord(c.group), base: baseWord(c.base), qty: str(c.qty), unitCost: str(c.unitCost) })),
      fixed: b.fixed.map(f => ({ name: f.name, amount: str(f.amount) })),
      wc: b.wc,
      note: b.note,
    };
  }

  window.ExData4 = { BUDGETS: B, gridsFor };
})();
