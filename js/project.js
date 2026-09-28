/* EconomicsPro — Block 2: the project and its assumptions.

   This file holds the model, not the interface: the decisions that every later
   block reads (what is being appraised, for how long, in what money, at what
   rate and under which tax rules), the rules that turn them into the numbers
   the analysis uses, the coherence checks, and the saving and loading of the
   study. Block 2's screen (block2.js) only writes into this object and draws
   what comes back.

   Two decisions made here rule the whole appraisal:

   · PRICES. At constant prices every flow is written in money of the base
     year and is discounted with a REAL rate. At current prices every flow
     carries the inflation of its year and is discounted with a NOMINAL rate.
     The app keeps both versions of the rate and hands the analysis the one
     that matches the basis, so the commonest mistake of the literature —
     today's flows discounted at a nominal rate— cannot happen by accident.

   · THE RATE. It can be built as a minimum acceptable rate of return (MARR:
     inflation and a risk premium, combined, never added), as a weighted
     average cost of capital, from the capital asset pricing model, or simply
     typed in. Whichever way, the app records how it was obtained so the report
     of Block 10 can state it. */

(function () {

  const KEY = 'economicspro:project';

  /* the kinds of project the app knows, with the assumptions that differ */
  const KINDS = {
    annual: { es: 'Cultivo anual', en: 'Annual crop', art: 'matAnnual', unit: ['ha', 'ha'], horizon: 10, gestation: 0, ramp: 1, salvage: 0.2 },
    perennial: { es: 'Plantación perenne', en: 'Perennial plantation', art: 'matOrchard', unit: ['ha', 'ha'], horizon: 20, gestation: 4, ramp: 4, salvage: 0.25 },
    protected: { es: 'Agricultura protegida', en: 'Protected agriculture', art: 'matGreenhouse', unit: ['ha', 'ha'], horizon: 12, gestation: 1, ramp: 2, salvage: 0.15 },
    livestock: { es: 'Producción pecuaria', en: 'Livestock production', art: 'matLivestock', unit: ['cabeza', 'head'], horizon: 8, gestation: 0, ramp: 1, salvage: 0.2 },
    agroindustry: { es: 'Planta agroindustrial', en: 'Agro-industrial plant', art: 'matAgroindustry', unit: ['línea', 'line'], horizon: 15, gestation: 1, ramp: 3, salvage: 0.2 },
    infrastructure: { es: 'Riego, maquinaria u obra', en: 'Irrigation, machinery or works', art: 'matIrrigation', unit: ['ha', 'ha'], horizon: 15, gestation: 0, ramp: 2, salvage: 0.1 },
    forestry: { es: 'Forestal o agroforestal', en: 'Forestry or agroforestry', art: 'matForestry', unit: ['ha', 'ha'], horizon: 25, gestation: 8, ramp: 3, salvage: 0.3 },
    social: { es: 'Proyecto social o público', en: 'Social or public project', art: 'matSocial', unit: ['beneficiario', 'beneficiary'], horizon: 20, gestation: 1, ramp: 2, salvage: 0.1 },
  };

  /* currencies a project of the region is written in */
  const CURRENCIES = {
    MXN: { symbol: '$', es: 'Peso mexicano', en: 'Mexican peso' },
    USD: { symbol: 'US$', es: 'Dólar estadounidense', en: 'United States dollar' },
    EUR: { symbol: '€', es: 'Euro', en: 'Euro' },
    GTQ: { symbol: 'Q', es: 'Quetzal', en: 'Guatemalan quetzal' },
    COP: { symbol: 'COL$', es: 'Peso colombiano', en: 'Colombian peso' },
  };

  /* The value of the UMA changes every February; it is a field, not a constant,
     and the app says where it comes from. The default is the daily value in
     force when this version was written. */
  const UMA_DAILY = 113.14;

  function defaults() {
    const k = KINDS.perennial;
    return {
      version: 1,
      /* --- identification --- */
      name: '',
      owner: '',
      location: '',
      kind: 'perennial',
      unitName: 'ha',
      scale: 10,
      /* --- horizon --- */
      horizon: k.horizon,
      baseYear: new Date().getFullYear(),
      gestation: k.gestation,
      ramp: k.ramp,
      salvage: k.salvage,
      /* --- money and prices --- */
      currency: 'MXN',
      symbol: '$',
      priceBasis: 'constant',      /* 'constant' | 'current' */
      inflation: 0.045,
      exchangeRate: 18.5,
      usesForeign: false,
      /* --- discount rate --- */
      rate: {
        mode: 'marr',              /* 'marr' | 'wacc' | 'capm' | 'manual' */
        riskPremium: 0.10,         /* real premium demanded above inflation */
        equity: 60, debt: 40,
        costEquity: 0.18, costDebt: 0.135,
        rf: 0.075, beta: 0.95, marketPremium: 0.055, countryRisk: 0.02,
        manual: 0.12, manualIsReal: true,
      },
      /* --- taxes --- */
      tax: {
        income: 0.30,
        applyPTU: false,
        ptu: 0.10,
        primaryRegime: 'none',     /* 'none' | 'fisica' | 'moral' */
        members: 1,
        umaDaily: UMA_DAILY,
        vat: 0.16,
        vatCreditable: true,
      },
      /* --- Block 3: market, prices and revenue ---
         It lives inside the project so that one .json file carries the whole
         study and the autosave of Block 2 keeps it too. */
      market: {
        series: [],              /* rows of the grid: {year, price, yield, index}, as typed */
        deflate: true,
        priceMethod: 'mean', priceLastN: 5, priceGrowth: 0, priceFixed: null,
        yieldMethod: 'mean', yieldLastN: 5, yieldGrowth: 0, yieldFixed: null,
        loss: 0.05, soldShare: 1, otherIncome: 0,
        channels: [], byproducts: [],
        demand: null, supply: null, demandGrowth: 0.03, supplyGrowth: 0.02, elasticity: -0.5,
      },
      /* --- Block 4: investment, costs and working capital --- */
      budget: {
        investments: [],         /* {name, kind, qty, unitCost, year, life, salvagePct, replace} */
        deferred: [],            /* {name, amount, year} */
        deferredLife: 5,
        establishment: [],       /* cost items while the project is not yet bearing */
        operating: [],           /* cost items once it produces */
        fixed: [],               /* lump sums a year */
        wcMethod: 'cycle',
        wcDaysInventory: 60, wcDaysReceivable: 30, wcDaysPayable: 20,
        wcMonths: 3, wcPct: 0.2,
      },
      /* --- Block 5: financing --- */
      finance: {
        longTermShare: 0.5,        /* share of the fixed and pre-operating investment taken as a loan */
        longTermAmount: null,      /* or the amount, when the bank fixes it */
        longTermRate: 0.135, longTermYears: 10, longTermGrace: 0,
        longTermGraceType: 'interest', longTermType: 'level', fee: 0.01,
        seasonalShare: 0, seasonalRate: 0.16,
      },
      /* --- Block 6: financial appraisal ---
         The two rates are null while they follow Block 2; a number here means
         the analyst wanted to try a different one. */
      appraisal: {
        rateProject: null, rateEquity: null,
        treatments: [],            /* marginal analysis: {name, yield, cost, price} */
        adjust: 0.10, minimumRate: 1, fieldPrice: null,
      },
      /* --- Block 7: risk and uncertainty --- */
      risk: {
        delta: 0.10,                 /* the swing of the tornado */
        varA: 'price', varB: 'yield',
        scenarios: [],               /* {name, probability, price, yield, cost, invest}, in per cent */
        dist: 'triangular', corr: -0.3, runs: 2000,
        simPrice: 0.25, simYield: 0.20, simCost: 0.12, simInvest: 0.10,
        treeProbability: 0.5,
      },
      /* --- Block 8: economic and social appraisal ---
         The conversion factors that turn market prices into accounting prices,
         and the few data the social indicators need. */
      social: {
        standard: 0.90, product: 1.00,
        labour: 0.70, inputs: 0.95, machinery: 1.00, services: 0.90, admin: 0.90, other: 0.90,
        investment: null, exchange: 1.05,
        exportShare: 0, importShare: 0,
        wage: 350, daysPerJob: 270, subsidy: 0, beneficiaries: 0,
      },
      /* --- Block 9: comparison and decisions ---
         The alternatives the project is weighed against, the budget that does
         not stretch to all of them, and the three recurring decisions of a
         farm: when to replace the machine, when to cut the plantation and
         whether to buy or to rent. */
      decisions: {
        rate: null,                  /* empty: the rate of Block 6 is used */
        includeProject: true,        /* the project of the study enters as one more alternative */
        alternatives: [],            /* {name, investment, net, horizon, salvage, growth} */
        compareA: 0, compareB: 1,
        budget: null,
        machineCost: 900000, machineDecline: 0.18, machineFloor: 0.12,
        machineRunning: 60000, machineRise: 0.15, machineMax: 12,
        establish: 0, annual: 0,
        rotations: [],               /* {years, harvest} */
        leaseCost: 900000, leaseLife: 6, leaseSalvage: 250000,
        leaseMaintenance: 60000, leasePayment: 190000, leaseIncluded: 0,
      },
      /* --- the rate at which the country discounts, used by Block 8 --- */
      socialRate: 0.10,
      notes: '',
      savedAt: null,
    };
  }

  /* ================================================================
     the discount rate
     ================================================================ */

  /* Returns the nominal rate, the real rate, the one the analysis will use and
     the pieces it was built from, which the figure of Block 2 draws and the
     report of Block 10 writes out. */
  function rates(p) {
    const inf = Number(p.inflation) || 0;
    const r = p.rate;
    let nominal = null, real = null;
    const parts = [];
    if (r.mode === 'marr') {
      /* Baca Urbina: TREMA = premio + inflación + premio·inflación. The premium
         is what the investor demands above keeping the money's purchasing
         power, so it is already a real rate. */
      real = Number(r.riskPremium) || 0;
      nominal = Fin.trema(inf, real);
      parts.push({ key: 'inflation', es: 'Inflación esperada', en: 'Expected inflation', value: inf, colour: 'c2' });
      parts.push({ key: 'premium', es: 'Premio al riesgo', en: 'Risk premium', value: real, colour: 'c1' });
      parts.push({ key: 'cross', es: 'Término cruzado', en: 'Cross term', value: nominal - inf - real, colour: 'c3' });
    } else if (r.mode === 'wacc') {
      const E = Number(r.equity) || 0, D = Number(r.debt) || 0, V = E + D;
      nominal = Fin.wacc({ equity: E, debt: D, costEquity: Number(r.costEquity) || 0, costDebt: Number(r.costDebt) || 0, tax: Number(p.tax.income) || 0 });
      real = nominal == null ? null : Fin.realRate(nominal, inf);
      if (V > 0) {
        parts.push({ key: 'equity', es: 'Capital propio', en: 'Equity', value: (E / V) * (Number(r.costEquity) || 0), colour: 'c1' });
        parts.push({ key: 'debt', es: 'Deuda después de impuestos', en: 'Debt after tax', value: (D / V) * (Number(r.costDebt) || 0) * (1 - (Number(p.tax.income) || 0)), colour: 'c2' });
      }
    } else if (r.mode === 'capm') {
      const ke = Fin.capm(Number(r.rf) || 0, Number(r.beta) || 0, Number(r.marketPremium) || 0, Number(r.countryRisk) || 0);
      const E = Number(r.equity) || 0, D = Number(r.debt) || 0, V = E + D;
      nominal = V > 0 && D > 0
        ? Fin.wacc({ equity: E, debt: D, costEquity: ke, costDebt: Number(r.costDebt) || 0, tax: Number(p.tax.income) || 0 })
        : ke;
      real = nominal == null ? null : Fin.realRate(nominal, inf);
      parts.push({ key: 'rf', es: 'Tasa libre de riesgo', en: 'Risk-free rate', value: Number(r.rf) || 0, colour: 'c3' });
      parts.push({ key: 'beta', es: 'β × prima de mercado', en: 'β × market premium', value: (Number(r.beta) || 0) * (Number(r.marketPremium) || 0), colour: 'c1' });
      parts.push({ key: 'country', es: 'Riesgo país', en: 'Country risk', value: Number(r.countryRisk) || 0, colour: 'c4' });
      if (D > 0 && V > 0) parts.push({ key: 'debtMix', es: 'Efecto de la deuda', en: 'Effect of the debt', value: nominal - ke, colour: 'c2' });
    } else {
      const v = Number(r.manual) || 0;
      if (r.manualIsReal) { real = v; nominal = Fin.nominalFromReal(v, inf); }
      else { nominal = v; real = Fin.realRate(v, inf); }
      parts.push({ key: 'manual', es: 'Tasa indicada', en: 'Rate given', value: v, colour: 'c1' });
    }
    const used = p.priceBasis === 'current' ? nominal : real;
    return {
      nominal, real, used,
      basis: p.priceBasis,
      mode: r.mode,
      parts: parts.filter(x => isFinite(x.value)),
      /* the sentence the report will print */
      es: sentence(p, nominal, real, 'es'),
      en: sentence(p, nominal, real, 'en'),
    };
  }

  function sentence(p, nominal, real, lang) {
    const mode = p.rate.mode;
    const n = fmtPct(nominal, 2), rr = fmtPct(real, 2);
    const how = {
      marr: {
        es: `TREMA formada con una inflación esperada de ${fmtPct(p.inflation, 2)} y un premio al riesgo real de ${fmtPct(p.rate.riskPremium, 2)}`,
        en: `MARR built from an expected inflation of ${fmtPct(p.inflation, 2)} and a real risk premium of ${fmtPct(p.rate.riskPremium, 2)}`,
      },
      wacc: {
        es: `costo de capital promedio ponderado con ${fmtNum(p.rate.equity, 0)} % de capital propio al ${fmtPct(p.rate.costEquity, 2)} y ${fmtNum(p.rate.debt, 0)} % de deuda al ${fmtPct(p.rate.costDebt, 2)} deducible al ${fmtPct(p.tax.income, 0)}`,
        en: `weighted average cost of capital with ${fmtNum(p.rate.equity, 0)}% equity at ${fmtPct(p.rate.costEquity, 2)} and ${fmtNum(p.rate.debt, 0)}% debt at ${fmtPct(p.rate.costDebt, 2)} deductible at ${fmtPct(p.tax.income, 0)}`,
      },
      capm: {
        es: `modelo de valuación de activos de capital con tasa libre de riesgo de ${fmtPct(p.rate.rf, 2)}, β = ${fmtFixed(p.rate.beta, 2)}, prima de mercado de ${fmtPct(p.rate.marketPremium, 2)} y riesgo país de ${fmtPct(p.rate.countryRisk, 2)}`,
        en: `capital asset pricing model with a risk-free rate of ${fmtPct(p.rate.rf, 2)}, β = ${fmtFixed(p.rate.beta, 2)}, a market premium of ${fmtPct(p.rate.marketPremium, 2)} and a country risk of ${fmtPct(p.rate.countryRisk, 2)}`,
      },
      manual: {
        es: `tasa indicada directamente por el evaluador (${p.rate.manualIsReal ? 'real' : 'nominal'})`,
        en: `rate given directly by the analyst (${p.rate.manualIsReal ? 'real' : 'nominal'})`,
      },
    }[mode][lang];
    return lang === 'es'
      ? `${how}: ${n} nominal, equivalente a ${rr} real. El estudio se evalúa a precios ${p.priceBasis === 'current' ? 'corrientes, con la tasa nominal' : 'constantes, con la tasa real'}.`
      : `${how}: ${n} nominal, equivalent to ${rr} real. The study is appraised at ${p.priceBasis === 'current' ? 'current prices, with the nominal rate' : 'constant prices, with the real rate'}.`;
  }

  /* ================================================================
     taxes
     ================================================================ */

  /* Article 74 of the Mexican income tax law exempts part of the income of
     agricultural, livestock, forestry and fishing activities: 40 annual UMA
     for an individual, and 20 per member up to 200 for a company. The app
     works the figure out so the income statement of Block 5 can apply it, and
     it always shows how it got there. */
  function exemptIncome(p) {
    const t = p.tax || {};
    const uma = (Number(t.umaDaily) || 0) * 365;
    if (t.primaryRegime === 'fisica') return { umas: 40, amount: 40 * uma, uma };
    if (t.primaryRegime === 'moral') {
      const umas = Math.min(200, 20 * Math.max(1, Math.round(Number(t.members) || 1)));
      return { umas, amount: umas * uma, uma };
    }
    return { umas: 0, amount: 0, uma };
  }

  /* ================================================================
     coherence
     ================================================================ */

  /* Every check the app can make with what Block 2 knows. They come back as a
     list so the screen can show them and the report can repeat them. */
  function validate(p) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });
    const R = rates(p);

    if (!p.name || !p.name.trim()) add('warning', 'El proyecto no tiene nombre; el informe y los archivos lo necesitan.', 'The project has no name; the report and the files need one.');
    if (!(Number(p.scale) > 0)) add('error', 'La escala del proyecto tiene que ser mayor que cero.', 'The scale of the project has to be greater than zero.');
    if (!(Number(p.horizon) >= 1)) add('error', 'El horizonte de evaluación tiene que ser de al menos un año.', 'The appraisal horizon has to be at least one year.');
    if (R.used == null || !isFinite(R.used)) add('error', 'La tasa de descuento no se pudo calcular con los datos dados.', 'The discount rate could not be computed from the data given.');
    if (p.rate.mode === 'wacc' && (Number(p.rate.equity) || 0) + (Number(p.rate.debt) || 0) <= 0) {
      add('error', 'El capital propio y la deuda no pueden sumar cero.', 'Equity and debt cannot add up to zero.');
    }

    /* the horizon against the biology of the project */
    const g = Number(p.gestation) || 0, ramp = Number(p.ramp) || 1;
    if (Number(p.horizon) <= g) {
      add('error', `El horizonte (${p.horizon} años) termina antes de la primera producción (año ${g + 1}): el proyecto nunca vendería nada.`,
        `The horizon (${p.horizon} years) ends before the first harvest (year ${g + 1}): the project would never sell anything.`);
    } else if (Number(p.horizon) < g + ramp + 3) {
      add('warning', `El horizonte deja solo ${p.horizon - g - ramp} años a plena producción; un proyecto con ${g} años de gestación suele evaluarse más largo.`,
        `The horizon leaves only ${p.horizon - g - ramp} years at full production; a project with ${g} years to bear is usually appraised over a longer period.`);
    }
    if (Number(p.horizon) > 30) {
      add('info', 'Más allá de 30 años el descuento vuelve casi irrelevante lo que ocurra; conviene justificar el horizonte.',
        'Beyond 30 years discounting makes what happens almost irrelevant; the horizon is worth justifying.');
    }

    /* prices and the rate */
    if (p.priceBasis === 'constant') {
      add('info', `A precios constantes los flujos van en pesos de ${p.baseYear} y se descuentan con la tasa real (${fmtPct(R.real, 2)}). La inflación solo sirve para convertir la tasa.`,
        `At constant prices the flows are in ${p.baseYear} money and are discounted with the real rate (${fmtPct(R.real, 2)}). Inflation is only used to convert the rate.`);
    } else {
      add('info', `A precios corrientes cada año llevará su inflación y se descuenta con la tasa nominal (${fmtPct(R.nominal, 2)}). Los ingresos y los costos tienen que inflarse los dos.`,
        `At current prices each year will carry its inflation and is discounted with the nominal rate (${fmtPct(R.nominal, 2)}). Revenue and costs both have to be inflated.`);
    }
    if (R.real != null && R.real < 0) {
      add('warning', `La tasa real es negativa (${fmtPct(R.real, 2)}): la inflación esperada supera a la tasa nominal y casi cualquier proyecto saldría aceptable.`,
        `The real rate is negative (${fmtPct(R.real, 2)}): expected inflation is above the nominal rate and almost any project would look acceptable.`);
    }
    if (R.used != null && R.used > 0.30) {
      add('warning', `Una tasa de ${fmtPct(R.used, 2)} castiga tanto el futuro que casi ningún proyecto perenne pasa; revisa si el premio al riesgo no está contando dos veces la inflación.`,
        `A rate of ${fmtPct(R.used, 2)} penalises the future so heavily that almost no perennial project passes; check whether the risk premium is not counting inflation twice.`);
    }
    if (R.used != null && R.used < 0.03) {
      add('warning', `Una tasa de ${fmtPct(R.used, 2)} es muy baja para un proyecto agropecuario privado; se usa en evaluación social, no financiera.`,
        `A rate of ${fmtPct(R.used, 2)} is very low for a private agricultural project; it belongs to social, not financial, appraisal.`);
    }
    if (p.rate.mode === 'wacc' || p.rate.mode === 'capm') {
      if ((Number(p.rate.costDebt) || 0) > (Number(p.rate.costEquity) || 0) && p.rate.mode === 'wacc') {
        add('warning', 'La deuda te cuesta más que el capital propio; normalmente es al revés, porque el acreedor cobra primero y arriesga menos.',
          'Debt costs you more than equity; it is usually the other way round, because the lender is paid first and risks less.');
      }
    }

    /* taxes */
    const ex = exemptIncome(p);
    if (p.tax.primaryRegime !== 'none') {
      add('info', `Régimen del sector primario: quedan exentos ${fmtMoney(ex.amount, 0)} de ingreso al año (${ex.umas} UMA anuales con una UMA diaria de ${fmtMoney(p.tax.umaDaily, 2)}).`,
        `Primary sector regime: ${fmtMoney(ex.amount, 0)} of yearly income is exempt (${ex.umas} annual UMA with a daily UMA of ${fmtMoney(p.tax.umaDaily, 2)}).`);
    }
    if ((Number(p.tax.income) || 0) > 0.35) {
      add('warning', 'Una tasa de impuesto sobre la renta arriba del 35 % es inusual; revísala.', 'An income tax rate above 35% is unusual; check it.');
    }
    if (p.usesForeign && !(Number(p.exchangeRate) > 0)) {
      add('error', 'El proyecto declara operaciones en divisas pero no tiene tipo de cambio.', 'The project declares foreign currency operations but has no exchange rate.');
    }
    return out;
  }

  const hasErrors = list => list.some(m => m.level === 'error');

  /* ================================================================
     persistence
     ================================================================ */

  function save(p) {
    const copy = JSON.parse(JSON.stringify(p));
    copy.savedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(copy)); } catch (e) { /* private mode */ }
    return copy.savedAt;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return merge(defaults(), JSON.parse(raw));
    } catch (e) { return null; }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  /* A file written by an older version, or by hand, keeps whatever it brings
     and takes the default for everything else. */
  function merge(base, incoming) {
    const out = JSON.parse(JSON.stringify(base));
    if (!incoming || typeof incoming !== 'object') return out;
    for (const k in incoming) {
      if (!(k in out)) continue;
      const v = incoming[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') out[k] = merge(out[k], v);
      else if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
  }

  /* ================================================================
     example projects
     ================================================================
     The same six projects of the laboratory on the home page, so that whoever
     opens the app without data of their own can walk the ten blocks end to
     end and see what a finished study looks like. The productive and cost
     figures live in the laboratory (playground.js) and Blocks 3 and 4 will
     read them from there. */
  const EXAMPLES = {
    avocado: {
      es: 'Huerta de aguacate en Michoacán', en: 'Avocado orchard in Michoacán',
      patch: { name: 'Establecimiento de huerta de aguacate Hass', kind: 'perennial', unitName: 'ha', scale: 10, horizon: 20, gestation: 4, ramp: 4, salvage: 0.25, location: 'Uruapan, Michoacán' },
    },
    maize: {
      es: 'Maíz de temporal', en: 'Rain-fed maize',
      patch: { name: 'Producción de maíz de temporal con mecanización', kind: 'annual', unitName: 'ha', scale: 20, horizon: 10, gestation: 0, ramp: 1, salvage: 0.2, location: 'Texcoco, Estado de México' },
    },
    greenhouse: {
      es: 'Invernadero de jitomate', en: 'Tomato greenhouse',
      patch: { name: 'Invernadero de jitomate saladette', kind: 'protected', unitName: 'ha', scale: 0.5, horizon: 12, gestation: 1, ramp: 2, salvage: 0.15, location: 'Coatepec Harinas, Estado de México' },
    },
    feedlot: {
      es: 'Engorda de bovinos', en: 'Cattle feedlot',
      patch: { name: 'Corral de engorda de bovinos', kind: 'livestock', unitName: 'cabeza', scale: 200, horizon: 8, gestation: 0, ramp: 1, salvage: 0.2, location: 'Tepatitlán, Jalisco' },
    },
    dairy: {
      es: 'Planta de quesos', en: 'Cheese plant',
      patch: { name: 'Planta artesanal de quesos', kind: 'agroindustry', unitName: 'línea de 1,000 L/día', scale: 8, horizon: 15, gestation: 1, ramp: 3, salvage: 0.2, location: 'Zacazonapan, Estado de México' },
    },
    irrigation: {
      es: 'Riego tecnificado', en: 'Irrigation scheme',
      patch: { name: 'Riego por goteo en superficie de temporal', kind: 'infrastructure', unitName: 'ha', scale: 40, horizon: 15, gestation: 0, ramp: 2, salvage: 0.1, location: 'Valle del Mezquital, Hidalgo' },
    },
  };

  window.Project = {
    KINDS, CURRENCIES, UMA_DAILY, EXAMPLES,
    defaults, rates, sentence, exemptIncome, validate, hasErrors,
    save, load, clear, merge, KEY,
  };
})();
