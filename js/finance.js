/* EconomicsPro — the financial engine.

   Every number the app reports comes from this file: discounting, the
   profitability indicators, loan schedules, depreciation, break-even,
   switching values and the Monte Carlo simulation. It is written once, with no
   dependence on the interface, so the unit tests can check it against the
   worked examples of the classic textbooks (Gittinger 1982; Baca Urbina 2013;
   Sapag Chaín 2011; Brealey, Myers & Allen 2020) and the later blocks can reuse
   it without repeating a formula.

   Conventions used throughout, and stated in the report so the thesis can
   justify them:

   · Time is measured in whole periods (normally years). Period 0 is the moment
     of the investment; a flow of period t is discounted by (1 + i)^t, that is,
     the end-of-period convention used in project appraisal. Agricultural
     projects that invest during several years simply carry negative flows in
     periods 0, 1, 2 …
   · A rate is always a fraction: 0.12 means 12 %. The interface converts what
     the user types (see parseRate in core.js).
   · An inflow is positive and an outflow negative, in the same currency and in
     the same units (constant or current prices, but never mixed). */

(function () {

  /* ==================== 1. Discounting ==================== */

  /* Present value of a single amount received in period t. */
  function pv(amount, rate, t) { return amount / Math.pow(1 + rate, t); }
  /* Future value in period t of an amount held today. */
  function fv(amount, rate, t) { return amount * Math.pow(1 + rate, t); }

  /* Net present value. flows[0] belongs to period 0 (not discounted).
     `t0` moves the whole series: npv(r, f, 1) discounts f[0] one period, which
     is what is needed when the investment happens at the end of the first year. */
  function npv(rate, flows, t0) {
    if (!flows || !flows.length) return 0;
    if (rate <= -1) return NaN;
    const s = t0 || 0;
    let acc = 0;
    for (let t = 0; t < flows.length; t++) {
      const f = Number(flows[t]) || 0;
      acc += f / Math.pow(1 + rate, t + s);
    }
    return acc;
  }

  /* The NPV of a list of rates, for the profile figure. */
  function npvProfile(flows, rates) {
    return rates.map(r => ({ rate: r, npv: npv(r, flows) }));
  }

  /* Present value of an ordinary annuity of A per period during n periods:
     A · [1 − (1 + i)^−n] / i. The limit i → 0 is n · A, which keeps the
     formula usable when a project is discounted at zero (a comparison that
     Gittinger recommends as a check). */
  function pvAnnuity(A, rate, n) {
    if (n <= 0) return 0;
    if (Math.abs(rate) < 1e-12) return A * n;
    return A * (1 - Math.pow(1 + rate, -n)) / rate;
  }
  function fvAnnuity(A, rate, n) {
    if (n <= 0) return 0;
    if (Math.abs(rate) < 1e-12) return A * n;
    return A * (Math.pow(1 + rate, n) - 1) / rate;
  }
  /* Annuity factor (P/A) and capital recovery factor (A/P). */
  function annuityFactor(rate, n) { return pvAnnuity(1, rate, n); }
  function capitalRecovery(rate, n) {
    if (n <= 0) return NaN;
    if (Math.abs(rate) < 1e-12) return 1 / n;
    return rate / (1 - Math.pow(1 + rate, -n));
  }
  /* Present value of an arithmetic gradient G (0, G, 2G … (n−1)G): the usual
     way of writing a plantation that yields more every year until it matures. */
  function pvGradient(G, rate, n) {
    if (n <= 1) return 0;
    if (Math.abs(rate) < 1e-12) return G * n * (n - 1) / 2;
    return G * ((1 - Math.pow(1 + rate, -n)) / rate - n * Math.pow(1 + rate, -n)) / rate;
  }
  /* Present value of a flow that grows at rate g for n periods (a geometric
     gradient: prices or yields rising at a constant rate). */
  function pvGeometric(A1, rate, g, n) {
    if (n <= 0) return 0;
    if (Math.abs(rate - g) < 1e-12) return A1 * n / (1 + rate);
    return A1 * (1 - Math.pow((1 + g) / (1 + rate), n)) / (rate - g);
  }
  /* Perpetuities: the value of land or of a permanent plantation. */
  function pvPerpetuity(A, rate) { return rate > 0 ? A / rate : Infinity; }
  function pvGrowingPerpetuity(A, rate, g) { return rate > g ? A / (rate - g) : Infinity; }

  /* ==================== 2. Profitability indicators ==================== */

  /* How many times the series changes sign: with one change Descartes'
     rule guarantees a single internal rate of return; with more, the app warns
     and offers the modified rate instead. */
  function signChanges(flows) {
    let last = 0, k = 0;
    for (const f of flows) {
      const s = Math.sign(Number(f) || 0);
      if (s === 0) continue;
      if (last !== 0 && s !== last) k++;
      last = s;
    }
    return k;
  }

  /* Every internal rate of return above −100 %.
     The function scans a grid, brackets each sign change and closes it by
     bisection: it does not depend on a starting guess, so it also finds the
     two rates of a project that invests again at the end (a replanting), where
     Newton's method converges to whichever root is nearest and hides the other. */
  function irrAll(flows, opt) {
    const o = opt || {};
    const hi = o.max == null ? 10 : o.max;          /* 1000 % is far beyond any project */
    const tol = o.tol == null ? 1e-10 : o.tol;
    if (!flows || flows.length < 2) return [];
    const f = flows.map(v => Number(v) || 0);
    if (!f.some(v => v > 0) || !f.some(v => v < 0)) return [];   /* all one sign: no root */
    const at = r => npv(r, f);
    /* a fine grid near the usual rates, coarser far away */
    const grid = [];
    for (let r = -0.99; r < 1; r += 0.005) grid.push(Number(r.toFixed(6)));
    for (let r = 1; r <= hi; r += 0.05) grid.push(Number(r.toFixed(6)));
    const roots = [];
    let prevR = grid[0], prevV = at(prevR);
    if (Math.abs(prevV) < tol) roots.push(prevR);
    for (let i = 1; i < grid.length; i++) {
      const r = grid[i], v = at(r);
      if (!isFinite(v)) { prevR = r; prevV = v; continue; }
      if (v === 0) { roots.push(r); prevR = r; prevV = v; continue; }
      if (isFinite(prevV) && prevV !== 0 && Math.sign(v) !== Math.sign(prevV)) {
        let lo = prevR, hiR = r, flo = prevV;
        for (let k = 0; k < 200; k++) {
          const mid = (lo + hiR) / 2, fm = at(mid);
          if (fm === 0 || (hiR - lo) < tol) { lo = hiR = mid; break; }
          if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hiR = mid;
        }
        roots.push((lo + hiR) / 2);
      }
      prevR = r; prevV = v;
    }
    /* drop duplicates coming from two neighbouring grid points */
    const out = [];
    roots.sort((a, b) => a - b).forEach(r => { if (!out.length || Math.abs(r - out[out.length - 1]) > 1e-6) out.push(r); });
    return out;
  }

  /* The internal rate of return reported by the app: the single root when the
     series is conventional, and the smallest root above −100 % otherwise, with
     `multiple` telling the interface to show the warning and the MIRR. */
  function irr(flows, opt) {
    const roots = irrAll(flows, opt);
    if (!roots.length) return null;
    return roots[0];
  }
  function irrInfo(flows, opt) {
    const roots = irrAll(flows, opt);
    const changes = signChanges(flows);
    return {
      irr: roots.length ? roots[0] : null,
      all: roots,
      multiple: roots.length > 1,
      signChanges: changes,
      conventional: changes <= 1,
    };
  }

  /* Modified internal rate of return: the outflows are brought to period 0 at
     the financing rate and the inflows are taken to period n at the rate at
     which the project can really reinvest. It always exists and it is unique,
     which is why it replaces the IRR when the series changes sign twice. */
  function mirr(flows, financeRate, reinvestRate) {
    if (!flows || flows.length < 2) return null;
    const n = flows.length - 1;
    let pvNeg = 0, fvPos = 0;
    for (let t = 0; t <= n; t++) {
      const f = Number(flows[t]) || 0;
      if (f < 0) pvNeg += f / Math.pow(1 + financeRate, t);
      else fvPos += f * Math.pow(1 + reinvestRate, n - t);
    }
    if (pvNeg === 0 || fvPos <= 0) return null;
    return Math.pow(fvPos / -pvNeg, 1 / n) - 1;
  }

  /* Payback period, with the fraction of the last year interpolated: the year
     in which the accumulated flow turns positive. Without discounting it
     ignores the cost of money, so the app always reports both. */
  function payback(flows) {
    let cum = 0;
    for (let t = 0; t < flows.length; t++) {
      const f = Number(flows[t]) || 0;
      const prev = cum;
      cum += f;
      if (prev < 0 && cum >= 0 && f > 0) return t - 1 + (-prev / f);
      if (t === 0 && cum >= 0) return 0;
    }
    return null;      /* the investment is never recovered inside the horizon */
  }
  function discountedPayback(rate, flows) {
    return payback(flows.map((f, t) => (Number(f) || 0) / Math.pow(1 + rate, t)));
  }

  /* Benefit–cost ratio. Gittinger's gross ratio divides the present value of
     the benefits by that of the costs, both gross; the net ratio divides the
     present value of the positive net flows by that of the negative ones. The
     two answer different questions and the app labels which is which. */
  function bcRatio(benefits, costs, rate) {
    const B = npv(rate, benefits), C = npv(rate, costs.map(c => Math.abs(c)));
    return C > 0 ? B / C : null;
  }
  function netBCRatio(flows, rate) {
    let pos = 0, neg = 0;
    flows.forEach((f, t) => {
      const v = (Number(f) || 0) / Math.pow(1 + rate, t);
      if (v >= 0) pos += v; else neg += -v;
    });
    return neg > 0 ? pos / neg : null;
  }
  /* Profitability index: present value of the flows after period 0 divided by
     the initial outlay. It ranks projects when the budget is limited. */
  function profitabilityIndex(flows, rate) {
    const I = -(Number(flows[0]) || 0);
    if (I <= 0) return null;
    return npv(rate, flows.slice(1), 1) / I;
  }

  /* Equivalent annual value: the NPV turned into the equal yearly amount that
     would produce it. It is the only fair way of comparing an avocado orchard
     evaluated over 25 years with a greenhouse evaluated over 10. */
  function eaa(npvValue, rate, n) {
    if (!isFinite(npvValue) || n <= 0) return null;
    return npvValue * capitalRecovery(rate, n);
  }
  /* Equivalent annual cost of an asset: what the machine costs per year once
     its purchase, its salvage value and its running costs are spread out. */
  function eac(cost, salvage, rate, n, annualCost) {
    if (n <= 0) return null;
    const crf = capitalRecovery(rate, n);
    const sff = Math.abs(rate) < 1e-12 ? 1 / n : rate / (Math.pow(1 + rate, n) - 1);  /* sinking fund */
    return cost * crf - (salvage || 0) * sff + (annualCost || 0);
  }

  /* The whole set of indicators for one series of net flows. */
  function appraise(flows, rate, opt) {
    const o = opt || {};
    const info = irrInfo(flows);
    const n = flows.length - 1;
    const value = npv(rate, flows);
    return {
      rate,
      n,
      npv: value,
      irr: info.irr,
      irrAll: info.all,
      multipleIRR: info.multiple,
      conventional: info.conventional,
      mirr: mirr(flows, o.financeRate == null ? rate : o.financeRate, o.reinvestRate == null ? rate : o.reinvestRate),
      netBC: netBCRatio(flows, rate),
      pi: profitabilityIndex(flows, rate),
      payback: payback(flows),
      discountedPayback: discountedPayback(rate, flows),
      eaa: eaa(value, rate, n),
      accept: value > 0,
    };
  }

  /* ==================== 3. Rates ==================== */

  /* Effective annual rate from a nominal rate compounded m times a year. */
  function effectiveRate(nominal, m) { return Math.pow(1 + nominal / m, m) - 1; }
  /* The nominal rate that produces a given effective annual rate. */
  function nominalRate(effective, m) { return m * (Math.pow(1 + effective, 1 / m) - 1); }
  /* Continuous compounding, used when a flow is spread over the year. */
  function effectiveContinuous(nominal) { return Math.exp(nominal) - 1; }
  /* Fisher: the real rate hidden inside a nominal rate when prices rise by π.
     Subtracting (i − π) is only an approximation and the app does not use it. */
  function realRate(nominal, inflation) { return (1 + nominal) / (1 + inflation) - 1; }
  function nominalFromReal(real, inflation) { return (1 + real) * (1 + inflation) - 1; }
  /* The rate for a period shorter or longer than the one the rate refers to. */
  function convertRate(rate, fromPeriodsPerYear, toPeriodsPerYear) {
    return Math.pow(1 + rate, fromPeriodsPerYear / toPeriodsPerYear) - 1;
  }

  /* Minimum acceptable rate of return (TREMA). The premium is added over
     inflation in the multiplicative form, not simply summed: with 5 %
     inflation and a 10 % premium the rate is 15.5 %, not 15 %. */
  function trema(inflation, riskPremium) { return (1 + inflation) * (1 + riskPremium) - 1; }

  /* Weighted average cost of capital. The interest of the loan is deducted
     from the taxable profit, so it enters after tax; the equity does not. */
  function wacc(parts) {
    const E = parts.equity || 0, D = parts.debt || 0, V = E + D;
    if (V <= 0) return null;
    const t = parts.tax || 0;
    return (E / V) * (parts.costEquity || 0) + (D / V) * (parts.costDebt || 0) * (1 - t);
  }
  /* Cost of equity by the capital asset pricing model, with the country risk
     premium that a project in Mexico has to add to a United States reference. */
  function capm(rf, beta, marketPremium, countryRisk) {
    return rf + beta * marketPremium + (countryRisk || 0);
  }

  /* ==================== 4. Loans ==================== */

  /* Loan schedule. Three repayment patterns cover what a rural credit actually
     offers, plus a grace period during which only the interest is paid
     (`interest`), nothing is paid and the interest is added to the debt
     (`capitalised`), or the interest is forgiven (`none`):
       · 'level'    equal instalments (French amortisation, the usual one)
       · 'capital'  equal principal, falling instalments (German, common at FIRA)
       · 'bullet'   interest only and the whole principal at the end
     Returns one row per period with interest, principal, instalment and the
     balance left, which the pro-forma statements of Block 5 read directly. */
  function amortize(opt) {
    const P = Number(opt.principal) || 0;
    const i = Number(opt.rate) || 0;
    const n = Math.max(1, Math.round(opt.periods || 0));
    const type = opt.type || 'level';
    const grace = Math.max(0, Math.round(opt.grace || 0));
    const graceType = opt.graceType || 'interest';
    const rows = [];
    let balance = P;
    /* grace period */
    for (let t = 1; t <= grace; t++) {
      const opening = balance;
      const interest = opening * i;
      let paidInterest = interest;
      if (graceType === 'capitalised') { balance += interest; paidInterest = 0; }
      else if (graceType === 'none') paidInterest = 0;
      rows.push({ t, opening, interest, paid: paidInterest, principal: 0, payment: paidInterest, balance, grace: true });
    }
    const m = n - grace;                    /* periods left to repay */
    if (m <= 0) return { rows, payment: null, totalInterest: rows.reduce((a, r) => a + r.paid, 0), totalPaid: rows.reduce((a, r) => a + r.payment, 0) };
    /* the debt that is actually repaid: the principal plus whatever interest
       was capitalised during the grace period */
    const owed = balance;
    let level = null;
    if (type === 'level') level = owed * capitalRecovery(i, m);
    for (let k = 1; k <= m; k++) {
      const opening = balance;
      const interest = opening * i;
      let principal;
      if (type === 'level') principal = level - interest;
      else if (type === 'capital') principal = owed / m;
      else principal = 0;                              /* bullet */
      if (k === m) principal = opening;                /* the last row closes the debt exactly */
      const payment = principal + interest;
      balance = opening - principal;
      if (Math.abs(balance) < 1e-8) balance = 0;
      rows.push({ t: grace + k, opening, interest, paid: interest, principal, payment, balance, grace: false });
    }
    return {
      rows,
      payment: level,
      totalInterest: rows.reduce((a, r) => a + r.paid, 0),
      totalPaid: rows.reduce((a, r) => a + r.payment, 0),
    };
  }

  /* ==================== 5. Depreciation ==================== */

  /* Depreciation schedule of one asset.
       · 'sl'    straight line, the method the Mexican income tax law applies
                 with a fixed yearly percentage by type of asset
       · 'ddb'   declining balance at a multiple of the straight-line rate
       · 'syd'   sum of the years' digits
       · 'units' in proportion to what the asset produces each year
     Depreciation is not a cash outflow: it enters the income statement to work
     out the tax and is added back in the cash flow. Block 4 uses this table for
     both purposes. */
  function depreciate(opt) {
    const cost = Number(opt.cost) || 0;
    const salvage = Number(opt.salvage) || 0;
    const life = Math.max(1, Math.round(opt.life || 1));
    const method = opt.method || 'sl';
    const rows = [];
    let book = cost, acc = 0;
    const depreciable = cost - salvage;
    const units = opt.units || [];
    const totalUnits = units.reduce((a, b) => a + (Number(b) || 0), 0);
    for (let t = 1; t <= life; t++) {
      let d;
      if (method === 'sl') d = depreciable / life;
      else if (method === 'ddb') {
        const factor = (opt.factor || 2) / life;
        d = book * factor;
        if (book - d < salvage) d = Math.max(0, book - salvage);
      } else if (method === 'syd') {
        const sum = life * (life + 1) / 2;
        d = depreciable * (life - t + 1) / sum;
      } else if (method === 'units') {
        d = totalUnits > 0 ? depreciable * (Number(units[t - 1]) || 0) / totalUnits : 0;
      } else d = depreciable / life;
      if (acc + d > depreciable) d = Math.max(0, depreciable - acc);
      acc += d; book = cost - acc;
      rows.push({ t, depreciation: d, accumulated: acc, book });
    }
    return { rows, total: acc, residual: cost - acc };
  }

  /* What is left on the books when the horizon ends before the asset does: the
     salvage value that closes the last year of the project. */
  function bookValue(opt, atYear) {
    const s = depreciate(opt).rows;
    if (atYear <= 0) return Number(opt.cost) || 0;
    const row = s[Math.min(s.length, Math.round(atYear)) - 1];
    return row ? row.book : Number(opt.salvage) || 0;
  }

  /* ==================== 6. Break-even ==================== */

  /* Break-even of a single product: the quantity at which income equals cost.
     `capacity` turns it into the percentage of the installed capacity that has
     to be sold, which is what a project document reports. */
  function breakeven(opt) {
    const price = Number(opt.price) || 0;
    const vc = Number(opt.variableCost) || 0;
    const fixed = Number(opt.fixedCost) || 0;
    const margin = price - vc;
    if (margin <= 0) return { units: null, value: null, margin, ratio: null, reason: 'margin' };
    const units = fixed / margin;
    const cap = Number(opt.capacity) || 0;
    return {
      units,
      value: units * price,
      margin,
      ratio: margin / price,                       /* contribution margin ratio */
      capacityPct: cap > 0 ? units / cap : null,
      /* the price and the yield at which the project stops losing money */
      breakevenPrice: cap > 0 ? vc + fixed / cap : null,
      safetyMargin: cap > 0 ? (cap - units) / cap : null,
    };
  }
  /* Break-even of a mix of products, each with its share of the sales:
     the weighted contribution margin decides. */
  function breakevenMix(products, fixedCost) {
    const total = products.reduce((a, p) => a + (Number(p.share) || 0), 0);
    if (total <= 0) return null;
    const wm = products.reduce((a, p) => a + ((Number(p.price) || 0) - (Number(p.variableCost) || 0)) * (Number(p.share) || 0) / total, 0);
    const wp = products.reduce((a, p) => a + (Number(p.price) || 0) * (Number(p.share) || 0) / total, 0);
    if (wm <= 0) return null;
    const units = fixedCost / wm;
    return {
      units, value: units * wp, weightedMargin: wm, weightedPrice: wp,
      byProduct: products.map(p => ({ name: p.name, units: units * (Number(p.share) || 0) / total })),
    };
  }
  /* Operating and financial leverage at a given level of sales: how much the
     profit moves when the harvest sold moves by one per cent. */
  function leverage(opt) {
    const q = Number(opt.units) || 0;
    const margin = (Number(opt.price) || 0) - (Number(opt.variableCost) || 0);
    const ebit = q * margin - (Number(opt.fixedCost) || 0);
    const interest = Number(opt.interest) || 0;
    return {
      ebit,
      operating: ebit !== 0 ? (q * margin) / ebit : null,
      financial: (ebit - interest) !== 0 ? ebit / (ebit - interest) : null,
      total: (ebit - interest) !== 0 ? (q * margin) / (ebit - interest) : null,
    };
  }

  /* ==================== 7. Sensitivity and risk ==================== */

  /* Switching value: how far one variable can move before the NPV reaches zero
     (Gittinger's "valor límite"). `f` returns the NPV for a multiplier of the
     variable; the function brackets the change and closes it by bisection, so
     it works even when the relation is not linear (a price that also moves the
     cost of harvesting, for instance). */
  function switchingValue(f, opt) {
    const o = opt || {};
    const target = o.target == null ? 0 : o.target;
    const lo0 = o.min == null ? 0 : o.min;
    const hi0 = o.max == null ? 5 : o.max;
    const g = x => f(x) - target;
    const base = g(1);
    if (!isFinite(base)) return null;
    /* look for the side where the sign changes */
    let lo = 1, hi = 1, flo = base, fhi = base, found = false;
    const step = 0.02;
    for (let x = 1 - step; x >= lo0; x -= step) {
      const v = g(x);
      if (isFinite(v) && Math.sign(v) !== Math.sign(base)) { lo = x; flo = v; hi = x + step; fhi = g(hi); found = true; break; }
    }
    if (!found) {
      for (let x = 1 + step; x <= hi0; x += step) {
        const v = g(x);
        if (isFinite(v) && Math.sign(v) !== Math.sign(base)) { hi = x; fhi = v; lo = x - step; flo = g(lo); found = true; break; }
      }
    }
    if (!found) return null;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2, fm = g(mid);
      if (fm === 0 || (hi - lo) < 1e-10) { lo = hi = mid; break; }
      if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; }
    }
    const mult = (lo + hi) / 2;
    return { multiplier: mult, change: mult - 1, pct: (mult - 1) };
  }

  /* One-way sensitivity: the indicator recomputed while one variable moves
     over a list of percentage changes. */
  function sensitivity1(f, changes) {
    return changes.map(c => ({ change: c, value: f(1 + c) }));
  }
  /* Two-way sensitivity: the table of two variables moving at the same time,
     the figure that a thesis prints as a heat map. */
  function sensitivity2(f, changesA, changesB) {
    return changesB.map(cb => changesA.map(ca => f(1 + ca, 1 + cb)));
  }

  /* Tornado: every variable moved by the same amount, ordered by how much the
     result swings. It says where the study should spend its effort. */
  function tornado(vars, delta) {
    const d = delta == null ? 0.1 : delta;
    const rows = vars.map(v => {
      const dd = v.delta == null ? d : v.delta;
      const low = v.f(1 - dd), high = v.f(1 + dd);
      return {
        name: v.name, es: v.es, en: v.en, delta: dd,
        low: Math.min(low, high), high: Math.max(low, high),
        swing: Math.abs(high - low),
        direction: high >= low ? 1 : -1,
      };
    });
    rows.sort((a, b) => b.swing - a.swing);
    return rows;
  }

  /* ---------- random draws for the simulation ---------- */
  /* Each distribution answers what a project document can actually state:
     a minimum and a maximum (uniform), three values from an expert (triangular
     and PERT), a mean and a deviation from a price series (normal), a variable
     that cannot be negative and is skewed, like a yield (lognormal), or a set
     of scenarios with their probabilities (discrete). */
  function sampler(spec) {
    const d = (spec.dist || 'triangular').toLowerCase();
    if (d === 'fixed' || d === 'constant') return () => spec.value;
    if (d === 'uniform') return r => spec.min + (spec.max - spec.min) * r();
    if (d === 'normal') return r => spec.mean + spec.sd * randn(r);
    if (d === 'lognormal') {
      /* the parameters are given as the mean and the deviation of the variable
         itself, not of its logarithm, which is what a price series reports */
      const m = spec.mean, s = spec.sd;
      const sigma2 = Math.log(1 + (s * s) / (m * m));
      const mu = Math.log(m) - sigma2 / 2;
      return r => Math.exp(mu + Math.sqrt(sigma2) * randn(r));
    }
    if (d === 'triangular') {
      const a = spec.min, b = spec.max, c = spec.mode == null ? (spec.min + spec.max) / 2 : spec.mode;
      const fc = (c - a) / (b - a);
      return r => {
        const u = r();
        return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
      };
    }
    if (d === 'pert' || d === 'beta-pert') {
      /* PERT: a beta shaped by the optimistic, most likely and pessimistic
         values, with the mode weighted four times, as in project planning */
      const a = spec.min, b = spec.max, c = spec.mode == null ? (spec.min + spec.max) / 2 : spec.mode;
      const mean = (a + 4 * c + b) / 6;
      const alpha = Math.max(0.1, 6 * (mean - a) / (b - a));
      const beta = Math.max(0.1, 6 * (b - mean) / (b - a));
      return r => a + (b - a) * betaSample(r, alpha, beta);
    }
    if (d === 'discrete') {
      const values = spec.values || [], probs = spec.probs || [];
      const cum = []; let s = 0;
      probs.forEach(p => { s += p; cum.push(s); });
      return r => { const u = r() * s; for (let i = 0; i < cum.length; i++) if (u <= cum[i]) return values[i]; return values[values.length - 1]; };
    }
    return () => spec.value == null ? 0 : spec.value;
  }
  /* Beta variate as the ratio of two gamma variates (Marsaglia–Tsang). */
  function gammaSample(r, shape) {
    if (shape < 1) return gammaSample(r, shape + 1) * Math.pow(r() || 1e-12, 1 / shape);
    const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (; ;) {
      let x, v;
      do { x = randn(r); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = r();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function betaSample(r, a, b) {
    const x = gammaSample(r, a), y = gammaSample(r, b);
    return x / (x + y);
  }

  /* Monte Carlo simulation. `vars` is a list of named distributions and `f`
     receives an object with one draw of each and returns the indicator (the
     NPV, normally). Correlation between variables is imposed on the ranks
     (Iman–Conover) when `corr` is given: a good year usually raises the yield
     and lowers the price at the same time, and ignoring that overstates the
     risk of the project in one direction. */
  function monteCarlo(vars, f, opt) {
    const o = opt || {};
    const n = o.n || 2000;
    const r = rng(o.seed == null ? 20260922 : o.seed);
    const draws = vars.map(v => {
      const s = sampler(v);
      return Array.from({ length: n }, () => s(r));
    });
    if (o.corr) imposeCorrelation(draws, o.corr, r);
    const values = new Array(n);
    const obj = {};
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < vars.length; j++) obj[vars[j].name] = draws[j][k];
      values[k] = f(obj);
    }
    const clean = values.filter(v => isFinite(v)).sort((a, b) => a - b);
    const mean = clean.reduce((a, b) => a + b, 0) / (clean.length || 1);
    const sd = Math.sqrt(clean.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, clean.length - 1));
    const q = p => quantile(clean, p);
    return {
      n: clean.length,
      values: clean,
      raw: values,
      draws,
      names: vars.map(v => v.name),
      mean, sd,
      min: clean[0], max: clean[clean.length - 1],
      median: q(0.5), p05: q(0.05), p95: q(0.95), p10: q(0.1), p90: q(0.9),
      pLoss: clean.filter(v => v < 0).length / (clean.length || 1),
      /* the coefficient of variation compares the risk of projects of different size */
      cv: mean !== 0 ? sd / Math.abs(mean) : null,
    };
  }
  /* Quantile by linear interpolation between order statistics. */
  function quantile(sorted, p) {
    if (!sorted.length) return null;
    const h = (sorted.length - 1) * p;
    const lo = Math.floor(h), hi = Math.ceil(h);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
  }
  /* Rank correlation imposed on independent columns: the values are kept and
     only their order is rearranged, so every marginal distribution survives. */
  function imposeCorrelation(draws, corr, r) {
    const k = draws.length, n = draws[0].length;
    const L = cholesky(corr, k);
    if (!L) return;
    const scores = [];
    for (let j = 0; j < k; j++) scores.push(Array.from({ length: n }, () => randn(r)));
    const mixed = [];
    for (let j = 0; j < k; j++) {
      mixed.push(new Array(n));
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let m = 0; m <= j; m++) s += L[j][m] * scores[m][i];
        mixed[j][i] = s;
      }
    }
    for (let j = 0; j < k; j++) {
      const order = mixed[j].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(p => p[1]);
      const sortedVals = draws[j].slice().sort((a, b) => a - b);
      const out = new Array(n);
      order.forEach((idx, rank) => { out[idx] = sortedVals[rank]; });
      draws[j] = out;
    }
  }
  function cholesky(A, k) {
    const L = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < k; i++) {
      for (let j = 0; j <= i; j++) {
        let s = 0;
        for (let m = 0; m < j; m++) s += L[i][m] * L[j][m];
        if (i === j) {
          const v = A[i][i] - s;
          if (v <= 0) return null;
          L[i][j] = Math.sqrt(v);
        } else L[i][j] = (A[i][j] - s) / L[j][j];
      }
    }
    return L;
  }

  /* ==================== 8. Comparing projects ==================== */

  /* Incremental rate of return between two mutually exclusive projects: the
     rate at which the difference of the two series is worth nothing. It is the
     right criterion when the IRR and the NPV disagree because one project is
     larger than the other. */
  function incrementalIRR(small, large) {
    const n = Math.max(small.length, large.length);
    const diff = [];
    for (let t = 0; t < n; t++) diff.push((Number(large[t]) || 0) - (Number(small[t]) || 0));
    return irr(diff);
  }
  /* Fisher intersection: the discount rate at which two projects are worth the
     same. Below it one is preferred, above it the other. */
  function fisherRate(a, b) { return incrementalIRR(a, b); }

  /* Land expectation value (Faustmann): what a piece of land is worth when the
     same plantation is repeated for ever with a rotation of t years. It is the
     criterion for deciding when to replant an orchard or a timber stand. */
  function faustmann(netFlows, rate, rotation) {
    const fvEnd = netFlows.reduce((a, f, t) => a + (Number(f) || 0) * Math.pow(1 + rate, rotation - t), 0);
    const den = Math.pow(1 + rate, rotation) - 1;
    return den > 0 ? fvEnd / den : null;
  }

  /* ==================== 9. Prices and series ==================== */

  /* Constant prices: a series is deflated by a price index so that the
     evaluation is not reading inflation as growth. */
  function deflate(series, index, baseIndex) {
    const base = baseIndex == null ? index[index.length - 1] : baseIndex;
    return series.map((v, i) => (Number(v) || 0) * base / (Number(index[i]) || base));
  }
  function inflateSeries(value, inflation, periods) {
    return Array.from({ length: periods }, (_, t) => value * Math.pow(1 + inflation, t));
  }
  /* Compound annual growth rate of a series. */
  function cagr(first, last, periods) {
    if (first <= 0 || periods <= 0) return null;
    return Math.pow(last / first, 1 / periods) - 1;
  }

  window.Fin = {
    pv, fv, npv, npvProfile, pvAnnuity, fvAnnuity, annuityFactor, capitalRecovery,
    pvGradient, pvGeometric, pvPerpetuity, pvGrowingPerpetuity,
    signChanges, irr, irrAll, irrInfo, mirr, payback, discountedPayback,
    bcRatio, netBCRatio, profitabilityIndex, eaa, eac, appraise,
    effectiveRate, nominalRate, effectiveContinuous, realRate, nominalFromReal, convertRate, trema, wacc, capm,
    amortize, depreciate, bookValue,
    breakeven, breakevenMix, leverage,
    switchingValue, sensitivity1, sensitivity2, tornado,
    sampler, monteCarlo, quantile, imposeCorrelation, cholesky,
    incrementalIRR, fisherRate, faustmann,
    deflate, inflateSeries, cagr,
  };
})();
