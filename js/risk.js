/* EconomicsPro — Block 7: risk and uncertainty.

   Every number of the study so far is a single value: one price, one yield,
   one cost. This block asks what happens when they are not, and it does it on
   the flow OF THE PROJECT, without financing: the risk belongs to the project,
   and the loan is a decision taken afterwards.

   THE FAST REBUILD. Sensitivity needs a few dozen evaluations and a Monte
   Carlo simulation a few thousand, so walking the whole chain (market →
   budget → statements) every time would be too slow to move a slider. Instead
   the flow is rebuilt from the pieces the previous blocks already computed,
   applying the multipliers where each one belongs:

     · the revenue follows the price AND the yield;
     · the costs that go with the tonne follow the yield and the cost;
     · the costs that go with the area or the year follow only the cost;
     · depreciation, investment and what is left to sell follow the investment;
     · the working capital follows the cost of its own year, because it is a
       share of it;
     · the tax is computed again from scratch, losses carried forward included.

   This is not an approximation: with every multiplier at 1 it returns exactly
   the flow of Block 5, and the unit tests check that it agrees with the full
   chain when a multiplier moves. */

(function () {

  /* the variables the block can move, and where each one bites */
  const VARS = [
    { key: 'price', es: 'Precio de venta', en: 'Selling price' },
    { key: 'yield', es: 'Rendimiento', en: 'Yield' },
    { key: 'cost', es: 'Costos de operación', en: 'Operating costs' },
    { key: 'invest', es: 'Inversión', en: 'Investment' },
    { key: 'rate', es: 'Tasa de descuento', en: 'Discount rate' },
  ];

  /* ================================================================
     1 · the pieces the rebuild needs
     ================================================================ */
  function baseline(p, market, budget, st) {
    const horizon = st.horizon;
    const dep = budget.depreciation.byYear, amo = budget.amortisation.byYear;
    const years = [];
    for (let t = 1; t <= horizon; t++) {
      const c = budget.costs[t - 1] || {};
      const s = budget.schedule[t] || {};
      const cash = (c.volumeCost || 0) + (c.capacityCost || 0);
      years.push({
        t,
        revenue: st.rows[t - 1] ? st.rows[t - 1].revenue : 0,
        volumeCost: c.volumeCost || 0,
        capacityCost: c.capacityCost || 0,
        depreciation: (dep[t] || 0) + (amo[t] || 0),
        investment: (s.fixed || 0) + (s.replacement || 0) + (s.deferred || 0),
        wcInvest: s.workingCapital || 0,
        wcNeed: budget.wc.need[t - 1] || 0,
        /* the working capital of a year is a share of the cost of that year:
           keeping the share is what makes it move with the cost */
        wcFactor: cash > 0 ? (budget.wc.need[t - 1] || 0) / cash : 0,
      });
    }
    const s0 = budget.schedule[0] || {};
    return {
      horizon, years,
      invest0: (s0.fixed || 0) + (s0.replacement || 0) + (s0.deferred || 0),
      wc0: s0.workingCapital || 0,
      salvageAssets: (budget.salvage.assets || 0) + (budget.salvage.land || 0),
      tax: {
        rate: Number(p.tax.income) || 0,
        applyPTU: !!p.tax.applyPTU,
        ptuRate: Number(p.tax.ptu) || 0,
        exempt: Project.exemptIncome(p).amount,
      },
      rate: st.rateProject != null ? st.rateProject : null,
    };
  }

  /* ================================================================
     2 · the flow, rebuilt with the multipliers
     ================================================================ */
  function rebuild(base, mult) {
    const m = mult || {};
    const mp = m.price == null ? 1 : m.price;
    const my = m.yield == null ? 1 : m.yield;
    const mc = m.cost == null ? 1 : m.cost;
    const mi = m.invest == null ? 1 : m.invest;

    const carry = { losses: 0 };
    const rows = [];
    /* year 0 pays the investment and the working capital of the first cycle,
       which follows the cost, not the investment */
    let prevNeed = base.years.length ? needOf(base.years[0], mc, my) : 0;
    const flow = [-(base.invest0 * mi + prevNeed)];

    for (let i = 0; i < base.years.length; i++) {
      const y = base.years[i];
      const revenue = y.revenue * mp * my;
      const cost = y.volumeCost * my * mc + y.capacityCost * mc;
      const depreciation = y.depreciation * mi;
      const ebit = revenue - cost - depreciation;
      const tax = FinState.taxOf(ebit, Object.assign({ revenue }, base.tax), carry);
      const net = ebit - tax.ptu - tax.tax;
      /* the working capital of the next year is put in this year */
      const nextNeed = i + 1 < base.years.length ? needOf(base.years[i + 1], mc, my) : prevNeed;
      const wcInvest = i + 1 < base.years.length ? Math.max(0, nextNeed - prevNeed) : 0;
      const last = i === base.years.length - 1;
      const salvage = last ? base.salvageAssets * mi + prevNeed : 0;
      flow.push(net + depreciation - y.investment * mi - wcInvest + salvage);
      rows.push({ t: y.t, revenue, cost, depreciation, ebit, tax: tax.tax, ptu: tax.ptu, net });
      prevNeed = nextNeed;
    }
    return { flow, rows };
  }
  const needOf = (y, mc, my) => (y.volumeCost * my * mc + y.capacityCost * mc) * y.wcFactor;

  /* The indicator a study looks at, for one set of multipliers. */
  function npvOf(base, mult, rate) {
    const r = rate == null ? base.rate : rate;
    const built = rebuild(base, mult);
    const mr = mult && mult.rate != null ? mult.rate : 1;
    return Fin.npv(r * mr, built.flow);
  }
  function irrOf(base, mult) {
    return Fin.irr(rebuild(base, mult).flow);
  }

  /* ================================================================
     3 · sensitivity, switching values and tornado
     ================================================================ */

  /* One variable at a time over a list of percentage changes: the spider
     diagram of a project document. */
  function spider(base, changes, keys) {
    const list = (keys || VARS.map(v => v.key));
    return list.map(key => {
      const v = VARS.find(x => x.key === key) || { key, es: key, en: key };
      return {
        key, es: v.es, en: v.en,
        points: changes.map(c => ({ change: c, npv: npvOf(base, { [key]: 1 + c }) })),
      };
    });
  }

  /* How far each variable can move before the NPV reaches zero. */
  function switching(base) {
    return VARS.map(v => {
      const sw = Fin.switchingValue(x => npvOf(base, { [v.key]: x }), { min: 0.02, max: 8 });
      return { key: v.key, es: v.es, en: v.en, change: sw ? sw.change : null, multiplier: sw ? sw.multiplier : null };
    }).sort((a, b) => {
      const A = a.change == null ? Infinity : Math.abs(a.change);
      const B = b.change == null ? Infinity : Math.abs(b.change);
      return A - B;
    });
  }

  function tornado(base, delta) {
    const d = delta == null ? 0.1 : delta;
    return Fin.tornado(VARS.map(v => ({ name: v.key, es: v.es, en: v.en, f: x => npvOf(base, { [v.key]: x }) })), d);
  }

  /* Two variables at once: the table a thesis prints as a heat map, with the
     line where the NPV turns negative. */
  function grid2(base, keyA, keyB, changes) {
    const rows = [];
    changes.forEach(cb => {
      const line = [];
      changes.forEach(ca => {
        line.push(npvOf(base, { [keyA]: 1 + ca, [keyB]: 1 + cb }));
      });
      rows.push({ change: cb, values: line });
    });
    return { keyA, keyB, changes, rows };
  }

  /* ================================================================
     4 · scenarios
     ================================================================ */

  /* Three states of the world, each one a set of changes, with the
     probability the analyst is willing to state. The expected NPV is the
     weighted average, and its deviation says how much the verdict depends on
     which one happens. */
  function scenarios(base, list) {
    const out = list.map(s => {
      const mult = {};
      VARS.forEach(v => { if (s[v.key] != null && s[v.key] !== '') mult[v.key] = 1 + (Number(s[v.key]) || 0); });
      const built = rebuild(base, mult);
      const rate = base.rate * (mult.rate || 1);
      return {
        name: s.name, probability: Number(s.probability) || 0, changes: mult,
        npv: Fin.npv(rate, built.flow), irr: Fin.irr(built.flow), rate,
      };
    });
    const total = out.reduce((a, s) => a + s.probability, 0);
    const expected = total > 0 ? out.reduce((a, s) => a + s.npv * s.probability, 0) / total : null;
    const variance = total > 0 ? out.reduce((a, s) => a + s.probability * Math.pow(s.npv - expected, 2), 0) / total : null;
    return {
      list: out, expected,
      sd: variance == null ? null : Math.sqrt(variance),
      probabilityTotal: total,
      pLoss: total > 0 ? out.filter(s => s.npv < 0).reduce((a, s) => a + s.probability, 0) / total : null,
    };
  }

  /* ================================================================
     5 · Monte Carlo
     ================================================================ */

  /* All the variables at once, each with its distribution, and the
     correlation between price and yield imposed on the ranks: in agriculture
     the year of the big harvest is the year of the low price, and simulating
     them as independent overstates the risk. */
  function simulate(base, spec) {
    const vars = [];
    ['price', 'yield', 'cost', 'invest'].forEach(key => {
      const s = spec[key];
      if (!s || !(s.spread > 0)) return;
      const dist = spec.dist || 'triangular';
      if (dist === 'normal') vars.push({ name: key, dist: 'normal', mean: 1, sd: s.spread / 2 });
      else if (dist === 'uniform') vars.push({ name: key, dist: 'uniform', min: 1 - s.spread, max: 1 + s.spread });
      else if (dist === 'pert') vars.push({ name: key, dist: 'pert', min: 1 - s.spread, mode: 1, max: 1 + s.spread });
      else vars.push({ name: key, dist: 'triangular', min: 1 - s.spread, mode: 1, max: 1 + s.spread });
    });
    if (!vars.length) return null;
    const ip = vars.findIndex(v => v.name === 'price'), iy = vars.findIndex(v => v.name === 'yield');
    let corr = null;
    if (ip >= 0 && iy >= 0 && spec.corr) {
      corr = vars.map((_, i) => vars.map((__, j) => (i === j ? 1 : 0)));
      corr[ip][iy] = corr[iy][ip] = Number(spec.corr) || 0;
    }
    const sim = Fin.monteCarlo(vars, mult => npvOf(base, mult), {
      n: Math.max(100, Math.round(spec.n || 2000)), seed: spec.seed == null ? 20260923 : spec.seed, corr,
    });
    /* which variable explains the spread: the correlation of each draw with
       the result is what a risk report shows next to the histogram */
    sim.drivers = vars.map((v, i) => ({
      key: v.name,
      es: (VARS.find(x => x.key === v.name) || {}).es || v.name,
      en: (VARS.find(x => x.key === v.name) || {}).en || v.name,
      r: Stats.pearson(sim.draws[i], sim.raw),
    })).filter(d => d.r != null).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    /* the probability that the project beats its own hurdle */
    sim.pLoss = sim.values.filter(v => v < 0).length / sim.values.length;
    return sim;
  }

  /* ================================================================
     6 · deciding in stages
     ================================================================ */

  /* The simplest decision tree that is worth drawing, and the one an
     agricultural project really faces: invest now, or wait a year to see how
     the market turns out and invest only if it turns out well. Waiting costs a
     year of discounting and may cost the opportunity, but it avoids losing
     money in the bad state. */
  function decisionTree(o) {
    const q = Math.min(1, Math.max(0, Number(o.probability) || 0));
    const good = Number(o.npvGood) || 0;
    const bad = Number(o.npvBad) || 0;
    const rate = Number(o.rate) || 0;
    const now = q * good + (1 - q) * bad;                 /* investing now, whatever happens */
    /* waiting: the decision is taken knowing the state, so the bad branch is
       simply not invested in, and what is earned arrives a year later */
    const wait = (q * Math.max(0, good) + (1 - q) * Math.max(0, bad)) / (1 + rate);
    return {
      now, wait, q, good, bad, rate,
      option: wait - now,
      best: wait > now ? 'wait' : 'now',
      /* the value of knowing beforehand, without having to wait */
      perfectInfo: (q * Math.max(0, good) + (1 - q) * Math.max(0, bad)) - now,
    };
  }

  /* ================================================================
     7 · coherence
     ================================================================ */
  function validate(m, p) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });
    if (!m.base || !m.base.years.length) {
      add('error', 'No hay proyecto que someter a riesgo: revisa los bloques anteriores.', 'There is no project to put at risk: check the previous blocks.');
      return out;
    }
    const tight = m.switching.filter(s => s.change != null && Math.abs(s.change) < 0.1);
    if (tight.length) {
      add('warning', `${tight.map(s => s.es).join(', ')}: basta un cambio menor al 10 % para que el VAN se vuelva cero. El resultado es frágil y hay que decirlo en las conclusiones.`,
        `${tight.map(s => s.en).join(', ')}: a change of less than 10% is enough to take the NPV to zero. The verdict is fragile and the conclusions have to say so.`);
    }
    const never = m.switching.filter(s => s.change == null);
    if (never.length === m.switching.length) {
      add('info', 'Ninguna variable, por sí sola, logra anular el VAN dentro de los rangos explorados: el proyecto es muy robusto o hay algo que revisar en los datos.',
        'No variable on its own manages to wipe out the NPV inside the ranges explored: either the project is very robust or there is something to check in the data.');
    }
    if (m.sim) {
      if (m.sim.pLoss > 0.3) {
        add('warning', `La simulación da ${fmtPct(m.sim.pLoss, 0)} de probabilidad de que el VAN sea negativo: es un proyecto arriesgado aunque su VAN esperado sea positivo.`,
          `The simulation gives a ${fmtPct(m.sim.pLoss, 0)} probability of a negative NPV: it is a risky project even if its expected NPV is positive.`);
      } else if (m.sim.pLoss < 0.05 && m.sim.mean > 0) {
        add('info', `La probabilidad de perder es de ${fmtPct(m.sim.pLoss, 1)}: con los rangos declarados, el proyecto aguanta.`,
          `The probability of a loss is ${fmtPct(m.sim.pLoss, 1)}: within the ranges declared, the project holds up.`);
      }
      if (m.sim.drivers && m.sim.drivers.length && Math.abs(m.sim.drivers[0].r) > 0.6) {
        add('info', `Casi toda la variación del VAN viene de ${T(m.sim.drivers[0].es, m.sim.drivers[0].en)} (correlación ${fmtFixed(m.sim.drivers[0].r, 2)}): ahí conviene gastar en información.`,
          `Almost all the variation of the NPV comes from ${T(m.sim.drivers[0].es, m.sim.drivers[0].en)} (correlation ${fmtFixed(m.sim.drivers[0].r, 2)}): that is where it pays to spend on information.`);
      }
      if (m.spec && m.spec.corr === 0) {
        add('info', 'Estás simulando precio y rendimiento como independientes. En agricultura suelen moverse en contra: el año de la buena cosecha es el del precio bajo, y suponerlos independientes exagera el riesgo.',
          'You are simulating price and yield as independent. In farming they usually move against each other: the year of the good harvest is the year of the low price, and assuming independence overstates the risk.');
      }
    }
    if (m.scenarios && m.scenarios.probabilityTotal > 0 && Math.abs(m.scenarios.probabilityTotal - 1) > 0.01) {
      add('warning', `Las probabilidades de los escenarios suman ${fmtPct(m.scenarios.probabilityTotal, 0)}; se normalizan para el valor esperado, pero deberían sumar 100 %.`,
        `The probabilities of the scenarios add up to ${fmtPct(m.scenarios.probabilityTotal, 0)}; they are normalised for the expected value, but they should add up to 100%.`);
    }
    return out;
  }

  window.Risk = { VARS, baseline, rebuild, npvOf, irrOf, spider, switching, tornado, grid2, scenarios, simulate, decisionTree, validate };
})();
