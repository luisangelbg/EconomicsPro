/* EconomicsPro — Block 4: investment, costs and working capital.

   This is the block that turns a project into money going out. Three things
   happen here that a generic spreadsheet does badly and that decide the result
   of many agricultural projects:

   · REPLACEMENT. An asset that lives eight years inside a twenty-year horizon
     has to be bought again, twice. The app builds the replacement schedule by
     itself, depreciates each purchase on its own and warns when a horizon is
     being financed with an asset that will no longer exist.
   · THE BASIS OF EACH COST. Some costs go with the area (weeding a hectare),
     some go with what is harvested (picking and hauling a tonne) and some are
     a lump sum for the whole project (the accountant). Mixing them is how a
     budget ends up wrong the moment the yield changes, so every item states
     its basis and the app scales it accordingly.
   · WORKING CAPITAL. It is an investment, not a cost: the money advanced for
     inputs and wages before the harvest pays. It grows when production grows,
     it is put in the year BEFORE it is needed, and it comes back whole at the
     end of the horizon. */

(function () {

  /* what an investment item can be; land is the one that never depreciates */
  const KINDS = {
    land: { es: 'Terreno', en: 'Land', depreciates: false, life: 0 },
    works: { es: 'Obra civil e instalaciones', en: 'Civil works and installations', depreciates: true, life: 20 },
    planting: { es: 'Establecimiento de la plantación', en: 'Establishment of the plantation', depreciates: true, life: 20 },
    machinery: { es: 'Maquinaria', en: 'Machinery', depreciates: true, life: 10 },
    equipment: { es: 'Equipo y herramienta', en: 'Equipment and tools', depreciates: true, life: 5 },
    vehicles: { es: 'Vehículos', en: 'Vehicles', depreciates: true, life: 8 },
    livestock: { es: 'Pie de cría y semovientes', en: 'Breeding stock', depreciates: true, life: 6 },
    other: { es: 'Otros activos', en: 'Other assets', depreciates: true, life: 10 },
  };

  /* how a cost item scales */
  const BASES = {
    unit: { es: 'por unidad de producción (ha, cabeza…)', en: 'per productive unit (ha, head…)' },
    output: { es: 'por tonelada producida', en: 'per tonne produced' },
    total: { es: 'monto total al año', en: 'lump sum a year' },
  };

  /* the groups a cost budget is reported in */
  const GROUPS = {
    labour: { es: 'Mano de obra', en: 'Labour' },
    inputs: { es: 'Insumos', en: 'Inputs' },
    machinery: { es: 'Maquinaria y energía', en: 'Machinery and energy' },
    services: { es: 'Servicios y fletes', en: 'Services and freight' },
    admin: { es: 'Administración', en: 'Administration' },
    other: { es: 'Otros', en: 'Other' },
  };

  /* ================================================================
     0 · reading what the user wrote in a cell
     ================================================================
     The kind of an asset, the group of a cost and its basis are typed by hand,
     in Spanish or in English, in whatever words the person uses in their own
     budget. Rather than forcing internal keys on them, the app recognises the
     usual words and falls back to a sensible default. */
  const strip = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const KIND_WORDS = {
    land: ['land', 'terreno', 'tierra', 'predio', 'parcela'],
    works: ['works', 'obra', 'obra civil', 'construccion', 'instalacion', 'instalaciones', 'infraestructura', 'nave', 'bodega', 'corral', 'invernadero', 'estructura', 'cerco', 'riego'],
    planting: ['planting', 'plantacion', 'establecimiento', 'huerta', 'siembra', 'planta'],
    machinery: ['machinery', 'maquinaria', 'tractor', 'motor', 'bomba', 'bombeo', 'equipo de proceso'],
    equipment: ['equipment', 'equipo', 'herramienta', 'herramientas', 'mobiliario', 'computo', 'tools'],
    vehicles: ['vehicles', 'vehiculo', 'vehiculos', 'camioneta', 'camion', 'transporte'],
    livestock: ['livestock', 'ganado', 'semoviente', 'semovientes', 'pie de cria', 'vientres', 'animales'],
    other: ['other', 'otros', 'otro'],
  };
  const GROUP_WORDS = {
    labour: ['labour', 'labor', 'mano de obra', 'jornal', 'jornales', 'trabajo', 'sueldos'],
    inputs: ['inputs', 'insumo', 'insumos', 'materia prima', 'materiales', 'semilla', 'fertilizante', 'alimento'],
    machinery: ['machinery', 'maquinaria', 'energia', 'energy', 'combustible', 'diesel', 'electricidad'],
    services: ['services', 'servicio', 'servicios', 'flete', 'fletes', 'freight', 'maquila', 'cosecha'],
    admin: ['admin', 'administracion', 'administration', 'oficina', 'gestion'],
    other: ['other', 'otros', 'otro'],
  };
  const BASE_WORDS = {
    unit: ['unit', 'unidad', 'por unidad', 'ha', 'hectarea', 'cabeza', 'linea', 'por ha'],
    output: ['output', 'tonelada', 'por tonelada', 'produccion', 'tonne', 'ton', 'kg', 'volumen'],
    total: ['total', 'anual', 'monto total', 'lump', 'al ano', 'fijo'],
  };
  function matchWord(value, table, fallback) {
    const s = strip(value);
    if (!s) return fallback;
    if (table[s]) return s;
    /* the longest matching word wins, so "equipo de proceso" beats "equipo" */
    let best = null, bestLen = 0;
    for (const key in table) {
      table[key].forEach(w => {
        if ((s === w || s.includes(w)) && w.length > bestLen) { best = key; bestLen = w.length; }
      });
    }
    return best || fallback;
  }
  const parseKind = v => matchWord(v, KIND_WORDS, 'other');
  const parseGroup = v => matchWord(v, GROUP_WORDS, 'other');
  const parseBase = v => matchWord(v, BASE_WORDS, 'unit');
  /* "sí", "yes", "1" mean replace; "no", "false", "0" mean do not */
  function parseYes(v, dflt) {
    const s = strip(v);
    if (!s) return dflt;
    if (/^(no|n|false|0)$/.test(s)) return false;
    if (/^(si|s|yes|y|true|1)$/.test(s)) return true;
    return dflt;
  }

  /* ================================================================
     1 · investment, replacements and depreciation
     ================================================================ */

  /* Every purchase the project makes over the horizon: what was planned, plus
     the replacements of the assets whose life ends before the horizon does.
     A replacement is only bought if there is at least one year left to use
     it — buying a tractor in the last year of the appraisal would be an
     accounting trick, not a decision. */
  function purchases(items, horizon) {
    const out = [];
    (items || []).forEach((it, i) => {
      const amount = (Number(it.qty) || 0) * (Number(it.unitCost) || 0);
      if (!(amount > 0)) return;
      const kind = parseKind(it.kind);
      const life = Math.max(0, Math.round(Number(it.life) || KINDS[kind].life));
      const year = Math.max(0, Math.round(Number(it.year) || 0));
      const salvage = Math.min(0.95, Math.max(0, Number(it.salvagePct) || 0));
      out.push({ ref: i, name: it.name, kind, amount, year, life, salvage, method: it.method || 'sl', replacement: 0 });
      if (parseYes(it.replace, true) && KINDS[kind].depreciates && life > 0) {
        let k = 1, y = year + life;
        while (y <= horizon - 1) {
          out.push({ ref: i, name: it.name, kind, amount, year: y, life, salvage, method: it.method || 'sl', replacement: k });
          k++; y = year + k * life;
        }
      }
    });
    return out;
  }

  /* Depreciation year by year, one schedule per purchase, and the book value
     left when the horizon ends: that is what the project can still sell. */
  function depreciation(buys, horizon) {
    const byYear = new Array(horizon + 1).fill(0);
    const detail = [];
    let bookLeft = 0, landValue = 0;
    buys.forEach(b => {
      if (!KINDS[b.kind].depreciates || b.life <= 0) {
        if (b.kind === 'land') landValue += b.amount;
        else bookLeft += b.amount;                       /* an asset that is not depreciated keeps its value */
        return;
      }
      const sched = Fin.depreciate({ cost: b.amount, salvage: b.amount * b.salvage, life: b.life, method: b.method });
      let used = 0;
      sched.rows.forEach(row => {
        const t = b.year + row.t;                        /* it starts depreciating the year after it is bought */
        if (t <= horizon) { byYear[t] += row.depreciation; used += row.depreciation; }
      });
      bookLeft += b.amount - used;
      detail.push({ name: b.name, kind: b.kind, year: b.year, amount: b.amount, life: b.life, replacement: b.replacement, taken: used, book: b.amount - used });
    });
    return { byYear, detail, bookValue: bookLeft, landValue };
  }

  /* Pre-operating expenses (studies, permits, training, start-up) are not an
     asset that wears out: they are amortised over a few years. */
  function amortisation(deferred, horizon, life) {
    const byYear = new Array(horizon + 1).fill(0);
    let total = 0, left = 0;
    const n = Math.max(1, Math.round(life || 5));
    (deferred || []).forEach(d => {
      const amount = Number(d.amount) || 0;
      if (!(amount > 0)) return;
      total += amount;
      const year = Math.max(0, Math.round(Number(d.year) || 0));
      const perYear = amount / n;
      let taken = 0;
      for (let k = 1; k <= n; k++) {
        const t = year + k;
        if (t <= horizon) { byYear[t] += perYear; taken += perYear; }
      }
      left += amount - taken;
    });
    return { byYear, total, notAmortised: left };
  }

  /* ================================================================
     2 · the cost budgets
     ================================================================ */

  /* The amount an item costs in a given year, according to its basis. */
  function itemAmount(item, ctx) {
    const qty = Number(item.qty) || 0;
    const unitCost = Number(item.unitCost) || 0;
    const base = parseBase(item.base);
    if (base === 'total') return qty > 0 ? qty * unitCost : unitCost;
    if (base === 'output') return qty * unitCost * (ctx.production || 0);
    return qty * unitCost * (ctx.scale || 0);
  }

  /* The cost of every year of the horizon. While the plantation grows, the
     establishment budget applies; once it bears, the operating budget does.
     Items whose basis is the tonne follow production by themselves, which is
     what makes a budget survive a change of yield. */
  function costs(o) {
    const horizon = Math.max(1, Math.round(o.horizon || 1));
    const scale = Number(o.scale) || 0;
    const production = o.production || [];
    const gestation = Math.max(0, Math.round(Number(o.gestation) || 0));
    const rows = [];
    for (let t = 1; t <= horizon; t++) {
      const ctx = { scale, production: production[t - 1] || 0 };
      const growing = t <= gestation;
      const list = growing ? (o.establishment || []) : (o.operating || []);
      let variable = 0, fixedFromList = 0;
      const byGroup = {};
      const byBase = { unit: 0, output: 0, total: 0 };
      list.forEach(item => {
        const amount = itemAmount(item, ctx);
        if (!(amount > 0)) return;
        const g = parseGroup(item.group);
        byGroup[g] = (byGroup[g] || 0) + amount;
        byBase[parseBase(item.base)] += amount;
        if (item.variable === false) fixedFromList += amount; else variable += amount;
      });
      const fixedAnnual = (o.fixed || []).reduce((a, f) => a + (Number(f.amount) || 0), 0);
      const fixed = fixedFromList + fixedAnnual;
      byBase.total += fixedAnnual;
      rows.push({
        t, growing, variable, fixed, byGroup, byBase,
        cash: variable + fixed,                       /* what actually leaves the bank */
        production: ctx.production,
        perUnit: scale > 0 ? (variable + fixed) / scale : null,
        perOutput: ctx.production > 0 ? (variable + fixed) / ctx.production : null,
        /* Break-even needs a different cut from the accounting one: only what
           follows the volume sold is truly variable. A weeding per hectare does
           not change when the yield does, so it belongs with the fixed costs of
           the break-even, however "variable" it looks in the budget. */
        volumeCost: byBase.output,
        capacityCost: byBase.unit + byBase.total,
        unitVariable: ctx.production > 0 ? byBase.output / ctx.production : 0,
      });
    }
    return rows;
  }

  /* ================================================================
     3 · working capital
     ================================================================ */

  /* How much money has to be standing in front of the project so it can work.
     Three ways of stating it, all used in the literature:
       'cycle'  the cash cycle: days of inventory plus days of credit given to
                buyers, less the days of credit the suppliers give
       'months' a number of months of disbursable cost
       'pct'    a share of the annual disbursable cost
     The investment of a year is the INCREASE over the year before, and it is
     made one year earlier, because the money has to be there before the cycle
     starts. Everything accumulated comes back in the last year. */
  function workingCapital(costRows, o) {
    const horizon = costRows.length;
    const method = o.method || 'cycle';
    const days = method === 'cycle'
      ? Math.max(0, (Number(o.daysInventory) || 0) + (Number(o.daysReceivable) || 0) - (Number(o.daysPayable) || 0))
      : method === 'months' ? (Number(o.months) || 0) * 30.4167 : null;
    const need = costRows.map(r => {
      if (method === 'pct') return r.cash * (Number(o.pct) || 0);
      return r.cash * (days / 365);
    });
    const invest = new Array(horizon + 1).fill(0);
    let prev = 0;
    need.forEach((v, i) => {
      const t = i + 1;                                  /* the need of year t */
      const delta = v - prev;
      if (delta > 0) invest[t - 1] += delta;            /* put in the year before */
      prev = v;
    });
    const accumulated = need.length ? Math.max(...need) : 0;
    return { need, invest, days, accumulated, recovered: prev };
  }

  /* ================================================================
     4 · everything together
     ================================================================ */

  function build(b, p, market) {
    const horizon = Math.max(1, Math.round(Number(p.horizon) || 1));
    const scale = Number(p.scale) || 0;
    const production = (market && market.prog ? market.prog.rows : []).map(r => r.production);

    const buys = purchases(b.investments, horizon);
    const dep = depreciation(buys, horizon);
    const amo = amortisation(b.deferred, horizon, b.deferredLife);

    const costRows = costs({
      horizon, scale, production, gestation: p.gestation,
      establishment: b.establishment, operating: b.operating, fixed: b.fixed,
    });
    const wc = workingCapital(costRows, {
      method: b.wcMethod, daysInventory: b.wcDaysInventory, daysReceivable: b.wcDaysReceivable,
      daysPayable: b.wcDaysPayable, months: b.wcMonths, pct: b.wcPct,
    });

    /* the calendar of everything that has to be paid, year by year */
    const schedule = [];
    for (let t = 0; t <= horizon; t++) {
      const fixedInv = buys.filter(x => x.year === t && !x.replacement).reduce((a, x) => a + x.amount, 0);
      const repl = buys.filter(x => x.year === t && x.replacement).reduce((a, x) => a + x.amount, 0);
      const def = (b.deferred || []).filter(d => Math.round(Number(d.year) || 0) === t).reduce((a, d) => a + (Number(d.amount) || 0), 0);
      const wcInv = wc.invest[t] || 0;
      schedule.push({ t, fixed: fixedInv, replacement: repl, deferred: def, workingCapital: wcInv, total: fixedInv + repl + def + wcInv });
    }

    /* what is left to sell when the horizon ends */
    const salvage = {
      land: dep.landValue,
      assets: dep.bookValue,
      workingCapital: wc.recovered,
      deferred: amo.notAmortised,
      total: dep.landValue + dep.bookValue + wc.recovered,
    };

    const investmentTotal = buys.filter(x => !x.replacement).reduce((a, x) => a + x.amount, 0);
    const replacementTotal = buys.filter(x => x.replacement).reduce((a, x) => a + x.amount, 0);
    const atFull = costRows.find(r => !r.growing && r.production > 0 && r.production >= Math.max(...costRows.map(x => x.production)) * 0.999) || costRows[costRows.length - 1];

    const byKind = {};
    buys.filter(x => !x.replacement).forEach(x => { byKind[x.kind] = (byKind[x.kind] || 0) + x.amount; });

    const summary = {
      fixedInvestment: investmentTotal,
      byKind,
      deferred: amo.total,
      workingCapital: wc.need.length ? wc.need[0] : 0,
      workingCapitalPeak: wc.accumulated,
      initial: investmentTotal + amo.total + (wc.invest[0] || 0),
      replacements: replacementTotal,
      costAtFull: atFull ? atFull.cash : 0,
      perUnitAtFull: atFull ? atFull.perUnit : null,
      perOutputAtFull: atFull ? atFull.perOutput : null,
      variableShare: atFull && atFull.cash > 0 ? atFull.variable / atFull.cash : null,
      depreciationAtFull: atFull ? dep.byYear[atFull.t] + amo.byYear[atFull.t] : 0,
    };

    const model = {
      buys, depreciation: dep, amortisation: amo, costs: costRows, wc, schedule, salvage, summary,
      horizon, production, fixedList: b.fixed || [],
    };
    model.messages = validate(model, b, p, market);
    return model;
  }

  /* ================================================================
     5 · coherence
     ================================================================ */

  function validate(m, b, p, market) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });

    if (m.summary.fixedInvestment <= 0 && m.summary.deferred <= 0) {
      add('error', 'El proyecto no tiene ninguna inversión: captura al menos una partida.', 'The project has no investment at all: enter at least one item.');
    }
    if (!m.costs.some(r => r.cash > 0)) {
      add('error', 'No hay costos de producción: sin ellos el proyecto parecerá rentable por construcción.',
        'There are no production costs: without them the project will look profitable by construction.');
    }
    /* assets that will not reach the end of the horizon */
    const shortLived = (b.investments || []).filter(it => {
      const kind = parseKind(it.kind);
      const life = Math.round(Number(it.life) || KINDS[kind].life);
      const amount = (Number(it.qty) || 0) * (Number(it.unitCost) || 0);
      return amount > 0 && KINDS[kind].depreciates && life > 0 && life < m.horizon && !parseYes(it.replace, true);
    });
    if (shortLived.length) {
      add('warning', `${shortLived.length} activo(s) terminan su vida útil antes del horizonte y no están marcados para reposición: el proyecto seguiría produciendo con equipo que ya no existe.`,
        `${shortLived.length} asset(s) reach the end of their life before the horizon and are not marked for replacement: the project would go on producing with equipment that no longer exists.`);
    }
    if (m.summary.replacements > 0) {
      add('info', `El calendario incluye ${fmtMoney(m.summary.replacements, 0)} de reposiciones durante el horizonte; cada compra se deprecia por separado.`,
        `The schedule includes ${fmtMoney(m.summary.replacements, 0)} of replacements over the horizon; each purchase is depreciated on its own.`);
    }
    /* land that someone tried to depreciate */
    if ((b.investments || []).some(it => parseKind(it.kind) === 'land' && Number(it.life) > 0)) {
      add('info', 'El terreno no se deprecia: conserva su valor y se recupera completo al final del horizonte.',
        'Land is not depreciated: it keeps its value and comes back whole at the end of the horizon.');
    }
    /* costs per tonne with no production */
    const outputItems = (b.operating || []).filter(i => i.base === 'output' && (Number(i.qty) || 0) * (Number(i.unitCost) || 0) > 0);
    if (outputItems.length && !m.production.some(v => v > 0)) {
      add('warning', 'Hay costos por tonelada producida pero el Bloque 3 no reporta producción: revisa el programa de ventas.',
        'There are costs per tonne produced but Block 3 reports no production: check the sales programme.');
    }
    if (!market || !market.prog || !market.prog.rows.length) {
      add('warning', 'Todavía no hay programa de ventas del Bloque 3, así que los costos por tonelada valen cero.',
        'There is no sales programme from Block 3 yet, so the costs per tonne come out as zero.');
    }
    /* working capital */
    if (m.wc.days != null && m.wc.days > 365) {
      add('warning', `El ciclo de caja es de ${fmtNum(m.wc.days, 0)} días, más de un año: revisa los días de inventario y de cobranza.`,
        `The cash cycle is ${fmtNum(m.wc.days, 0)} days, more than a year: check the days of inventory and of collection.`);
    }
    if (m.wc.days === 0 && (b.wcMethod || 'cycle') === 'cycle') {
      add('warning', 'El ciclo de caja quedó en cero: el proyecto estaría produciendo sin adelantar dinero, lo que casi nunca ocurre en el campo.',
        'The cash cycle came out as zero: the project would be producing without advancing any money, which almost never happens in farming.');
    }
    if (m.summary.workingCapital > m.summary.fixedInvestment && m.summary.fixedInvestment > 0) {
      add('info', 'El capital de trabajo pesa más que la inversión fija; es normal en engordas y en agroindustria que compran materia prima, pero conviene decirlo en el estudio.',
        'Working capital weighs more than the fixed investment; that is normal in feedlots and in plants that buy raw material, but it is worth saying so in the study.');
    }
    /* amortisation that does not fit in the horizon */
    if (m.amortisation.notAmortised > 0) {
      add('info', `Quedan ${fmtMoney(m.amortisation.notAmortised, 0)} de inversión diferida sin amortizar dentro del horizonte.`,
        `${fmtMoney(m.amortisation.notAmortised, 0)} of pre-operating investment is left unamortised inside the horizon.`);
    }
    /* a sanity check against the revenue of Block 3 */
    if (market && market.prog && market.prog.rows.length) {
      const rev = market.prog.rows.map(r => r.total);
      const bad = m.costs.filter(r => rev[r.t - 1] > 0 && r.cash > rev[r.t - 1]).length;
      if (bad > 0 && bad === m.costs.filter(r => rev[r.t - 1] > 0).length) {
        add('warning', 'En todos los años con producción el costo supera al ingreso: el proyecto pierde dinero en su operación, antes siquiera de descontar.',
          'In every year with production the cost is above the revenue: the project loses money in its operation, before any discounting.');
      }
    }
    if (m.summary.perOutputAtFull != null && m.summary.perOutputAtFull > 0 && market && market.priceFc && market.priceFc.values.length) {
      const price = market.priceFc.values[market.priceFc.values.length - 1].value;
      if (m.summary.perOutputAtFull > price) {
        add('warning', `A plena producción el costo por tonelada (${fmtMoney(m.summary.perOutputAtFull, 0)}) es mayor que el precio proyectado (${fmtMoney(price, 0)}).`,
          `At full production the cost per tonne (${fmtMoney(m.summary.perOutputAtFull, 0)}) is above the projected price (${fmtMoney(price, 0)}).`);
      }
    }
    return out;
  }

  window.Budget = { KINDS, BASES, GROUPS, parseKind, parseGroup, parseBase, parseYes, purchases, depreciation, amortisation, itemAmount, costs, workingCapital, build, validate };
})();
