/* EconomicsPro — Block 5: financing and pro-forma statements.

   Here the revenue of Block 3 meets the investment and the costs of Block 4,
   and the project finally has statements: an income statement, two cash flows
   and a balance sheet. Everything the appraisal of Block 6 will discount comes
   out of this file.

   Four things are done properly here, and each one changes the verdict of real
   projects:

   · TWO FLOWS, NOT ONE. The flow OF THE PROJECT says whether the idea is good
     no matter who pays for it: no loan, no interest, and the tax computed as
     if there were no debt. The flow OF THE INVESTOR says what the owner earns
     with their own money: it receives the loan, pays it back, and its tax
     carries the shield of the interest. Mixing them — discounting the
     investor's flow at the cost of capital, which already contains the debt —
     counts the benefit of the loan twice.
   · TAX LOSSES CARRY FORWARD. A plantation loses money for four years. Those
     losses are set against the profits of the years that follow, as the income
     tax law allows, instead of being thrown away. Ignoring it overstates the
     tax of a perennial project by a lot.
   · THE BALANCE SHEET HAS TO BALANCE. It is built from the flows, not typed,
     and the app checks the identity year by year: what does not balance is a
     mistake in the model, not a rounding.
   · CASH IS NOT PROFIT. A project can be profitable and still run out of money
     in year six. The accumulated cash balance says when, and that is a warning
     no indicator of Block 6 would ever give. */

(function () {

  /* ================================================================
     1 · the loans
     ================================================================ */

  /* Two credits, which is how a rural project is really financed:
       · a long-term loan (in Mexico, "refaccionario") for the fixed and
         pre-operating investment, repaid over several years, often with a
         grace period while the plantation grows;
       · a seasonal loan ("avío") for the working capital, drawn every cycle
         and paid back with the harvest: what it costs every year is its
         interest, and the principal is settled at the end of the horizon. */
  function loans(o) {
    const horizon = o.horizon;
    const zeros = () => new Array(horizon + 1).fill(0);
    const out = {
      received: zeros(), interest: zeros(), principal: zeros(), balance: zeros(),
      longTerm: null, seasonal: null, fee: 0,
    };
    /* --- long term --- */
    const base = (Number(o.investment) || 0) + (Number(o.deferred) || 0);
    const amount = o.longTermAmount != null && o.longTermAmount !== ''
      ? Math.max(0, Number(o.longTermAmount) || 0)
      : base * Math.min(1, Math.max(0, Number(o.longTermShare) || 0));
    if (amount > 0) {
      const sched = Fin.amortize({
        principal: amount, rate: Number(o.longTermRate) || 0,
        periods: Math.max(1, Math.round(Number(o.longTermYears) || 1)),
        grace: Math.max(0, Math.round(Number(o.longTermGrace) || 0)),
        graceType: o.longTermGraceType || 'interest',
        type: o.longTermType || 'level',
      });
      out.received[0] += amount;
      out.balance[0] += amount;                          /* owed from the moment it is drawn */
      out.fee += amount * (Number(o.fee) || 0);
      sched.rows.forEach(r => {
        if (r.t > horizon) return;
        out.interest[r.t] += r.paid;
        out.principal[r.t] += r.principal;
        out.balance[r.t] += r.balance;
      });
      /* a loan longer than the horizon leaves a balance that has to be settled
         when the project ends */
      const left = sched.rows.filter(r => r.t <= horizon).slice(-1)[0];
      out.longTerm = { amount, payment: sched.payment, rows: sched.rows, leftover: left ? left.balance : 0, totalInterest: sched.totalInterest };
    }
    /* --- seasonal, revolving with the working capital --- */
    const wcNeed = o.workingCapital || [];
    const share = Math.min(1, Math.max(0, Number(o.seasonalShare) || 0));
    if (share > 0 && wcNeed.length) {
      const rate = Number(o.seasonalRate) || 0;
      /* The seasonal loan is drawn at the end of a year for the cycle of the
         next one, exactly like the working capital it finances, and it is
         settled with the last harvest. The outstanding balance is carried as
         "received minus repaid" so that it can never drift away from the cash
         flow: that is what keeps the balance sheet balancing. */
      let outstanding = 0, peak = 0;
      for (let t = 0; t <= horizon; t++) {
        if (t >= 1) out.interest[t] += outstanding * rate;   /* on what was owed through the year */
        const need = t < horizon ? (wcNeed[t] || 0) * share : 0;
        const delta = need - outstanding;
        if (delta > 0) out.received[t] += delta;
        else if (delta < 0) out.principal[t] += -delta;
        outstanding = need;
        peak = Math.max(peak, outstanding);
        out.balance[t] += outstanding;
      }
      out.seasonal = { peak, rate };
    }
    return out;
  }

  /* ================================================================
     2 · the income statement
     ================================================================ */

  /* Tax of one year, with the two things the Mexican agricultural regime
     changes: the exempt income of article 74 and the losses of earlier years,
     which are set against the profit before paying. */
  function taxOf(profit, o, carry) {
    const exempt = Math.max(0, Number(o.exempt) || 0);
    const revenue = Math.max(0, Number(o.revenue) || 0);
    /* the exemption applies to income, so it lowers the taxable profit in the
       proportion of the revenue that is exempt */
    const exemptShare = revenue > 0 ? Math.min(1, exempt / revenue) : 0;
    const taxable0 = profit > 0 ? profit * (1 - exemptShare) : profit;
    const ptu = o.applyPTU && taxable0 > 0 ? taxable0 * (Number(o.ptuRate) || 0) : 0;
    let base = taxable0 - ptu;
    let used = 0;
    if (base > 0 && carry.losses > 0) {
      used = Math.min(base, carry.losses);
      base -= used;
      carry.losses -= used;
    } else if (base < 0) {
      carry.losses += -base;
      base = 0;
    }
    const tax = Math.max(0, base) * (Number(o.rate) || 0);
    return { ptu, tax, taxable: base, lossUsed: used, exemptShare };
  }

  /* ================================================================
     3 · everything, year by year
     ================================================================ */
  function build(f, p, market, budget) {
    const horizon = Math.max(1, Math.round(Number(p.horizon) || 1));
    const revenue = [];
    for (let t = 1; t <= horizon; t++) {
      const row = market && market.prog && market.prog.rows[t - 1];
      revenue.push(row ? row.total : 0);
    }
    const costs = (budget && budget.costs) || [];
    const dep = (budget && budget.depreciation.byYear) || new Array(horizon + 1).fill(0);
    const amo = (budget && budget.amortisation.byYear) || new Array(horizon + 1).fill(0);
    const schedule = (budget && budget.schedule) || [];
    const invest = t => (schedule[t] ? schedule[t].fixed + schedule[t].replacement : 0);
    const deferredInv = t => (schedule[t] ? schedule[t].deferred : 0);
    const wcInv = t => (schedule[t] ? schedule[t].workingCapital : 0);
    const wcNeed = (budget && budget.wc.need) || [];
    const salvage = (budget && budget.salvage) || { total: 0, assets: 0, land: 0, workingCapital: 0 };

    const L = loans({
      horizon,
      investment: (schedule[0] ? schedule[0].fixed : 0),
      deferred: (schedule[0] ? schedule[0].deferred : 0),
      workingCapital: wcNeed,
      longTermShare: f.longTermShare, longTermAmount: f.longTermAmount, longTermRate: f.longTermRate,
      longTermYears: f.longTermYears, longTermGrace: f.longTermGrace, longTermGraceType: f.longTermGraceType,
      longTermType: f.longTermType, fee: f.fee,
      seasonalShare: f.seasonalShare, seasonalRate: f.seasonalRate,
    });

    /* the opening fee is capitalised with the pre-operating investment and
       amortised, which is what keeps the balance sheet balancing */
    const feeAmortYears = Math.max(1, Math.round(Number(budget && budget.deferredLife) || 5));
    const feePerYear = L.fee > 0 ? L.fee / feeAmortYears : 0;

    const taxOpt = {
      rate: Number(p.tax.income) || 0,
      applyPTU: !!p.tax.applyPTU, ptuRate: Number(p.tax.ptu) || 0,
    };
    const exemptAmount = Project.exemptIncome(p).amount;

    const carryProject = { losses: 0 }, carryInvestor = { losses: 0 };
    const rows = [];
    for (let t = 1; t <= horizon; t++) {
      const c = costs[t - 1] || { cash: 0, variable: 0, fixed: 0, production: 0, volumeCost: 0, capacityCost: 0, unitVariable: 0 };
      /* The amortisation of the opening fee is a cost OF THE LOAN, so it only
         belongs to the investor: the project, which by definition has no debt,
         neither pays it nor deducts it. Keeping the two figures apart is what
         makes the project flow independent of how the project is financed. */
      const fee = t <= feeAmortYears ? feePerYear : 0;
      const ddProject = (dep[t] || 0) + (amo[t] || 0);
      const dd = ddProject + fee;
      const ebitProject = revenue[t - 1] - c.cash - ddProject;
      const ebit = revenue[t - 1] - c.cash - dd;
      const interest = L.interest[t] || 0;
      const ebt = ebit - interest;
      const opt = Object.assign({ revenue: revenue[t - 1], exempt: exemptAmount }, taxOpt);
      /* the project pays tax as if it had no debt; the investor gets the shield */
      const taxP = taxOf(ebitProject, opt, carryProject);
      const taxI = taxOf(ebt, opt, carryInvestor);
      rows.push({
        t, year: (Number(p.baseYear) || 0) + t,
        revenue: revenue[t - 1], cost: c.cash, variable: c.variable, fixed: c.fixed,
        depreciation: dd, depreciationProject: ddProject, feeAmortisation: fee,
        ebit, ebitProject, interest, ebt,
        ptu: taxI.ptu, tax: taxI.tax, taxProject: taxP.tax, ptuProject: taxP.ptu,
        net: ebt - taxI.ptu - taxI.tax,
        netProject: ebitProject - taxP.ptu - taxP.tax,
        lossUsed: taxI.lossUsed,
        production: c.production,
      });
    }

    /* ---------------- the two cash flows ---------------- */
    const projectFlow = [], investorFlow = [];
    /* year 0: only investment (and, for the investor, the loan) */
    const inv0 = invest(0) + deferredInv(0) + wcInv(0);
    projectFlow.push(-inv0);
    investorFlow.push(-inv0 + (L.received[0] || 0) - L.fee);
    for (let t = 1; t <= horizon; t++) {
      const r = rows[t - 1];
      const invT = invest(t) + deferredInv(t) + wcInv(t);
      const end = t === horizon ? salvage.total : 0;
      projectFlow.push(r.netProject + r.depreciationProject - invT + end);
      investorFlow.push(r.net + r.depreciation - invT + end
        + (L.received[t] || 0) - (L.principal[t] || 0)
        - (t === horizon ? (L.longTerm ? L.longTerm.leftover : 0) : 0));
    }

    /* ---------------- the balance sheet ----------------
       It is a going-concern statement: the balance of the last year is drawn
       BEFORE the project is wound up, so the salvage value and the settlement
       of the loan —which do belong in the cash flow— are not in it. Otherwise
       the assets would be counted twice, once in the cash they were sold for
       and once on the books.

       The owner puts in exactly what the loan does not cover, fee included, so
       the project starts with no idle cash. */
    const equity = Math.max(0, inv0 + L.fee - (L.received[0] || 0));
    const balance = [];
    let cash = equity + (L.received[0] || 0) - inv0 - L.fee;
    let retained = 0, accDep = 0, accAmo = 0;
    let accInv = invest(0), accDeferred = deferredInv(0) + L.fee;
    /* the working capital held is what has actually been advanced so far: the
       money goes out one year before the cycle that uses it, so following the
       need of the year would put the asset in the wrong year and the balance
       sheet would not balance */
    let accWC = wcInv(0);
    balance.push({
      t: 0, year: Number(p.baseYear) || 0,
      cash, workingCapital: wcInv(0), fixedNet: accInv, deferredNet: accDeferred,
      assets: cash + wcInv(0) + accInv + accDeferred,
      debt: (L.balance[0] || 0), liabilities: (L.balance[0] || 0),
      equity, retained, capital: equity,
      gap: (cash + wcInv(0) + accInv + accDeferred) - ((L.balance[0] || 0) + equity),
    });
    for (let t = 1; t <= horizon; t++) {
      const r = rows[t - 1];
      /* the cash of the balance sheet follows the operation, not the winding up */
      const operating = r.net + r.depreciation - (invest(t) + deferredInv(t) + wcInv(t))
        + (L.received[t] || 0) - (L.principal[t] || 0);
      cash += operating;
      accInv += invest(t);
      accDeferred += deferredInv(t);
      accWC += wcInv(t);
      accDep += (dep[t] || 0);
      accAmo += (amo[t] || 0) + (t <= feeAmortYears ? feePerYear : 0);
      retained += r.net;
      const wcHeld = accWC;
      const fixedNet = accInv - accDep;
      const deferredNet = accDeferred - accAmo;
      const debt = (L.balance[t] || 0);
      const assets = cash + wcHeld + fixedNet + deferredNet;
      balance.push({
        t, year: (Number(p.baseYear) || 0) + t,
        cash, workingCapital: wcHeld, fixedNet, deferredNet,
        assets, debt, liabilities: debt, retained, equity, capital: equity + retained,
        gap: assets - (debt + equity + retained),
      });
    }

    /* ---------------- break-even, year by year ---------------- */
    const breakeven = rows.map((r, i) => {
      const c = costs[i] || {};
      const prodRow = market && market.prog && market.prog.rows[i];
      const price = prodRow && prodRow.volume > 0 ? prodRow.revenue / prodRow.volume : (prodRow ? prodRow.effectivePrice : 0);
      const fixedForBE = (c.capacityCost || 0) + r.depreciation + r.interest;
      const be = Fin.breakeven({
        price, variableCost: c.unitVariable || 0, fixedCost: fixedForBE,
        capacity: prodRow ? prodRow.volume : 0,
      });
      return Object.assign({ t: r.t, year: r.year, price, fixedCost: fixedForBE, volume: prodRow ? prodRow.volume : 0 }, be);
    });

    /* ---------------- ratios ---------------- */
    const ratios = rows.map((r, i) => {
      const b = balance[i + 1];
      const service = (L.principal[r.t] || 0) + (L.interest[r.t] || 0);
      const operating = r.net + r.depreciation + r.interest;      /* before the debt service */
      return {
        t: r.t, year: r.year,
        margin: r.revenue > 0 ? r.net / r.revenue : null,
        roa: b && b.assets > 0 ? r.net / b.assets : null,
        roe: b && b.capital > 0 ? r.net / b.capital : null,
        leverage: b && b.assets > 0 ? b.liabilities / b.assets : null,
        coverage: r.interest > 0 ? r.ebit / r.interest : null,
        dscr: service > 0 ? operating / service : null,
        service,
      };
    });

    const model = {
      rows, projectFlow, investorFlow, balance, breakeven, ratios, loans: L,
      revenue, salvage, horizon,
      equityPut: balance[0].equity,
      cashLow: Math.min(...balance.map(b => b.cash)),
      cashLowYear: balance.reduce((a, b) => (b.cash < a.cash ? b : a), balance[0]).year,
      feeAmortYears,
    };
    model.messages = validate(model, f, p, market, budget);
    return model;
  }

  /* ================================================================
     4 · coherence
     ================================================================ */
  function validate(m, f, p, market, budget) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });

    if (!market || !market.prog || !market.prog.rows.length) {
      add('error', 'Faltan los ingresos del Bloque 3: sin ellos no hay estado de resultados.', 'The revenue of Block 3 is missing: without it there is no income statement.');
    }
    if (!budget || !budget.costs.length) {
      add('error', 'Falta el presupuesto del Bloque 4: sin costos ni inversión no hay estados financieros.', 'The budget of Block 4 is missing: with no costs or investment there are no statements.');
    }
    /* the balance sheet has to balance */
    const worst = m.balance.reduce((a, b) => (Math.abs(b.gap || 0) > Math.abs(a.gap || 0) ? b : a), m.balance[0]);
    if (Math.abs(worst.gap || 0) > Math.max(1, Math.abs(worst.assets) * 1e-6)) {
      add('error', `El balance no cuadra en el año ${worst.year} por ${fmtMoney(worst.gap, 2)}: hay un error en el modelo, no en tus datos. Repórtalo.`,
        `The balance sheet does not balance in ${worst.year} by ${fmtMoney(worst.gap, 2)}: there is a mistake in the model, not in your data. Please report it.`);
    }
    /* cash */
    if (m.cashLow < -1) {
      add('warning', `La caja se queda en ${fmtMoney(m.cashLow, 0)} en ${m.cashLowYear}: el proyecto puede ser rentable y aun así quedarse sin dinero. Necesitas más crédito, más aportación o menos ritmo de inversión.`,
        `Cash falls to ${fmtMoney(m.cashLow, 0)} in ${m.cashLowYear}: a project can be profitable and still run out of money. You need more credit, more equity or a slower investment pace.`);
    }
    /* the debt service */
    const bad = m.ratios.filter(r => r.dscr != null && r.dscr < 1.2 && r.service > 0);
    if (bad.length) {
      add('warning', `La cobertura del servicio de la deuda queda por debajo de 1.2 en ${plural(bad.length, 'año', 'años')} (el peor, ${fmtFixed(Math.min(...bad.map(r => r.dscr)), 2)}): un banco pediría reestructurar el plazo o la gracia.`,
        `The debt service coverage falls below 1.2 in ${bad.length} year(s) (the worst, ${fmtFixed(Math.min(...bad.map(r => r.dscr)), 2)}): a bank would ask for a longer term or a grace period.`);
    }
    /* the loan against the investment */
    const invTotal = budget ? budget.summary.initial : 0;
    if (m.loans.longTerm && invTotal > 0 && m.loans.longTerm.amount > invTotal) {
      add('error', 'El crédito es mayor que la inversión que financia.', 'The loan is larger than the investment it finances.');
    }
    if (m.loans.longTerm && (Number(f.longTermRate) || 0) < (Number(p.inflation) || 0)) {
      add('info', 'La tasa del crédito está por debajo de la inflación esperada: es un crédito subsidiado, y conviene decirlo en el estudio.',
        'The loan rate is below expected inflation: it is a subsidised loan, and it is worth saying so in the study.');
    }
    if (m.loans.longTerm && m.loans.longTerm.leftover > 1) {
      add('info', `El crédito no termina de pagarse dentro del horizonte: quedan ${fmtMoney(m.loans.longTerm.leftover, 0)} que se liquidan al cierre.`,
        `The loan is not fully repaid inside the horizon: ${fmtMoney(m.loans.longTerm.leftover, 0)} are settled at the end.`);
    }
    /* grace and gestation */
    if (p.gestation > 0 && m.loans.longTerm && (Number(f.longTermGrace) || 0) < p.gestation) {
      add('warning', `El proyecto no produce hasta el año ${p.gestation + 1} pero el crédito empieza a amortizar antes: pide una gracia de al menos ${p.gestation} años o el flujo no alcanzará.`,
        `The project does not produce until year ${p.gestation + 1} but the loan starts repaying earlier: ask for a grace period of at least ${p.gestation} years or the cash flow will not cover it.`);
    }
    /* losses */
    const lossYears = m.rows.filter(r => r.ebt < 0).length;
    if (lossYears === m.rows.length) {
      add('warning', 'El proyecto pierde dinero todos los años del horizonte, antes de descontar.', 'The project loses money in every year of the horizon, before any discounting.');
    } else if (lossYears > 0) {
      add('info', `Hay ${plural(lossYears, 'año', 'años')} con pérdida; se amortizan contra las utilidades de los años siguientes, como permite la ley.`,
        `There are ${lossYears} year(s) with a loss; they are carried forward against the profits of later years, as the law allows.`);
    }
    /* the exemption really biting */
    const exempt = Project.exemptIncome(p);
    if (exempt.amount > 0 && m.rows.some(r => r.revenue > 0 && exempt.amount >= r.revenue)) {
      add('info', 'La exención del sector primario cubre todo el ingreso de al menos un año: ese año el proyecto no paga impuesto sobre la renta.',
        'The primary sector exemption covers the whole income of at least one year: in that year the project pays no income tax.');
    }
    return out;
  }

  window.FinState = { loans, taxOf, build, validate };
})();
