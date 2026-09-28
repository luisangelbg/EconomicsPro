/* EconomicsPro — the report of Block 10.

   Everything the nine blocks computed, written out as the document a thesis, a
   business plan or a public investment file has to hand in: the assumptions,
   the tables, the figures, the indicators, the risk, the social appraisal and
   the decisions, followed by a methodology that says what was done and with
   which formula, and a calculation record that shows the arithmetic with the
   real numbers substituted, which is what a reviewer asks for when the result
   is questioned.

   The file that leaves is a single .html that stands on its own: no styles from
   the app, no scripts, the figures inside it as SVG. It opens in any browser
   and prints to PDF from there, which is how a student without Word gets a
   formatted document. */

(function () {

  const L = () => (typeof I18N !== 'undefined' && I18N.lang === 'en' ? 'en' : 'es');
  const esc2 = s => esc(s == null ? '' : String(s));

  /* ================================================================
     small builders
     ================================================================ */
  function tbl(head, rows, opt) {
    const o = opt || {};
    if (!rows || !rows.length) return '';
    return `<table class="${o.cls || ''}"><thead><tr>${head.map((h, i) =>
      `<th${i && !o.leftAll ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r =>
        `<tr${r.cls ? ` class="${r.cls}"` : ''}>${(r.cells || r).map((c, i) =>
          `<td${i && !o.leftAll ? ' class="num"' : ''}>${c == null ? '—' : c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  const P_ = html => `<p>${html}</p>`;
  const money = (v, d) => fmtMoney(v, d == null ? 0 : d);
  const pct = (v, d) => fmtPct(v, d == null ? 2 : d);

  /* the figures of a block, baked so they travel alone */
  function figuresOf(block, want) {
    if (!want) return '';
    return Fig.CATALOG.filter(f => f.block === block).map(f => {
      const src = Fig.sourceOf(f.id);
      if (!src) return '';
      const svg = Fig.compose(src, { title: T(f.es, f.en), theme: 'light', background: 'card' });
      return `<figure>${Fig.bake(new XMLSerializer().serializeToString(svg), 'light')}</figure>`;
    }).join('');
  }

  /* ================================================================
     the sections
     ================================================================ */

  function coverAndSummary(o) {
    const p = state.project, ap = state.appraisal;
    const today = new Date();
    const date = today.toLocaleDateString(L() === 'en' ? 'en-GB' : 'es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    let html = `<header class="cover">
      <div class="kicker">${T('Estudio de evaluación económica y financiera', 'Economic and financial appraisal study')}</div>
      <h1>${esc2(p.name || T('Proyecto sin nombre', 'Untitled project'))}</h1>
      <div class="sub">${esc2(p.location || '')}${p.location && o.author ? ' · ' : ''}${esc2(o.author || '')}</div>
      ${o.institution ? `<div class="sub">${esc2(o.institution)}</div>` : ''}
      <div class="sub muted">${date}</div>
    </header>`;
    if (ap) {
      html += `<section><h2>${T('Resumen', 'Summary')}</h2>`;
      html += P_(esc2(T(ap.verdict.es, ap.verdict.en)));
      html += tbl([T('Indicador', 'Indicator'), T('Proyecto', 'Project'), T('Inversionista', 'Investor')], [
        [T('Tasa de descuento', 'Discount rate'), pct(ap.rateProject), pct(ap.rateEquity)],
        [T('Valor actual neto', 'Net present value'), money(ap.project.npv), money(ap.investor.npv)],
        [T('Tasa interna de retorno', 'Internal rate of return'), fmtRate(ap.project.irr, 2), fmtRate(ap.investor.irr, 2)],
        [T('Relación beneficio–costo', 'Benefit–cost ratio'), fmtFixed(ap.project.bc, 2), fmtFixed(ap.investor.bc, 2)],
        [T('Índice de rentabilidad', 'Profitability index'), fmtFixed(ap.project.pi, 2), fmtFixed(ap.investor.pi, 2)],
        [T('Recuperación descontada (años)', 'Discounted payback (years)'),
          ap.project.discountedPayback == null ? '—' : fmtFixed(ap.project.discountedPayback, 1),
          ap.investor.discountedPayback == null ? '—' : fmtFixed(ap.investor.discountedPayback, 1)],
        [T('Valor anual equivalente', 'Equivalent annual value'), money(ap.project.eaa), money(ap.investor.eaa)],
      ]);
      html += '</section>';
    }
    return html;
  }

  function projectSection(o) {
    const p = state.project;
    const r = Project.rates(p);
    const kind = Project.KINDS[p.kind] || {};
    let html = `<section><h2>§. ${T('El proyecto y sus supuestos', 'The project and its assumptions')}</h2>`;
    html += P_(T(
      `El proyecto es ${esc2(T(kind.es, kind.en) || '')}, con una escala de ${fmtNum(p.scale)} ${esc2(T(p.unitName, p.unitName))} y un horizonte de evaluación de ${p.horizon} años a partir de ${p.baseYear}${p.gestation ? `, con ${plural(p.gestation, 'año', 'años')} de gestación antes de la primera cosecha` : ''}. La evaluación se hace a precios ${p.priceBasis === 'current' ? 'corrientes' : 'constantes'} de ${p.baseYear}, en ${esc2(Money.code)}.`,
      `The project is ${esc2(T(kind.es, kind.en) || '')}, at a scale of ${fmtNum(p.scale)} ${esc2(p.unitName)} and an appraisal horizon of ${p.horizon} years from ${p.baseYear}${p.gestation ? `, with ${plural(p.gestation, 'year', 'years')} of gestation before the first harvest` : ''}. The appraisal is made at ${p.priceBasis === 'current' ? 'current' : 'constant'} prices of ${p.baseYear}, in ${esc2(Money.code)}.`));
    html += P_(T(
      `La tasa de descuento se construyó como ${esc2(r.es)} La evaluación usa ${pct(r.used)} ${p.priceBasis === 'current' ? '(nominal, porque los precios son corrientes)' : '(real, porque los precios son constantes)'}.`,
      `The discount rate was built as ${esc2(r.en)} The appraisal uses ${pct(r.used)} ${p.priceBasis === 'current' ? '(nominal, because prices are current)' : '(real, because prices are constant)'}.`));
    html += tbl([T('Supuesto', 'Assumption'), T('Valor', 'Value')], [
      [T('Unidad productiva', 'Productive unit'), `${fmtNum(p.scale)} ${esc2(p.unitName)}`],
      [T('Horizonte', 'Horizon'), `${p.horizon} ${T('años', 'years')} (${p.baseYear}–${p.baseYear + p.horizon})`],
      [T('Gestación y maduración', 'Gestation and ramp-up'), `${p.gestation} + ${p.ramp} ${T('años', 'years')}`],
      [T('Inflación supuesta', 'Assumed inflation'), pct(p.inflation)],
      [T('Tasa nominal / real', 'Nominal / real rate'), `${pct(r.nominal)} / ${pct(r.real)}`],
      [T('Impuesto sobre la renta', 'Income tax'), pct(p.tax.income)],
      [T('Reparto de utilidades', 'Profit sharing'), pct(p.tax.ptu)],
      [T('Régimen', 'Regime'), p.tax.primary ? T('Sector primario, con la exención del artículo 74 de la LISR', 'Primary sector, with the exemption of article 74 of the income tax law') : T('General', 'General')],
      [T('Valor de rescate', 'Salvage value'), pct(p.salvage)],
    ], { leftAll: false });
    html += figuresOf(2, o.figures);
    if (p.notes) html += P_(`<b>${T('Notas', 'Notes')}:</b> ${esc2(p.notes)}`);
    return html + '</section>';
  }

  function marketSection(o) {
    const m = state.market, p = state.project;
    if (!m || !m.prog) return '';
    const prog = m.prog, full = prog.atFull;
    let html = `<section><h2>§. ${T('Mercado, precios e ingresos', 'Market, prices and revenue')}</h2>`;
    if (m.priceDesc && m.priceFc) {
      const tr = m.priceDesc.trend;
      const how = m.priceFc.note ? T(m.priceFc.note[0], m.priceFc.note[1]) : m.priceFc.method;
      const last = m.priceFc.values[m.priceFc.values.length - 1];
      html += P_(T(
        `La serie de precios de ${m.priceDesc.n} años ${!tr ? 'no alcanza para probar una tendencia' : `${tr.b > 0 ? 'crece' : 'baja'} ${money(Math.abs(tr.b), 2)} al año en términos reales (${tr.p == null ? 'sin prueba' : `${pEq(tr.p)}`})`}. La proyección se hizo por ${esc2(how)} y llega a ${money(last ? last.value : null, 2)} al final del horizonte.`,
        `The price series of ${m.priceDesc.n} years ${!tr ? 'is too short to test a trend' : `${tr.b > 0 ? 'grows' : 'falls'} by ${money(Math.abs(tr.b), 2)} a year in real terms (${tr.p == null ? 'not tested' : `${pEq(tr.p)}`})`}. The forecast was made by ${esc2(how)} and reaches ${money(last ? last.value : null, 2)} at the end of the horizon.`));
    }
    if (full) {
      html += P_(T(
        `A plena producción el proyecto obtiene ${fmtNum(full.production)} unidades de producto al año y vende ${fmtNum(full.volume)}, con un precio efectivo de ${money(full.effectivePrice, 2)} y un ingreso anual de ${money(full.total)}.`,
        `At full production the project obtains ${fmtNum(full.production)} units of output a year and sells ${fmtNum(full.volume)}, at an effective price of ${money(full.effectivePrice, 2)} and an annual revenue of ${money(full.total)}.`));
    }
    html += tbl([T('Año', 'Year'), T('Rendimiento', 'Yield'), T('Producción', 'Output'), T('Precio', 'Price'), T('Ingreso', 'Revenue')],
      prog.rows.map(r => [r.year, fmtFixed(r.yield, 2), fmtNum(r.production), money(r.effectivePrice, 2), money(r.total)]));
    html += figuresOf(3, o.figures);
    return html + '</section>';
  }

  function budgetSection(o) {
    const b = state.budget;
    if (!b) return '';
    const s = b.summary;
    let html = `<section><h2>§. ${T('Inversión, costos y capital de trabajo', 'Investment, costs and working capital')}</h2>`;
    html += P_(T(
      `La inversión inicial suma ${money(s.initial)}: ${money(s.fixedInvestment)} de inversión fija, ${money(s.deferred)} de inversión diferida y ${money(s.workingCapital)} de capital de trabajo${s.replacements > 0 ? `. A lo largo del horizonte se reponen activos por ${money(s.replacements)}` : ''}.`,
      `The initial investment adds up to ${money(s.initial)}: ${money(s.fixedInvestment)} of fixed investment, ${money(s.deferred)} of deferred investment and ${money(s.workingCapital)} of working capital${s.replacements > 0 ? `. Over the horizon, assets are replaced for ${money(s.replacements)}` : ''}.`));
    html += P_(T(
      `A plena producción el costo de operación es de ${money(s.costAtFull)} al año${s.perUnitAtFull ? `, es decir ${money(s.perUnitAtFull, 2)} por unidad productiva` : ''}${s.perOutputAtFull ? ` y ${money(s.perOutputAtFull, 2)} por unidad producida` : ''}${s.variableShare != null ? `; ${pct(s.variableShare, 0)} de ese costo es variable` : ''}.`,
      `At full production the operating cost is ${money(s.costAtFull)} a year${s.perUnitAtFull ? `, that is ${money(s.perUnitAtFull, 2)} per productive unit` : ''}${s.perOutputAtFull ? ` and ${money(s.perOutputAtFull, 2)} per unit produced` : ''}${s.variableShare != null ? `; ${pct(s.variableShare, 0)} of that cost is variable` : ''}.`));
    html += tbl([T('Concepto', 'Item'), T('Monto', 'Amount')], [
      [T('Inversión fija', 'Fixed investment'), money(s.fixedInvestment)],
      [T('Inversión diferida', 'Deferred investment'), money(s.deferred)],
      [T('Capital de trabajo', 'Working capital'), money(s.workingCapital)],
      [T('Inversión inicial', 'Initial investment'), `<b>${money(s.initial)}</b>`],
      [T('Reposiciones en el horizonte', 'Replacements over the horizon'), money(s.replacements)],
      [T('Valor de rescate al final', 'Salvage value at the end'), money(b.salvage ? b.salvage.total : 0)],
    ]);
    html += tbl([T('Año', 'Year'), T('Costo variable', 'Variable cost'), T('Costo fijo', 'Fixed cost'), T('Depreciación', 'Depreciation'), T('Inversión', 'Investment')],
      b.costs.map((c, i) => [(state.project.baseYear || 0) + c.t, money(c.variable), money(c.fixed), money(b.depreciation.byYear[c.t] + b.amortisation.byYear[c.t]), money(b.schedule[c.t] || 0)]));
    html += figuresOf(4, o.figures);
    return html + '</section>';
  }

  function statementsSection(o) {
    const st = state.statements;
    if (!st) return '';
    let html = `<section><h2>§. ${T('Financiamiento y estados proforma', 'Financing and pro-forma statements')}</h2>`;
    const p = state.project, F = p.finance || {};
    const L1 = st.loans && st.loans.longTerm;
    if (L1 && L1.amount > 0) {
      const grace = Number(F.longTermGrace) || 0;
      const firstFull = L1.rows[grace] || L1.rows[0];
      html += P_(T(
        `El proyecto se financia con un crédito refaccionario de ${money(L1.amount)} a ${F.longTermYears} años y ${pct(F.longTermRate)} de interés${grace ? `, con ${plural(grace, 'año', 'años')} de gracia` : ''}. El pago del primer año completo es de ${money(firstFull ? firstFull.payment : L1.payment)} y el interés total del crédito suma ${money(L1.totalInterest)}.`,
        `The project is financed with a long-term loan of ${money(L1.amount)} over ${F.longTermYears} years at ${pct(F.longTermRate)}${grace ? `, with ${plural(grace, 'year', 'years')} of grace` : ''}. The payment of the first full year is ${money(firstFull ? firstFull.payment : L1.payment)} and the interest over the life of the loan adds up to ${money(L1.totalInterest)}.`));
    } else {
      html += P_(T('El proyecto se financia enteramente con recursos propios.', 'The project is financed entirely with the owner\u2019s own resources.'));
    }
    html += P_(T(
      `El saldo de caja más bajo del horizonte es de ${money(st.cashLow)} en ${st.cashLowYear}${st.cashLow < 0 ? ', lo que obliga a prever esa necesidad de liquidez antes de arrancar' : ''}. El balance general cierra en todos los años.`,
      `The lowest cash balance of the horizon is ${money(st.cashLow)} in ${st.cashLowYear}${st.cashLow < 0 ? ', which means that need for liquidity has to be provided for before starting' : ''}. The balance sheet closes in every year.`));
    html += tbl([T('Año', 'Year'), T('Ingreso', 'Revenue'), T('Costo', 'Cost'), T('Depreciación', 'Depreciation'), T('Intereses', 'Interest'), T('Impuestos', 'Taxes'), T('Utilidad neta', 'Net profit'), T('Flujo del proyecto', 'Project flow'), T('Flujo del inversionista', 'Investor flow')],
      st.rows.map(r => [r.year, money(r.revenue), money(r.cost), money(r.depreciation), money(r.interest),
        money(r.tax + r.ptu), money(r.net), money(st.projectFlow[r.t]), money(st.investorFlow[r.t])]));
    html += figuresOf(5, o.figures);
    return html + '</section>';
  }

  function appraisalSection(o) {
    const ap = state.appraisal;
    if (!ap) return '';
    let html = `<section><h2>§. ${T('Evaluación financiera', 'Financial appraisal')}</h2>`;
    html += P_(esc2(T(ap.verdict.es, ap.verdict.en)));
    const a = ap.parts;
    html += `<h3>${T('De dónde sale el valor actual neto', 'Where the net present value comes from')}</h3>`;
    html += tbl([T('Componente', 'Component'), T('Valor presente', 'Present value')], [
      [T('Ingresos', 'Revenue'), money(a.revenue)],
      [T('Costos de operación', 'Operating costs'), money(-a.cost)],
      [T('Impuestos', 'Taxes'), money(-a.tax)],
      [T('Inversión', 'Investment'), money(-a.investment)],
      [T('Valor de rescate', 'Salvage value'), money(a.salvage)],
      { cls: 'total', cells: [`<b>${T('Valor actual neto', 'Net present value')}</b>`, `<b>${money(ap.project.npv)}</b>`] },
    ]);
    if (ap.marginal && ap.marginal.rows && ap.marginal.rows.length) {
      const mg = ap.marginal;
      html += `<h3>${T('Análisis marginal de los tratamientos (CIMMYT)', 'Marginal analysis of the treatments (CIMMYT)')}</h3>`;
      html += tbl([T('Tratamiento', 'Treatment'), T('Rendimiento ajustado', 'Adjusted yield'), T('Costo variable', 'Variable cost'), T('Beneficio neto', 'Net benefit'), T('Tasa de retorno marginal', 'Marginal rate of return')],
        mg.rows.map(r => [esc2(r.name), fmtFixed(r.adjusted, 2), money(r.varCost), money(r.net),
          r.dominated ? T('dominado', 'dominated') : (r.mrr == null ? '—' : pct(r.mrr, 0))]));
      if (mg.recommended) {
        html += P_(T(
          `Con una tasa mínima de retorno marginal de ${pct(mg.minimum, 0)}, el tratamiento recomendado es «${esc2(mg.recommended.name)}».`,
          `With a minimum marginal rate of return of ${pct(mg.minimum, 0)}, the recommended treatment is "${esc2(mg.recommended.name)}".`));
      }
    }
    html += figuresOf(6, o.figures);
    return html + '</section>';
  }

  function riskSection(o) {
    const r = state.risk;
    if (!r) return '';
    let html = `<section><h2>§. ${T('Riesgo e incertidumbre', 'Risk and uncertainty')}</h2>`;
    const sw = (r.switching || []).filter(s => s.change != null);
    if (sw.length) {
      const first = sw[0];
      html += P_(T(
        `La variable más frágil es ${esc2(T(first.es, first.en))}: el proyecto deja de ser rentable si cambia ${pct(Math.abs(first.change), 1)} respecto del supuesto. El orden de fragilidad, de la más frágil a la más robusta, es ${sw.map(s => esc2(T(s.es, s.en))).join(', ')}.`,
        `The most fragile variable is ${esc2(T(first.es, first.en))}: the project stops being worthwhile if it changes by ${pct(Math.abs(first.change), 1)} from the assumption. The order of fragility, from the most fragile to the most robust, is ${sw.map(s => esc2(T(s.es, s.en))).join(', ')}.`));
      html += tbl([T('Variable', 'Variable'), T('Cambio que lleva el VAN a cero', 'Change that takes the NPV to zero'), T('Queda en', 'It ends at')],
        sw.map(s => [esc2(T(s.es, s.en)), pct(s.change, 1), s.multiplier == null ? '—' : fmtFixed(s.multiplier, 3) + ' × ' + T('el supuesto', 'the assumption')]));
    }
    if (r.scenarios && r.scenarios.list && r.scenarios.list.length) {
      html += `<h3>${T('Escenarios', 'Scenarios')}</h3>`;
      html += tbl([T('Escenario', 'Scenario'), T('Probabilidad', 'Probability'), T('VAN', 'NPV')],
        r.scenarios.list.map(s => [esc2(s.name), pct(s.probability, 0), money(s.npv)]));
      if (r.scenarios.expected != null) {
        html += P_(T(`El valor esperado del VAN es de ${money(r.scenarios.expected)}.`,
          `The expected NPV is ${money(r.scenarios.expected)}.`));
      }
    }
    if (r.sim && r.sim.values && r.sim.values.length) {
      const s = r.sim;
      html += `<h3>${T('Simulación de Monte Carlo', 'Monte Carlo simulation')}</h3>`;
      html += P_(T(
        `Con ${fmtNum(s.n)} corridas, el VAN medio es de ${money(s.mean)} y la probabilidad de que el proyecto pierda dinero es de ${pct(s.pLoss, 1)}. El intervalo del 90 % va de ${money(s.p05)} a ${money(s.p95)}.`,
        `With ${fmtNum(s.n)} runs, the mean NPV is ${money(s.mean)} and the probability that the project loses money is ${pct(s.pLoss, 1)}. The 90 % interval runs from ${money(s.p05)} to ${money(s.p95)}.`));
    }
    html += figuresOf(7, o.figures);
    return html + '</section>';
  }

  function socialSection(o) {
    const so = state.social;
    if (!so) return '';
    const i = so.indicators;
    let html = `<section><h2>§. ${T('Evaluación económica y social', 'Economic and social appraisal')}</h2>`;
    html += P_(T(
      `Descontado a la tasa social de ${pct(so.socialRate)} y con los precios cuenta, el proyecto tiene un valor actual neto económico de ${money(so.economic.npv)} y ${so.economic.irr == null ? 'no tiene tasa interna definida' : `una tasa interna de retorno económica de ${pct(so.economic.irr)}`}.`,
      `Discounted at the social rate of ${pct(so.socialRate)} and with accounting prices, the project has an economic net present value of ${money(so.economic.npv)} and ${so.economic.irr == null ? 'no defined internal rate' : `an economic internal rate of return of ${pct(so.economic.irr)}`}.`));
    const b = so.bridge;
    html += tbl([T('Del resultado privado al económico', 'From the private result to the economic one'), T('Valor', 'Value')], [
      [T('VAN privado a la tasa social', 'Private NPV at the social rate'), money(b.privateAtSocial)],
      [T('Transferencias que se devuelven', 'Transfers given back'), money(b.transfers)],
      [T('Corrección del precio del producto', 'Correction of the product price'), money(b.product)],
      [T('Corrección de los costos', 'Correction of the costs')  , money(b.costs)],
      [T('Corrección de la inversión', 'Correction of the investment'), money(b.investment)],
      { cls: 'total', cells: [`<b>${T('VAN económico', 'Economic NPV')}</b>`, `<b>${money(b.economic)}</b>`] },
    ]);
    html += P_(T(
      `El proyecto genera ${fmtNum(i.jobsAtFull, 0)} jornales al año a plena producción, equivalentes a ${fmtFixed(i.permanentJobs, 1)} empleos permanentes${i.investmentPerJob ? `, con una inversión de ${money(i.investmentPerJob)} por empleo` : ''}. Del valor agregado, ${pct(i.wagesShare, 0)} queda en remuneraciones, ${pct(i.taxShare, 0)} en impuestos, ${pct(i.interestShare, 0)} en intereses y ${pct(i.surplusShare, 0)} como excedente del dueño.`,
      `The project creates ${fmtNum(i.jobsAtFull, 0)} labour days a year at full production, equivalent to ${fmtFixed(i.permanentJobs, 1)} permanent jobs${i.investmentPerJob ? `, at an investment of ${money(i.investmentPerJob)} per job` : ''}. Of the value added, ${pct(i.wagesShare, 0)} stays as wages, ${pct(i.taxShare, 0)} as taxes, ${pct(i.interestShare, 0)} as interest and ${pct(i.surplusShare, 0)} as the owner's surplus.`));
    html += figuresOf(8, o.figures);
    return html + '</section>';
  }

  function decisionsSection(o) {
    const d = state.decisions;
    if (!d || !d.alternatives || d.alternatives.length < 2) return '';
    let html = `<section><h2>§. ${T('Comparación y decisiones', 'Comparison and decisions')}</h2>`;
    html += tbl([T('Alternativa', 'Alternative'), T('Inversión', 'Investment'), T('Horizonte', 'Horizon'), T('VAN', 'NPV'), T('TIR', 'IRR'), T('Valor anual equivalente', 'Equivalent annual value')],
      d.alternatives.map(a => [esc2(a.name), money(a.investment), a.horizon, money(a.npv), fmtRate(a.irr, 1), money(a.eaa)]));
    if (d.comparison && d.comparison.incrementalIRR != null) {
      const c = d.comparison;
      html += P_(T(
        `Entre «${esc2(c.small.name)}» y «${esc2(c.large.name)}», los ${money(c.extraInvestment)} adicionales rinden ${pct(c.incrementalIRR)}: a la tasa de ${pct(d.rate)} conviene «${esc2(c.winner.name)}».`,
        `Between "${esc2(c.small.name)}" and "${esc2(c.large.name)}", the extra ${money(c.extraInvestment)} returns ${pct(c.incrementalIRR)}: at a rate of ${pct(d.rate)} the better one is "${esc2(c.winner.name)}".`));
    }
    if (d.rationing && d.rationing.best && d.rationing.budget > 0) {
      html += P_(T(
        `Con un presupuesto de ${money(d.rationing.budget)}, el mejor paquete es ${d.rationing.best.pick.map(x => `«${esc2(x.name)}»`).join(', ')}, que cuesta ${money(d.rationing.best.cost)} y suma ${money(d.rationing.best.npv)} de VAN.`,
        `With a budget of ${money(d.rationing.budget)}, the best package is ${d.rationing.best.pick.map(x => `"${esc2(x.name)}"`).join(', ')}, costing ${money(d.rationing.best.cost)} and adding up to ${money(d.rationing.best.npv)} of NPV.`));
    }
    if (d.replacement && d.replacement.economicLife) {
      html += P_(T(
        `La vida económica del equipo es de ${d.replacement.economicLife} años, con un costo anual equivalente de ${money(d.replacement.best.eac)}.`,
        `The economic life of the machine is ${d.replacement.economicLife} years, at an equivalent annual cost of ${money(d.replacement.best.eac)}.`));
    }
    if (d.rotation && d.rotation.best) {
      html += P_(T(
        `El turno óptimo de la plantación es de ${d.rotation.best.years} años, con un valor de la tierra de ${money(d.rotation.best.lev)}.`,
        `The optimal rotation of the plantation is ${d.rotation.best.years} years, with a land expectation value of ${money(d.rotation.best.lev)}.`));
    }
    html += figuresOf(9, o.figures);
    return html + '</section>';
  }

  /* ================================================================
     methodology and calculation record
     ================================================================ */
  function methodsSection() {
    const p = state.project, ap = state.appraisal;
    const bits = [];
    bits.push(T(
      `La evaluación sigue el procedimiento de Gittinger (1982) y Baca Urbina (2013): se construyó el flujo de efectivo del proyecto a precios ${p.priceBasis === 'current' ? 'corrientes' : 'constantes'} de ${p.baseYear}, sin considerar el financiamiento, y el flujo del inversionista, que sí lo considera y recoge el escudo fiscal de los intereses. Cada flujo se descontó con su propia tasa.`,
      `The appraisal follows the procedure of Gittinger (1982) and Baca Urbina (2013): the cash flow of the project was built at ${p.priceBasis === 'current' ? 'current' : 'constant'} prices of ${p.baseYear}, without regard to the financing, and the investor's flow, which does take it into account and picks up the tax shield of the interest. Each flow was discounted with its own rate.`));
    bits.push(T(
      `El valor actual neto es VAN = Σ F_t /(1+i)^t, con t de 0 a ${p.horizon}. La tasa interna de retorno es la tasa que anula esa suma; la app busca todas las raíces del polinomio y avisa cuando el flujo cambia de signo más de una vez, caso en el que la TIR deja de ser un criterio único y se usa la TIR modificada.`,
      `The net present value is NPV = Σ F_t /(1+i)^t, with t from 0 to ${p.horizon}. The internal rate of return is the rate that makes that sum zero; the app looks for every root of the polynomial and warns when the flow changes sign more than once, in which case the IRR stops being a single criterion and the modified IRR is used.`));
    bits.push(T(
      'La relación beneficio–costo es la de Gittinger: valor presente de los beneficios brutos entre valor presente de los costos totales, ambos a la misma tasa, con la inversión dentro de los costos. El valor anual equivalente reparte el VAN entre los años del horizonte con el factor de recuperación de capital, que es lo que permite comparar proyectos de distinta duración.',
      'The benefit–cost ratio is Gittinger\'s: present value of the gross benefits over present value of the total costs, both at the same rate, with the investment inside the costs. The equivalent annual value spreads the NPV over the years of the horizon with the capital recovery factor, which is what allows projects of different length to be compared.'));
    if (state.risk) {
      bits.push(T(
        'El análisis de riesgo usa valores límite (el cambio de cada variable que lleva el VAN a cero), un diagrama de tornado con desviaciones simétricas, escenarios con sus probabilidades y una simulación de Monte Carlo en la que el precio y el rendimiento se correlacionan por el método de rangos de Iman y Conover (1982).',
        'The risk analysis uses switching values (the change in each variable that takes the NPV to zero), a tornado diagram with symmetric deviations, scenarios with their probabilities and a Monte Carlo simulation in which price and yield are correlated by the rank method of Iman and Conover (1982).'));
    }
    if (state.social) {
      bits.push(T(
        'La evaluación económica sigue a Squire y van der Tak (1975) y a Gittinger (1982): se eliminaron las transferencias (impuestos y subsidios), se corrigieron los precios de mercado con factores de conversión por rubro y el flujo resultante se descontó a la tasa social de descuento.',
        'The economic appraisal follows Squire and van der Tak (1975) and Gittinger (1982): transfers (taxes and subsidies) were removed, market prices were corrected with conversion factors by item, and the resulting flow was discounted at the social discount rate.'));
    }
    if (ap && ap.marginal && ap.marginal.rows && ap.marginal.rows.length) {
      bits.push(T(
        'El análisis marginal de tratamientos sigue el manual del CIMMYT (Perrin, Winkelmann, Moscardi y Anderson, 1976): el rendimiento experimental se ajusta a la baja, se consideran solo los costos que varían entre tratamientos, se descartan los dominados y se calcula la tasa de retorno marginal entre los que quedan.',
        'The marginal analysis of the treatments follows the CIMMYT manual (Perrin, Winkelmann, Moscardi and Anderson, 1976): the experimental yield is adjusted downwards, only the costs that vary between treatments are considered, the dominated ones are discarded and the marginal rate of return is computed between those that remain.'));
    }
    bits.push(T(
      `Todos los cálculos se hicieron en EconomicsPro, que corre en el navegador y no envía datos a ningún servidor. Los resultados de este informe se pueden reproducir abriendo el archivo del proyecto (.json) que acompaña a este documento.`,
      `Every calculation was made in EconomicsPro, which runs in the browser and sends no data to any server. The results of this report can be reproduced by opening the project file (.json) that comes with this document.`));
    return `<section><h2>§. ${T('Metodología', 'Methodology')}</h2>` + bits.map(P_).join('') + '</section>';
  }

  /* The arithmetic with the real numbers put in, which is what a reviewer asks
     for when a result is questioned. */
  function recordSection() {
    const p = state.project, st = state.statements, ap = state.appraisal, b = state.budget;
    const r = Project.rates(p);
    const items = [];
    const add = (title, formula, worked) => items.push({ title, formula, worked });

    add(T('Tasa de descuento', 'Discount rate'),
      p.rate.mode === 'wacc' ? 'CPPC = w_d · k_d · (1 − t) + w_e · k_e'
        : p.rate.mode === 'capm' ? 'k_e = r_f + β · (r_m − r_f)'
          : T('TREMA = inflación + premio al riesgo', 'MARR = inflation + risk premium'),
      T(r.es, r.en) + ' → ' + pct(r.used));
    add(T('Tasa real (Fisher)', 'Real rate (Fisher)'),
      '(1 + i_real) = (1 + i_nominal) / (1 + inflación)',
      `(1 + ${fmtFixed(r.nominal, 4)}) / (1 + ${fmtFixed(p.inflation, 4)}) − 1 = ${pct(r.real, 2)}`);
    if (b) {
      add(T('Inversión inicial', 'Initial investment'),
        T('I₀ = inversión fija + diferida + capital de trabajo', 'I₀ = fixed + deferred investment + working capital'),
        `${money(b.summary.fixedInvestment)} + ${money(b.summary.deferred)} + ${money(b.summary.workingCapital)} = ${money(b.summary.initial)}`);
    }
    if (st && st.breakeven && st.breakeven.length) {
      /* the break-even of the year with the most production: in a gestation
         year there is no variable cost and the arithmetic says nothing */
      const be = st.breakeven.filter(x => x.units != null && x.volume > 0)
        .sort((a, b) => b.volume - a.volume)[0] || st.breakeven.find(x => x.units != null) || st.breakeven[0];
      add(T('Punto de equilibrio', 'Break-even point'),
        T('Q* = costos fijos / (precio − costo variable unitario)', 'Q* = fixed costs / (price − unit variable cost)'),
        be.units == null ? T('el margen no alcanza', 'the margin is not enough') : `${money(be.fixedCost)} / (${money(be.price, 2)} − ${money(be.price - be.margin, 2)}) = ${fmtNum(be.units)} ${T('unidades', 'units')}`);
    }
    if (ap && st) {
      const f = st.projectFlow;
      const terms = f.slice(0, Math.min(4, f.length)).map((v, t) => `${money(v)}/(1+${fmtFixed(ap.rateProject, 4)})^${t}`).join(' + ');
      add(T('Valor actual neto del proyecto', 'Net present value of the project'),
        'VAN = Σ F_t / (1 + i)^t',
        `${terms} + … = ${money(ap.project.npv)}`);
      add(T('Tasa interna de retorno', 'Internal rate of return'),
        T('la tasa i* que hace VAN = 0', 'the rate i* that makes NPV = 0'),
        ap.project.irr == null ? T('no existe con este flujo', 'does not exist with this flow')
          : `${pct(ap.project.irr, 4)} ${T('(el flujo cambia de signo', '(the flow changes sign')} ${ap.project.conventional ? T('una vez, así que la raíz es única)', 'once, so the root is unique)') : T('más de una vez: se reporta también la TIR modificada)', 'more than once: the modified IRR is reported too)')}`);
      add(T('Valor anual equivalente', 'Equivalent annual value'),
        'VAE = VAN · i (1+i)^n / [(1+i)^n − 1]',
        `${money(ap.project.npv)} × ${fmtFixed(Fin.capitalRecovery(ap.rateProject, ap.horizon), 6)} = ${money(ap.project.eaa)}`);
    }
    if (state.social) {
      const so = state.social;
      add(T('Puente al VAN económico', 'Bridge to the economic NPV'),
        T('VANE = VAN privado a la tasa social + transferencias + correcciones de precio',
          'ENPV = private NPV at the social rate + transfers + price corrections'),
        `${money(so.bridge.privateAtSocial)} + ${money(so.bridge.transfers)} + ${money(so.bridge.product + so.bridge.costs + so.bridge.investment)} = ${money(so.bridge.economic)}`);
    }
    return `<section><h2>${T('Memoria de cálculo', 'Calculation record')}</h2>` +
      P_(T('Cada resultado con su fórmula y sus números sustituidos, para que cualquiera pueda rehacerlo a mano.',
        'Each result with its formula and its numbers put in, so that anybody can redo it by hand.')) +
      tbl([T('Resultado', 'Result'), T('Fórmula', 'Formula'), T('Con los números', 'With the numbers')],
        items.map(i => [i.title, `<code>${esc2(i.formula)}</code>`, i.worked]), { leftAll: true }) +
      '</section>';
  }

  /* The references of the home page, written as a list. Each one is
     [family, author and year, the rest of the citation, which may carry a
     note in italics]. */
  function referencesSection() {
    const refs = (typeof Home !== 'undefined' && Home.REFS) ? Home.REFS : [];
    if (!refs.length) return '';
    return `<section><h2>${T('Referencias', 'References')}</h2><ol class="refs">` +
      refs.map(r => `<li><b>${esc2(r[1])}</b>. ${r[2]}</li>`).join('') +
      '</ol></section>';
  }

  function citeSection() {
    const year = new Date().getFullYear();
    return `<section class="cite"><h2>${T('Cómo citar la herramienta', 'How to cite the tool')}</h2>` +
      P_(T(
        `Barrera-Guzmán, L.Á. (${year}). EconomicsPro: plataforma en el navegador para la evaluación económica y financiera de proyectos agroindustriales (versión ${APP_VERSION}) [software].`,
        `Barrera-Guzmán, L.Á. (${year}). EconomicsPro: a browser-based platform for the economic and financial appraisal of agrifood projects (Version ${APP_VERSION}) [Computer software].`)) +
      '</section>';
  }

  /* ================================================================
     the document
     ================================================================ */
  const CSS = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#f3f5f2;color:#16221d;font-family:${'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'};line-height:1.55}
.page{max-width:880px;margin:0 auto;background:#fff;padding:46px 54px 60px;box-shadow:0 2px 20px rgba(20,40,32,.08)}
h1{font-size:1.9rem;margin:.2em 0 .1em;line-height:1.2}
h2{font-size:1.22rem;margin:2.1em 0 .5em;padding-bottom:.25em;border-bottom:2px solid #145e4e;color:#145e4e}
h3{font-size:1.02rem;margin:1.5em 0 .4em;color:#0e4639}
p{margin:.55em 0}
.cover{border-bottom:3px solid #145e4e;padding-bottom:18px;margin-bottom:8px}
.kicker{font-size:.76rem;letter-spacing:.09em;text-transform:uppercase;color:#b06e0c;font-weight:700}
.sub{font-size:.95rem;color:#3c4d45}
.muted{color:#5b6b63;font-size:.86rem}
table{border-collapse:collapse;width:100%;margin:.9em 0;font-size:.83rem}
th,td{border:1px solid #dde6df;padding:5px 9px;text-align:left;vertical-align:top}
th{background:#eef3ee;font-weight:600}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr.total td{font-weight:700;background:#f6faf6}
tbody tr:nth-child(even) td{background:#fafcfa}
tr.total td,tbody tr:nth-child(even) td.total{background:#f6faf6}
figure{margin:1.1em 0;text-align:center;page-break-inside:avoid}
figure svg{max-width:100%;height:auto;border:1px solid #e6ece7;border-radius:8px}
code{font-family:ui-monospace,monospace;font-size:.82em;background:#f2f5f2;padding:1px 4px;border-radius:4px}
ol.refs{font-size:.83rem;line-height:1.45}
ol.refs li{margin:.3em 0}
.cite p{font-size:.86rem;background:#f6faf6;border-left:3px solid #145e4e;padding:10px 14px}
footer{margin-top:2.4em;padding-top:12px;border-top:1px solid #dde6df;font-size:.78rem;color:#5b6b63}
@media print{
  body{background:#fff}
  .page{box-shadow:none;max-width:none;padding:0}
  h2{page-break-after:avoid}
  table,figure{page-break-inside:avoid}
  @page{margin:18mm 16mm}
}`;

  function build(o) {
    const opt = Object.assign({ figures: true, methods: true, record: true, references: true, author: '', institution: '' }, o || {});
    if (!state.project) return { html: '', title: '' };
    const title = state.project.name || 'EconomicsPro';
    const body = [
      coverAndSummary(opt),
      projectSection(opt),
      marketSection(opt),
      budgetSection(opt),
      statementsSection(opt),
      appraisalSection(opt),
      riskSection(opt),
      socialSection(opt),
      decisionsSection(opt),
      opt.methods ? methodsSection() : '',
      opt.record ? recordSection() : '',
      opt.references ? referencesSection() : '',
      citeSection(),
    ].join('\n');
    /* the sections number themselves in the order in which they survive: a block
       with nothing to report writes no section, and a hole in the numbering of a
       printed report reads as a mistake */
    let nSec = 0;
    const numerado = body.replace(/<h2>§\. /g, () => `<h2>${++nSec}. `);
    const stamp = new Date().toLocaleString(L() === 'en' ? 'en-GB' : 'es-MX');
    const html = `<!doctype html>
<html lang="${L()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc2(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">
${numerado}
<footer>${T('Generado con EconomicsPro el', 'Generated with EconomicsPro on')} ${esc2(stamp)}. ${T('Los cálculos son responsabilidad de quien firma el estudio.', 'The calculations are the responsibility of whoever signs the study.')}</footer>
</div>
</body>
</html>`;
    return { html, title };
  }

  /* what the ZIP carries besides the report */
  function tables() {
    const out = [];
    const p = state.project;
    const csv = (name, head, rows) => out.push({
      name, data: [head.join(',')].concat(rows.map(r => r.map(csvEscape).join(','))).join('\n'),
    });
    if (state.market && state.market.prog) {
      csv('tablas/programa-de-ventas.csv', ['ano', 'rendimiento', 'produccion', 'volumen_vendido', 'precio', 'ingreso'],
        state.market.prog.rows.map(r => [r.year, r.yield, r.production, r.volume, r.effectivePrice, r.total]));
    }
    if (state.budget) {
      csv('tablas/costos.csv', ['ano', 'costo_variable', 'costo_fijo', 'depreciacion', 'inversion'],
        state.budget.costs.map(c => [(p.baseYear || 0) + c.t, c.variable, c.fixed,
          state.budget.depreciation.byYear[c.t] + state.budget.amortisation.byYear[c.t], state.budget.schedule[c.t] || 0]));
    }
    if (state.statements) {
      const st = state.statements;
      csv('tablas/estado-de-resultados.csv',
        ['ano', 'ingreso', 'costo', 'depreciacion', 'intereses', 'impuestos', 'utilidad_neta', 'flujo_del_proyecto', 'flujo_del_inversionista'],
        st.rows.map(r => [r.year, r.revenue, r.cost, r.depreciation, r.interest, r.tax + r.ptu, r.net,
          st.projectFlow[r.t], st.investorFlow[r.t]]));
    }
    if (state.social) {
      csv('tablas/flujo-economico.csv', ['ano', 'flujo_economico'],
        state.social.rows.map(r => [r.year, state.social.flow[r.t]]));
    }
    if (state.decisions && state.decisions.alternatives.length) {
      csv('tablas/alternativas.csv', ['alternativa', 'inversion', 'horizonte', 'van', 'tir', 'valor_anual_equivalente'],
        state.decisions.alternatives.map(a => [a.name, a.investment, a.horizon, a.npv, a.irr, a.eaa]));
    }
    return out;
  }

  window.Report = { build, tables, figuresOf, CSS };
})();
