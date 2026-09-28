/* EconomicsPro — Block 9: comparison and decisions.

   Block 6 says whether a project is worth doing. This one answers the
   questions that come after, and every one of them has a trap of its own:

   · WHICH OF THE TWO? Between mutually exclusive alternatives the IRR can
     prefer one and the NPV the other, because the IRR is a percentage and does
     not know how many pesos are behind it. The answer is the incremental IRR —
     Fisher's intersection — which says at what discount rate the preference
     changes hands.
   · THEY LAST DIFFERENT TIMES. An orchard of twenty years and a greenhouse of
     ten cannot be compared by their NPV. The equivalent annual value can,
     because it assumes each one is repeated, which is exactly what a farmer
     does with their land.
   · THE BUDGET DOES NOT REACH. With several independent projects and limited
     money, ranking by profitability index is a good rule of thumb but not
     always the best package: the app searches every combination that fits and
     says how much the rule of thumb left on the table.
   · WHEN TO REPLACE. A machine is not replaced when it breaks but when its
     equivalent annual cost starts to rise: the year that minimises it is its
     economic life, and it is almost always earlier than people think.
   · WHEN TO CUT. For a plantation or a timber stand, waiting one more year
     adds growth but delays every rotation that follows. Faustmann's land
     expectation value is what settles it. */

(function () {

  /* ================================================================
     1 · alternatives
     ================================================================ */

  /* An alternative can be described in two ways: with its own explicit flow
     (the project of the previous blocks arrives like that) or with the four
     figures anybody has at hand — investment, annual net flow, horizon and
     salvage value. Both end as a flow, and from there everything is the same. */
  function flowOf(a) {
    if (a.flow && a.flow.length) return a.flow.map(Number);
    const n = Math.max(1, Math.round(Number(a.horizon) || 1));
    const inv = Number(a.investment) || 0;
    const net = Number(a.net) || 0;
    const g = Number(a.growth) || 0;
    const out = [-inv];
    for (let t = 1; t <= n; t++) {
      const v = net * Math.pow(1 + g, t - 1);
      out.push(t === n ? v + (Number(a.salvage) || 0) : v);
    }
    return out;
  }

  function appraise(list, rate) {
    return (list || []).map((a, i) => {
      const flow = flowOf(a);
      const n = flow.length - 1;
      const r = Fin.appraise(flow, rate, { reinvestRate: rate, financeRate: rate });
      return Object.assign({
        i, name: a.name, flow, horizon: n,
        investment: -flow[0],
        eaa: Fin.eaa(r.npv, rate, n),
      }, r);
    }).filter(a => a.investment > 0 || a.flow.some(v => v !== 0));
  }

  /* Between two alternatives: the rate at which they are worth the same, and
     who wins on each side of it. The difference is always taken from the
     cheaper one to the dearer one, which is how the incremental rate is read. */
  function compare(a, b, rate) {
    if (!a || !b) return null;
    const small = a.investment <= b.investment ? a : b;
    const large = a.investment <= b.investment ? b : a;
    const n = Math.max(small.flow.length, large.flow.length);
    const diff = [];
    for (let t = 0; t < n; t++) diff.push((large.flow[t] || 0) - (small.flow[t] || 0));
    const irr = Fin.irr(diff);
    const npvSmall = Fin.npv(rate, small.flow), npvLarge = Fin.npv(rate, large.flow);
    return {
      small, large, diff, incrementalIRR: irr,
      npvSmall, npvLarge,
      /* below the crossing the cheaper one wins; above it, the dearer one */
      winner: npvLarge > npvSmall ? large : small,
      extraInvestment: large.investment - small.investment,
      /* the same horizon is needed for the comparison to mean anything */
      sameHorizon: small.horizon === large.horizon,
    };
  }

  /* ================================================================
     2 · capital rationing
     ================================================================ */

  /* With independent projects and a fixed budget, the best package is the
     combination with the highest total NPV that fits. With few alternatives
     every combination can be tried, which is the only way of knowing what the
     usual rule —ranking by profitability index— leaves behind. */
  function rationing(list, budget, rate) {
    const items = appraise(list, rate).map(a => Object.assign({}, a, {
      pi: a.investment > 0 ? (a.npv + a.investment) / a.investment : null,
    }));
    const B = Number(budget) || 0;
    /* the rule of thumb: take them by profitability index while the money lasts */
    const byPI = items.slice().sort((x, y) => (y.pi || -Infinity) - (x.pi || -Infinity));
    const greedy = [];
    let spent = 0;
    byPI.forEach(a => {
      if (a.npv <= 0) return;
      if (spent + a.investment <= B + 1e-9) { greedy.push(a); spent += a.investment; }
    });
    /* every combination, when there are few enough of them */
    let best = null;
    if (items.length <= 18) {
      const total = 1 << items.length;
      for (let mask = 0; mask < total; mask++) {
        let cost = 0, npv = 0;
        const pick = [];
        for (let i = 0; i < items.length; i++) {
          if (mask & (1 << i)) { cost += items[i].investment; npv += items[i].npv; pick.push(items[i]); }
        }
        if (cost <= B + 1e-9 && (best == null || npv > best.npv + 1e-9)) best = { npv, cost, pick };
      }
    }
    const greedyNpv = greedy.reduce((a, x) => a + x.npv, 0);
    return {
      items, budget: B,
      greedy, greedyCost: spent, greedyNpv,
      best, exhaustive: items.length <= 18,
      /* what the rule of thumb left on the table */
      loss: best ? best.npv - greedyNpv : null,
    };
  }

  /* ================================================================
     3 · replacement and economic life
     ================================================================ */

  /* The equivalent annual cost of keeping a machine for n years: what it cost,
     less what it can still be sold for, spread over those years, plus what it
     costs to run, which rises as it ages. The year that minimises it is the
     economic life: keeping it longer is paying more per year of service. */
  function replacement(o) {
    const cost = Number(o.cost) || 0;
    const rate = Number(o.rate) || 0;
    const maxLife = Math.max(1, Math.round(Number(o.maxLife) || 10));
    const decline = Math.min(0.95, Math.max(0, Number(o.decline) || 0));
    const floor = Math.max(0, Number(o.floorValue) || 0);
    const running0 = Number(o.running) || 0;
    const rise = Number(o.rise) || 0;
    const rows = [];
    let best = null;
    for (let n = 1; n <= maxLife; n++) {
      /* what it is worth after n years, and what running it cost each year */
      const salvage = Math.max(cost * floor, cost * Math.pow(1 - decline, n));
      let pvRunning = 0;
      for (let t = 1; t <= n; t++) {
        const run = running0 * Math.pow(1 + rise, t - 1);
        pvRunning += run / Math.pow(1 + rate, t);
      }
      const crf = Fin.capitalRecovery(rate, n);
      const capital = (cost - salvage / Math.pow(1 + rate, n)) * crf;
      const running = pvRunning * crf;
      const eac = capital + running;
      const row = { n, salvage, capital, running, eac };
      rows.push(row);
      if (best == null || eac < best.eac - 1e-9) best = row;
    }
    return { rows, best, economicLife: best ? best.n : null };
  }

  /* ================================================================
     4 · optimal rotation (Faustmann)
     ================================================================ */

  /* For a plantation that is cut and replanted for ever, the question is not
     which rotation gives the most money once, but which gives the most per
     year of land occupied. The land expectation value answers it, and it
     almost always shortens the rotation against what the timber volume alone
     would suggest. */
  function rotation(o) {
    const establish = Number(o.establish) || 0;
    const annual = Number(o.annual) || 0;
    const rate = Number(o.rate) || 0;
    const rows = (o.options || []).map(r => {
      const n = Math.max(1, Math.round(parseNum(r.years) || 0));
      const harvest = parseNum(r.harvest) || 0;
      /* one rotation: establishment, upkeep every year, harvest at the end */
      const flows = [-establish];
      for (let t = 1; t <= n; t++) flows.push(t === n ? harvest - annual : -annual);
      const npv = Fin.npv(rate, flows);
      const lev = Fin.faustmann(flows, rate, n);
      return { years: n, harvest, npv, lev, perYear: harvest / n, flows };
    }).filter(r => r.years > 0);
    rows.sort((a, b) => a.years - b.years);
    let best = null, bestNpv = null;
    rows.forEach(r => {
      if (best == null || (r.lev != null && r.lev > best.lev + 1e-9)) best = r;
      if (bestNpv == null || r.npv > bestNpv.npv + 1e-9) bestNpv = r;
    });
    return { rows, best, bestNpv, rate };
  }

  /* ================================================================
     5 · buy or lease
     ================================================================ */

  /* Both ways of having the machine are turned into what they cost per year,
     after tax: buying deducts the depreciation, leasing deducts the whole
     payment. */
  function buyOrLease(o) {
    const cost = Number(o.cost) || 0;
    const life = Math.max(1, Math.round(Number(o.life) || 1));
    const rate = Number(o.rate) || 0;
    const tax = Number(o.tax) || 0;
    const salvage = Number(o.salvage) || 0;
    const maintenance = Number(o.maintenance) || 0;
    const lease = Number(o.lease) || 0;
    const leaseMaintenance = Number(o.leaseMaintenance) || 0;
    /* buying: the outlay, less the tax saved by depreciation, less what it is
       sold for at the end, plus what it costs to keep it running */
    const dep = Fin.depreciate({ cost, salvage, life, method: 'sl' });
    let pvBuy = cost;
    dep.rows.forEach(r => { pvBuy -= (r.depreciation * tax) / Math.pow(1 + rate, r.t); });
    for (let t = 1; t <= life; t++) pvBuy += (maintenance * (1 - tax)) / Math.pow(1 + rate, t);
    pvBuy -= salvage / Math.pow(1 + rate, life);
    /* leasing: the payment, deductible in full */
    let pvLease = 0;
    for (let t = 1; t <= life; t++) pvLease += ((lease + leaseMaintenance) * (1 - tax)) / Math.pow(1 + rate, t);
    const crf = Fin.capitalRecovery(rate, life);
    return {
      pvBuy, pvLease, eacBuy: pvBuy * crf, eacLease: pvLease * crf,
      best: pvBuy <= pvLease ? 'buy' : 'lease',
      difference: pvLease - pvBuy, life, rate,
    };
  }

  /* ================================================================
     6 · coherence
     ================================================================ */
  function validate(m, rate) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });
    const alts = m.alternatives || [];

    if (alts.length >= 2) {
      const horizons = new Set(alts.map(a => a.horizon));
      if (horizons.size > 1) {
        add('warning', `Las alternativas duran distinto (${[...horizons].sort((a, b) => a - b).join(', ')} años): comparar sus VAN no significa nada. Usa el valor anual equivalente, que es la columna marcada.`,
          `The alternatives last for different times (${[...horizons].sort((a, b) => a - b).join(', ')} years): comparing their NPVs means nothing. Use the equivalent annual value, which is the marked column.`);
      }
      const byNpv = alts.slice().sort((a, b) => b.npv - a.npv)[0];
      const byIrr = alts.filter(a => a.irr != null).sort((a, b) => b.irr - a.irr)[0];
      if (byIrr && byNpv && byIrr !== byNpv) {
        add('info', `El VAN prefiere «${byNpv.name || byNpv.i + 1}» y la TIR prefiere «${byIrr.name || byIrr.i + 1}»: es el desacuerdo clásico entre proyectos de distinto tamaño. Mira la TIR incremental de abajo.`,
          `The NPV prefers "${byNpv.name || byNpv.i + 1}" and the IRR prefers "${byIrr.name || byIrr.i + 1}": the classic disagreement between projects of different size. Look at the incremental IRR below.`);
      }
      const byEaa = alts.slice().sort((a, b) => b.eaa - a.eaa)[0];
      if (byEaa && byNpv && byEaa !== byNpv) {
        add('warning', `Por VAN gana «${byNpv.name || byNpv.i + 1}», pero por valor anual equivalente gana «${byEaa.name || byEaa.i + 1}»: con horizontes distintos, manda el segundo.`,
          `By NPV "${byNpv.name || byNpv.i + 1}" wins, but by equivalent annual value "${byEaa.name || byEaa.i + 1}" does: with different horizons, the second one decides.`);
      }
    }
    if (m.comparison && m.comparison.incrementalIRR != null) {
      const inc = m.comparison.incrementalIRR;
      add('info', `Invertir los ${fmtMoney(m.comparison.extraInvestment, 0)} de más de «${m.comparison.large.name || ''}» rinde ${fmtPct(inc, 2)}: conviene mientras tu tasa esté por debajo de eso.`,
        `Investing the extra ${fmtMoney(m.comparison.extraInvestment, 0)} of "${m.comparison.large.name || ''}" returns ${fmtPct(inc, 2)}: it is worth it as long as your rate is below that.`);
    }
    if (m.rationing && m.rationing.loss != null && m.rationing.loss > 1) {
      add('warning', `Escoger por índice de rentabilidad deja ${fmtMoney(m.rationing.loss, 0)} de VAN sobre la mesa: el mejor paquete no es el de la regla de dedo.`,
        `Choosing by profitability index leaves ${fmtMoney(m.rationing.loss, 0)} of NPV on the table: the best package is not the rule-of-thumb one.`);
    }
    if (m.rationing && !m.rationing.exhaustive) {
      add('info', 'Con más de 18 alternativas la app ya no prueba todas las combinaciones y solo usa el orden por índice de rentabilidad.',
        'With more than 18 alternatives the app no longer tries every combination and only uses the profitability index ranking.');
    }
    if (m.replacement && m.replacement.economicLife != null) {
      const r = m.replacement;
      if (r.economicLife === r.rows.length) {
        add('info', `Dentro del plazo explorado el costo anual equivalente todavía baja: alarga «vida máxima a explorar» para encontrar el mínimo.`,
          `Within the span explored the equivalent annual cost is still falling: lengthen "longest life to explore" to find the minimum.`);
      } else {
        add('info', `La vida económica del equipo es de ${r.economicLife} años, con un costo anual equivalente de ${fmtMoney(r.best.eac, 0)}. Conservarlo más tiempo sale más caro por año de servicio.`,
          `The economic life of the machine is ${r.economicLife} years, at an equivalent annual cost of ${fmtMoney(r.best.eac, 0)}. Keeping it longer costs more per year of service.`);
      }
    }
    if (m.rotation && m.rotation.best && m.rotation.bestNpv && m.rotation.best.years !== m.rotation.bestNpv.years) {
      add('info', `El turno que maximiza el VAN de una sola rotación es de ${m.rotation.bestNpv.years} años, pero el que maximiza el valor de la tierra es de ${m.rotation.best.years}: cuando la plantación se repite, conviene cortar antes.`,
        `The rotation that maximises the NPV of a single cycle is ${m.rotation.bestNpv.years} years, but the one that maximises the value of the land is ${m.rotation.best.years}: when the plantation is repeated, it pays to cut earlier.`);
    }
    return out;
  }

  window.Decide = { flowOf, appraise, compare, rationing, replacement, rotation, buyOrLease, validate };
})();
