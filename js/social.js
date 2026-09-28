/* EconomicsPro — Block 8: economic and social appraisal.

   The same project, looked at by the country instead of by its owner. Two
   things change, and only two:

   · TRANSFERS DISAPPEAR. Taxes and subsidies move money from one pocket to
     another; they neither create nor destroy resources, so they come out of
     the flow. A project that is profitable only because of a subsidy is not
     profitable for the country, and this is where that shows.
   · PRICES ARE CORRECTED. The market price of a good is not always what it is
     worth to the country: a tariff makes an input dearer than it really is,
     an overvalued currency makes an exportable product cheaper, and a wage in
     a region with seasonal unemployment is above what the work really costs
     society. Each item is multiplied by its conversion factor, and what comes
     out is the accounting (or shadow) price.

   The whole difference between the private and the economic result is broken
   down into those pieces, and they add up exactly: the transfers removed, the
   correction of the product, that of the costs, and that of the investment.
   Everything is discounted at the social rate, which is not the same as the
   one the owner demands.

   The social indicators —employment, foreign exchange, value added and how it
   is shared— are the ones a public investment file asks for. */

(function () {

  /* the groups of cost that Block 4 already separates, each with the factor
     that converts its market price into an accounting price */
  const GROUPS = ['labour', 'inputs', 'machinery', 'services', 'admin', 'other'];

  function defaults() {
    return {
      /* the standard conversion factor: what a peso of a non-traded good is
         really worth to the country, once taxes and tariffs are taken out */
      standard: 0.90,
      product: 1.00,
      labour: 0.70,          /* seasonal unemployment makes the wage above the social cost */
      inputs: 0.95,
      machinery: 1.00,
      services: 0.90,
      admin: 0.90,
      other: 0.90,
      investment: null,      /* null = weighted from the kinds of asset */
      exchange: 1.05,        /* premium on foreign exchange */
      exportShare: 0, importShare: 0,
      wage: 350, daysPerJob: 270,
      subsidy: 0,            /* support received a year, which is a transfer */
      beneficiaries: 0,
    };
  }

  /* The conversion factor of the investment, weighted by what it is made of:
     civil works are mostly non-traded, machinery is usually imported. */
  function investmentFactor(s, budget) {
    if (s.investment != null && s.investment !== '') return Number(s.investment);
    const byKind = (budget && budget.summary && budget.summary.byKind) || {};
    const kindFactor = { land: 1, works: s.standard, planting: s.standard, machinery: s.machinery, equipment: s.machinery, vehicles: s.machinery, livestock: s.standard, other: s.standard };
    let total = 0, weighted = 0;
    Object.keys(byKind).forEach(k => {
      const v = byKind[k] || 0;
      total += v;
      weighted += v * (kindFactor[k] == null ? s.standard : kindFactor[k]);
    });
    return total > 0 ? weighted / total : s.standard;
  }

  /* ================================================================
     the economic flow
     ================================================================ */
  function build(s, p, market, budget, st, ap) {
    const horizon = st.horizon;
    const fcInvest = investmentFactor(s, budget);
    const social = Number(p.socialRate) || 0;
    const privateRate = ap ? ap.rateProject : Project.rates(p).used;
    const fixedAnnual = (budget.fixedList || []).reduce((a, f) => a + (Number(f.amount) || 0), 0);

    const rows = [];
    const flow = [];
    /* year 0: only investment and the working capital, at accounting prices */
    const inv0 = (budget.schedule[0] ? budget.schedule[0].fixed + budget.schedule[0].replacement + budget.schedule[0].deferred : 0);
    const wc0 = budget.schedule[0] ? budget.schedule[0].workingCapital : 0;
    flow.push(-(inv0 * fcInvest + wc0 * s.standard));

    for (let t = 1; t <= horizon; t++) {
      const r = st.rows[t - 1];
      const c = budget.costs[t - 1] || { byGroup: {}, cash: 0, fixed: 0 };
      const sch = budget.schedule[t] || {};
      /* A subsidy received is a transfer: it is income for the owner but not a
         resource the country creates, so it comes out before anything else. */
      const sub = r.revenue > 0 ? Number(s.subsidy) || 0 : 0;
      const marketRevenue = Math.max(0, r.revenue - sub);
      /* the product, at its accounting price, plus what the foreign exchange
         it earns is really worth */
      const revenue = marketRevenue * Number(s.product);
      const fxGain = marketRevenue * Number(s.exportShare) * (Number(s.exchange) - 1);
      /* each group of cost with its own factor; the annual fixed costs go with
         administration */
      let cost = 0;
      const byGroup = {};
      GROUPS.forEach(g => {
        const amount = (c.byGroup && c.byGroup[g]) || 0;
        const f = Number(s[g]);
        byGroup[g] = amount * f;
        cost += amount * f;
      });
      cost += fixedAnnual * Number(s.admin);
      /* imported inputs are worth more than their price says */
      const fxCost = c.cash * Number(s.importShare) * (Number(s.exchange) - 1);
      const investment = ((sch.fixed || 0) + (sch.replacement || 0) + (sch.deferred || 0)) * fcInvest;
      const wcInvest = (sch.workingCapital || 0) * Number(s.standard);
      const salvage = t === horizon ? budget.salvage.assets * fcInvest + budget.salvage.land * fcInvest + budget.salvage.workingCapital * Number(s.standard) : 0;
      const net = revenue + fxGain - cost - fxCost - investment - wcInvest + salvage;
      flow.push(net);
      /* the value added of the year and how it is shared out */
      const intermediate = ['inputs', 'machinery', 'services', 'other'].reduce((a, g) => a + ((c.byGroup && c.byGroup[g]) || 0), 0);
      const wages = ((c.byGroup && c.byGroup.labour) || 0) + ((c.byGroup && c.byGroup.admin) || 0) + fixedAnnual;
      /* Two different taxes, and each one belongs somewhere else: the flow of
         the project subtracts the tax it would pay WITHOUT debt, so that is
         the transfer the bridge gives back; what the government actually
         collects, with the shield of the interest, is what the distribution of
         the value added reports. */
      const taxes = r.taxProject + r.ptuProject;
      const taxesPaid = r.tax + r.ptu;
      const interest = r.interest;
      rows.push({
        t, year: r.year,
        revenue: r.revenue, marketRevenue, subsidy: sub, revenueEcon: revenue + fxGain,
        /* c.cash already carries the annual fixed costs: adding them again
           here would count them twice against the economic cost */
        cost: c.cash, costEcon: cost + fxCost, byGroup,
        investment: (sch.fixed || 0) + (sch.replacement || 0) + (sch.deferred || 0), investmentEcon: investment,
        taxes, taxesPaid, interest, net,
        valueAdded: r.revenue - intermediate,
        wages, surplus: r.revenue - intermediate - wages - taxesPaid - interest,
        labourCost: (c.byGroup && c.byGroup.labour) || 0,
        jobs: Number(s.wage) > 0 ? ((c.byGroup && c.byGroup.labour) || 0) / Number(s.wage) : 0,
        fx: r.revenue * Number(s.exportShare) - c.cash * Number(s.importShare),
      });
    }

    /* ---------------- the indicators ---------------- */
    const economic = Fin.appraise(flow, social, { reinvestRate: social, financeRate: social });
    economic.bc = Fin.bcRatio(
      flow.map((v, t) => (t === 0 ? 0 : rows[t - 1].revenueEcon + (t === horizon ? budget.salvage.total * fcInvest : 0))),
      flow.map((v, t) => (t === 0 ? -v : rows[t - 1].costEcon + rows[t - 1].investmentEcon + (budget.schedule[t] ? budget.schedule[t].workingCapital * Number(s.standard) : 0))),
      social);

    /* ---------------- private against economic ---------------- */
    const privateFlow = st.projectFlow;
    const d = t => Math.pow(1 + social, -t);
    const pieces = { transfers: 0, product: 0, costs: 0, investment: 0 };
    rows.forEach(r => {
      /* a tax removed adds to the country; a subsidy removed takes away */
      pieces.transfers += (r.taxes - r.subsidy) * d(r.t);
      pieces.product += (r.revenueEcon - r.marketRevenue) * d(r.t);
      pieces.costs += -(r.costEcon - r.cost) * d(r.t);
    });
    /* the investment and the working capital, including year 0 */
    privateFlow.forEach((v, t) => {
      if (t === 0) { pieces.investment += -((inv0 * fcInvest + wc0 * Number(s.standard)) - (inv0 + wc0)) * d(0); return; }
      const sch = budget.schedule[t] || {};
      const inv = (sch.fixed || 0) + (sch.replacement || 0) + (sch.deferred || 0);
      const wc = sch.workingCapital || 0;
      const end = t === horizon ? budget.salvage : null;
      let delta = -(inv * fcInvest - inv) - (wc * Number(s.standard) - wc);
      if (end) delta += (end.assets * fcInvest + end.land * fcInvest + end.workingCapital * Number(s.standard)) - end.total;
      pieces.investment += delta * d(t);
    });
    const npvPrivateAtSocial = Fin.npv(social, privateFlow);
    const bridge = {
      privateAtPrivate: Fin.npv(privateRate, privateFlow),
      privateAtSocial: npvPrivateAtSocial,
      transfers: pieces.transfers,
      product: pieces.product,
      costs: pieces.costs,
      investment: pieces.investment,
      economic: economic.npv,
      rateEffect: npvPrivateAtSocial - Fin.npv(privateRate, privateFlow),
    };

    /* ---------------- social indicators ---------------- */
    const full = rows.reduce((a, r) => (r.jobs > a.jobs ? r : a), rows[0] || { jobs: 0 });
    const totalJobs = rows.reduce((a, r) => a + r.jobs, 0);
    const investmentTotal = budget.summary.initial;
    const indicators = {
      jobsAtFull: full ? full.jobs : 0,
      permanentJobs: full && Number(s.daysPerJob) > 0 ? full.jobs / Number(s.daysPerJob) : 0,
      totalJobs,
      investmentPerJob: full && full.jobs > 0 && Number(s.daysPerJob) > 0 ? investmentTotal / (full.jobs / Number(s.daysPerJob)) : null,
      fxPerYear: full ? rows.reduce((a, r) => Math.max(a, r.fx), 0) : 0,
      fxPresent: Fin.npv(social, [0].concat(rows.map(r => r.fx))),
      valueAddedAtFull: full ? full.valueAdded : 0,
      wagesShare: full && full.valueAdded > 0 ? full.wages / full.valueAdded : null,
      taxShare: full && full.valueAdded > 0 ? full.taxesPaid / full.valueAdded : null,
      interestShare: full && full.valueAdded > 0 ? full.interest / full.valueAdded : null,
      surplusShare: full && full.valueAdded > 0 ? full.surplus / full.valueAdded : null,
      costPerBeneficiary: Number(s.beneficiaries) > 0 ? investmentTotal / Number(s.beneficiaries) : null,
      beneficiaries: Number(s.beneficiaries) || 0,
    };

    const model = {
      rows, flow, economic, bridge, indicators, fcInvest, socialRate: social, privateRate,
      horizon, factors: s,
    };
    model.messages = validate(model, s, p, ap);
    return model;
  }

  /* ================================================================
     coherence
     ================================================================ */
  function validate(m, s, p, ap) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });
    const priv = ap ? ap.project.npv : m.bridge.privateAtPrivate;

    if (!m.rows.length) {
      add('error', 'No hay proyecto que evaluar socialmente: revisa los bloques anteriores.', 'There is no project to appraise socially: check the previous blocks.');
      return out;
    }
    if (priv > 0 && m.economic.npv <= 0) {
      add('warning', 'El proyecto conviene al dueño pero no al país: buena parte de su rentabilidad viene de transferencias (impuestos que no paga, subsidios que recibe) o de precios que no reflejan lo que los recursos valen.',
        'The project is worth doing for the owner but not for the country: much of its profitability comes from transfers (taxes not paid, subsidies received) or from prices that do not reflect what the resources are worth.');
    }
    if (priv <= 0 && m.economic.npv > 0) {
      add('info', 'El proyecto no le conviene al productor pero sí al país: es el caso típico de un proyecto que merece apoyo público, y conviene decirlo así en el estudio.',
        'The project is not worth doing for the farmer but it is for the country: this is the typical case of a project that deserves public support, and the study should say so.');
    }
    if (Number(s.standard) < 0.5 || Number(s.standard) > 1.2) {
      add('warning', `Un factor estándar de conversión de ${fmtFixed(s.standard, 2)} está fuera del rango usual (0.8 a 1.0); justifícalo o revísalo.`,
        `A standard conversion factor of ${fmtFixed(s.standard, 2)} is outside the usual range (0.8 to 1.0); justify it or check it.`);
    }
    if (Number(s.labour) >= 1) {
      add('info', 'Estás valuando la mano de obra a su salario de mercado. En regiones con desempleo estacional el costo social del trabajo es menor, y ese factor suele ponerse entre 0.5 y 0.8.',
        'You are valuing labour at its market wage. In regions with seasonal unemployment the social cost of labour is lower, and that factor is usually set between 0.5 and 0.8.');
    }
    if (m.socialRate > m.privateRate) {
      add('warning', `La tasa social (${fmtPct(m.socialRate, 2)}) es mayor que la privada (${fmtPct(m.privateRate, 2)}); normalmente es al revés, porque el país puede esperar más que un productor.`,
        `The social rate (${fmtPct(m.socialRate, 2)}) is above the private one (${fmtPct(m.privateRate, 2)}); it is usually the other way round, because a country can wait longer than a farmer.`);
    }
    if (!(Number(s.wage) > 0)) {
      add('info', 'Sin el salario del jornal no se pueden estimar los empleos generados; escríbelo para tener ese indicador.',
        'Without the daily wage the jobs created cannot be estimated; type it in to get that indicator.');
    }
    if (Number(s.exportShare) > 0 && Number(s.exchange) === 1) {
      add('info', 'Declaraste exportaciones pero el factor de la divisa es 1: entonces la divisa no vale más que su tipo de cambio y el proyecto no aporta por ese lado.',
        'You declared exports but the foreign exchange factor is 1: then foreign currency is worth no more than its exchange rate and the project adds nothing on that side.');
    }
    /* the bridge has to close */
    const sum = m.bridge.privateAtSocial + m.bridge.transfers + m.bridge.product + m.bridge.costs + m.bridge.investment;
    if (Math.abs(sum - m.economic.npv) > Math.max(1, Math.abs(m.economic.npv) * 1e-6)) {
      add('error', `La descomposición entre el VAN privado y el económico no cierra por ${fmtMoney(sum - m.economic.npv, 2)}: es un error del programa, repórtalo.`,
        `The bridge between the private and the economic NPV does not close by ${fmtMoney(sum - m.economic.npv, 2)}: this is a bug, please report it.`);
    }
    return out;
  }

  window.Social = { GROUPS, defaults, investmentFactor, build, validate };
})();
