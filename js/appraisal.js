/* EconomicsPro — Block 6: financial appraisal.

   The two cash flows that Block 5 built are discounted here, and the project
   finally gets a verdict. Nothing is computed twice: the indicators come from
   finance.js, which the unit tests check against the textbooks; what this file
   adds is the part that is easy to get wrong.

   · EACH FLOW WITH ITS OWN RATE. The flow of the project is discounted at the
     cost of the whole capital (the WACC, or the MARR when there is no debt);
     the flow of the investor, at the cost of the owner's own money, which is
     dearer because the owner is paid last. Using the WACC on the investor's
     flow — which has already been helped by the loan — counts the benefit of
     the debt twice, and it is the commonest way of making a project look
     better than it is.
   · THE NPV, TAKEN APART. Present value of the revenue, of the costs, of the
     tax, of the investment and of the salvage: they add up to exactly the NPV,
     so anyone can see where the result comes from instead of trusting a single
     number.
   · MARGINAL ANALYSIS. Comparing technologies is not the same as appraising a
     project: it is done with partial budgets, dominance and the marginal rate
     of return, the way Perrin, Winkelmann, Moscardi and Anderson set it out
     for CIMMYT in 1976 and the way it is still asked for in an agronomy
     thesis. */

(function () {

  /* ================================================================
     1 · the rates each flow deserves
     ================================================================ */

  /* The cost of the owner's own money, taken from however the rate of Block 2
     was built, and expressed on the same basis (real or nominal) as the study. */
  function equityRate(p) {
    const r = p.rate || {};
    const inf = Number(p.inflation) || 0;
    let nominal;
    if (r.mode === 'wacc') nominal = Number(r.costEquity) || 0;
    else if (r.mode === 'capm') nominal = Fin.capm(Number(r.rf) || 0, Number(r.beta) || 0, Number(r.marketPremium) || 0, Number(r.countryRisk) || 0);
    else return Project.rates(p).used;            /* a MARR, or a rate typed in, is already the owner's */
    return p.priceBasis === 'current' ? nominal : Fin.realRate(nominal, inf);
  }

  /* ================================================================
     2 · where the NPV comes from
     ================================================================ */

  /* The present value of each piece of the project flow. The pieces add up to
     the NPV exactly, which is what makes the waterfall figure honest and is
     checked in the tests. */
  function decompose(st, rate) {
    const d = t => Math.pow(1 + rate, -t);
    let revenue = 0, cost = 0, tax = 0, investment = 0, salvage = 0;
    st.rows.forEach(r => {
      revenue += r.revenue * d(r.t);
      cost += r.cost * d(r.t);
      tax += (r.taxProject + r.ptuProject) * d(r.t);
    });
    /* The investment of every year — replacements and working capital
       included — is read back from the flow itself, so that no item can be
       forgotten and the pieces add up to the NPV exactly. */
    st.projectFlow.forEach((v, t) => {
      if (t === 0) { investment += -v * d(0); return; }
      const r = st.rows[t - 1];
      const operation = r.netProject + r.depreciationProject;
      const end = t === st.rows.length ? st.salvage.total : 0;
      const inv = operation + end - v;                 /* v = operation − inv + end */
      investment += inv * d(t);
      if (end) salvage += end * d(t);
    });
    const npv = revenue - cost - tax - investment + salvage;
    return { revenue, cost, tax, investment, salvage, npv };
  }

  /* ================================================================
     3 · the appraisal itself
     ================================================================ */
  function build(a, p, st) {
    const rates = Project.rates(p);
    const rateProject = a.rateProject != null && a.rateProject !== '' ? Number(a.rateProject) : rates.used;
    const rateEquity = a.rateEquity != null && a.rateEquity !== '' ? Number(a.rateEquity) : equityRate(p);
    const n = st.horizon;

    const project = Fin.appraise(st.projectFlow, rateProject, { reinvestRate: rateProject, financeRate: rateProject });
    const investor = Fin.appraise(st.investorFlow, rateEquity, { reinvestRate: rateEquity, financeRate: rateEquity });

    /* Gittinger's gross benefit–cost ratio needs the two streams apart, and it
       has to be built from the same numbers as the NPV, not from a different
       reading of the project */
    const benefits = [0], costsStream = [0];
    benefits[0] = 0;
    costsStream[0] = -st.projectFlow[0];
    st.rows.forEach(r => {
      const end = r.t === st.rows.length ? st.salvage.total : 0;
      const operation = r.netProject + r.depreciationProject;
      const inv = operation + end - st.projectFlow[r.t];
      benefits.push(r.revenue + end);
      costsStream.push(r.cost + r.taxProject + r.ptuProject + inv);
    });
    project.bc = Fin.bcRatio(benefits, costsStream, rateProject);
    investor.bc = Fin.bcRatio(
      st.investorFlow.map(v => Math.max(0, v)),
      st.investorFlow.map(v => Math.max(0, -v)),
      rateEquity);

    const parts = decompose(st, rateProject);

    /* the profile of the NPV against the discount rate, for the figure */
    const maxRate = Math.max(0.4, (project.irr == null ? rateProject * 2 : project.irr * 1.6), rateProject * 1.8);
    const profile = [];
    for (let r = 0; r <= maxRate + 1e-9; r += maxRate / 90) {
      profile.push({ rate: r, project: Fin.npv(r, st.projectFlow), investor: Fin.npv(r, st.investorFlow) });
    }

    const model = {
      rateProject, rateEquity, rates, project, investor, parts, profile, horizon: n,
      automatic: { project: rates.used, equity: equityRate(p) },
      flows: { project: st.projectFlow, investor: st.investorFlow },
    };
    model.verdict = verdict(model, p);
    model.messages = validate(model, p, st);
    return model;
  }

  /* The sentence a thesis can copy, and that the report of Block 10 will use. */
  function verdict(m, p) {
    const pr = m.project, inv = m.investor;
    const es = [], en = [];
    if (pr.npv > 0) {
      es.push(`Con una tasa de ${fmtPct(m.rateProject, 2)}, el proyecto tiene un valor actual neto de ${fmtMoney(pr.npv, 0)} y ${pr.irr == null ? 'no tiene tasa interna de retorno definida' : `una tasa interna de retorno de ${fmtPct(pr.irr, 2)}`}: conviene realizarlo.`);
      en.push(`At a rate of ${fmtPct(m.rateProject, 2)}, the project has a net present value of ${fmtMoney(pr.npv, 0)} and ${pr.irr == null ? 'no defined internal rate of return' : `an internal rate of return of ${fmtPct(pr.irr, 2)}`}: it is worth doing.`);
    } else {
      es.push(`Con una tasa de ${fmtPct(m.rateProject, 2)}, el valor actual neto del proyecto es ${fmtMoney(pr.npv, 0)}${pr.irr == null ? '' : ` y su tasa interna de retorno, ${fmtPct(pr.irr, 2)}`}: a esa tasa no conviene realizarlo.`);
      en.push(`At a rate of ${fmtPct(m.rateProject, 2)}, the net present value of the project is ${fmtMoney(pr.npv, 0)}${pr.irr == null ? '' : ` and its internal rate of return is ${fmtPct(pr.irr, 2)}`}: at that rate it is not worth doing.`);
    }
    es.push(`Cada peso invertido devuelve ${fmtFixed(pr.bc, 2)} pesos de beneficio en valor presente, la inversión se recupera ${pr.discountedPayback == null ? 'fuera del horizonte' : `en ${fmtFixed(pr.discountedPayback, 1)} años`} y el proyecto equivale a ${fmtMoney(pr.eaa, 0)} al año durante ${m.horizon} años.`);
    en.push(`Every peso of cost returns ${fmtFixed(pr.bc, 2)} pesos of benefit in present value, the investment is recovered ${pr.discountedPayback == null ? 'beyond the horizon' : `in ${fmtFixed(pr.discountedPayback, 1)} years`}, and the project is equivalent to ${fmtMoney(pr.eaa, 0)} a year for ${m.horizon} years.`);
    if (Math.abs(inv.npv - pr.npv) > 1) {
      const better = inv.npv > pr.npv;
      es.push(`Para el dueño, descontando su propio flujo al ${fmtPct(m.rateEquity, 2)}, el valor actual neto es ${fmtMoney(inv.npv, 0)}${inv.irr == null ? '' : ` y la tasa interna, ${fmtPct(inv.irr, 2)}`}: el crédito ${better ? 'mejora' : 'empeora'} el resultado del inversionista.`);
      en.push(`For the owner, discounting their own flow at ${fmtPct(m.rateEquity, 2)}, the net present value is ${fmtMoney(inv.npv, 0)}${inv.irr == null ? '' : ` and the internal rate is ${fmtPct(inv.irr, 2)}`}: the loan ${better ? 'improves' : 'worsens'} the investor's result.`);
    }
    return { es: es.join(' '), en: en.join(' ') };
  }

  /* ================================================================
     4 · partial budgets and marginal analysis (CIMMYT)
     ================================================================ */

  /* Compares technologies, not projects: each treatment has a yield and the
     costs that change between one and another (only those, never the costs
     that are the same for all of them). The yield is adjusted downwards
     because an experimental plot yields more than a farmer's field, the field
     price is what the farmer really receives, and what is compared is the net
     benefit.

     Then: dominance —a treatment that costs more and returns less is thrown
     out— and the marginal rate of return between the ones that survive, which
     says how much the farmer earns for each extra peso spent. */
  function marginal(o) {
    const adj = Math.min(0.9, Math.max(0, Number(o.adjust) || 0));
    const price = Number(o.price) || 0;
    const rows = (o.treatments || []).map((t, i) => {
      const yieldT = Number(t.yield) || 0;
      const adjusted = yieldT * (1 - adj);
      const varCost = Number(t.cost) || 0;
      const priceT = t.price != null && t.price !== '' ? Number(t.price) : price;
      const gross = adjusted * priceT;
      return {
        i, name: t.name, yield: yieldT, adjusted, price: priceT,
        gross, varCost, net: gross - varCost,
      };
    }).filter(r => r.yield > 0 || r.varCost > 0);

    /* ordered by what they cost, which is how the analysis is read */
    rows.sort((a, b) => a.varCost - b.varCost || a.net - b.net);
    /* dominance: anything that does not beat the best net benefit seen so far
       while costing more is dominated */
    let bestNet = -Infinity;
    rows.forEach(r => {
      if (r.net > bestNet + 1e-9) { r.dominated = false; bestNet = r.net; }
      else r.dominated = true;
    });
    /* the marginal rate of return between consecutive undominated treatments */
    const kept = rows.filter(r => !r.dominated);
    kept.forEach((r, k) => {
      if (k === 0) { r.mrr = null; return; }
      const prev = kept[k - 1];
      const dCost = r.varCost - prev.varCost;
      const dNet = r.net - prev.net;
      r.mrr = dCost > 0 ? dNet / dCost : null;
      r.dCost = dCost; r.dNet = dNet;
    });
    const minimum = Number(o.minimumRate) || 1;      /* the usual rule of thumb: 100 % */
    /* the recommendation is the most expensive treatment that still earns the
       minimum rate on every extra peso up to it */
    let recommended = kept.length ? kept[0] : null;
    for (let k = 1; k < kept.length; k++) {
      if (kept[k].mrr != null && kept[k].mrr >= minimum) recommended = kept[k];
      else break;
    }
    return { rows, kept, recommended, adjust: adj, minimum };
  }

  /* ================================================================
     5 · coherence
     ================================================================ */
  function validate(m, p, st) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });

    if (!st || !st.projectFlow.length) {
      add('error', 'No hay flujos que evaluar: revisa los bloques anteriores.', 'There are no flows to appraise: check the previous blocks.');
      return out;
    }
    if (m.project.multipleIRR) {
      add('warning', `Los flujos cambian de signo ${m.project.irrAll.length} veces, así que hay ${m.project.irrAll.length} tasas internas de retorno (${m.project.irrAll.map(r => fmtPct(r, 1)).join(', ')}). Usa el VAN y la TIR modificada, no la TIR.`,
        `The flows change sign ${m.project.irrAll.length} times, so there are ${m.project.irrAll.length} internal rates of return (${m.project.irrAll.map(r => fmtPct(r, 1)).join(', ')}). Use the NPV and the modified IRR, not the IRR.`);
    }
    if (m.project.irr == null) {
      add('info', 'El flujo del proyecto no tiene tasa interna de retorno: no existe ninguna tasa que haga cero su valor presente. El VAN sigue siendo válido.',
        'The project flow has no internal rate of return: there is no rate that makes its present value zero. The NPV is still valid.');
    }
    if (m.rateEquity < m.rateProject - 1e-9) {
      add('warning', `La tasa del inversionista (${fmtPct(m.rateEquity, 2)}) es menor que la del proyecto (${fmtPct(m.rateProject, 2)}); normalmente es al revés, porque el dueño cobra al final y arriesga más que el banco.`,
        `The investor's rate (${fmtPct(m.rateEquity, 2)}) is below the project's (${fmtPct(m.rateProject, 2)}); it is usually the other way round, because the owner is paid last and risks more than the bank.`);
    }
    if (m.project.npv > 0 && m.investor.npv <= 0) {
      add('warning', 'El proyecto conviene pero el inversionista pierde: el crédito cuesta más de lo que el proyecto rinde, o el dueño exige demasiado a su propio dinero.',
        'The project is worth doing but the investor loses: the loan costs more than the project earns, or the owner demands too much from their own money.');
    }
    if (m.project.npv <= 0 && m.investor.npv > 0) {
      add('info', 'El proyecto no conviene por sí mismo, pero al dueño sí le conviene por el crédito: el resultado depende del financiamiento, no de la idea.',
        'The project is not worth doing on its own, but it is for the owner because of the loan: the result depends on the financing, not on the idea.');
    }
    if (m.project.discountedPayback == null) {
      add('info', 'La inversión no se recupera, en valor presente, dentro del horizonte evaluado.', 'The investment is not recovered, in present value, inside the horizon appraised.');
    }
    /* how fragile the verdict is */
    const half = Fin.npv(m.rateProject + 0.02, m.flows.project);
    if (m.project.npv > 0 && half <= 0) {
      add('warning', `Con dos puntos más de tasa (${fmtPct(m.rateProject + 0.02, 2)}) el VAN ya sería negativo: el resultado es frágil y hay que llevarlo al Bloque 7.`,
        `Two points more of discount rate (${fmtPct(m.rateProject + 0.02, 2)}) would already make the NPV negative: the verdict is fragile and belongs in Block 7.`);
    }
    if (m.project.irr != null && m.project.irr > 1) {
      add('info', `Una tasa interna de ${fmtPct(m.project.irr, 0)} suele indicar que el proyecto tiene muy poca inversión frente a sus beneficios; revisa que la inversión esté completa.`,
        `An internal rate of ${fmtPct(m.project.irr, 0)} usually means the investment is very small next to the benefits; check that the investment is complete.`);
    }
    return out;
  }

  window.Appraisal = { equityRate, decompose, build, verdict, marginal, validate };
})();
