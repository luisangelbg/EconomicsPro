/* EconomicsPro — three complete projects to practise with.

   These are not the small examples each block loads on its own: they are three
   WHOLE studies, with their price series, their budgets, their loan, their
   scenarios and their conversion factors, so that anyone can open one and walk
   the ten blocks from end to end with data that hold together.

   THE DATA ARE FICTIONAL, with one exception, named here so that the sentence
   is true. The crops, the places and the orders of magnitude are plausible,
   and the arithmetic is internally consistent, but no price, no yield and no
   cost comes from a survey or from an official series: they were written to be
   practised with, never to be cited. The exception is the price index, which
   is not invented: it is INEGI's consumer price index, because deflating a
   series with a made-up index would teach a bad habit. Whoever uses this app
   for a real study replaces everything else with their own, from the SIAP, the
   SNIIM, INEGI or their own field data.

   The three cases were chosen because each one fails, or strains, in a
   different place:

   · NOPAL — a small project, cheap to set up, that produces from the second
     year: everything works, and it serves to see the app in its simplest form.
   · CAFÉ — three years without a harvest, an exportable product and a long
     horizon: it strains the gestation, the loan grace period and the economic
     appraisal, where the foreign exchange it earns finally counts.
   · FRESA — a large investment, a heavy loan and thin margins per peso
     invested: it is the case where a profitable project runs out of cash, and
     where risk decides. */

(function () {

  /* The only real figures in this file: the Mexican consumer price index
     published by INEGI (December of each year, second half of July 2018 =
     100), rounded to one decimal, so that the three cases are deflated on the
     same real basis. It is the same series that exdata3.js uses, and it is
     used under INEGI's own terms of free use, which ask for attribution. */
  const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const CPI = [91.6, 98.3, 103.0, 105.9, 109.3, 117.3, 126.5, 132.4, 137.9, 143.4];
  const str = v => String(v);
  const series = (price, yields) => YEARS.map((y, i) => ({
    year: str(y), price: str(price[i]), yield: str(yields[i]), index: str(CPI[i]),
  }));

  const CASES = {
    nopal: {
      es: 'Nopal verdura en Milpa Alta', en: 'Prickly pear cactus in Milpa Alta',
      what: ['Proyecto pequeño y barato de establecer, que corta desde el primer año. Sirve para ver la app completa en su forma más simple, sin que nada se atore.',
        'A small project, cheap to set up, that crops from the first year. Good for seeing the whole app in its simplest form, with nothing getting stuck.'],
      teaches: ['Sale bien por todos lados: úsalo para entender qué hace cada bloque. Aun así, mira la caja del primer año en el Bloque 5: hasta un proyecto excelente necesita dinero antes de la primera venta.',
        'It works out on every count: use it to understand what each block does. Even so, look at the cash of the first year in Block 5: even an excellent project needs money before its first sale.'],
      project: {
        name: 'Establecimiento de plantación de nopal verdura (caso de práctica)',
        owner: 'Productor de práctica', location: 'Milpa Alta, Ciudad de México',
        kind: 'perennial', unitName: 'ha', scale: 3,
        horizon: 15, baseYear: 2026, gestation: 0, ramp: 3, salvage: 0.20,
        priceBasis: 'constant', inflation: 0.045,
        rate: { mode: 'marr', riskPremium: 0.12 },
        tax: { income: 0.30, primaryRegime: 'fisica', umaDaily: 113.14 },
        socialRate: 0.10,
        notes: 'Datos FICTICIOS (salvo el índice de precios, que es el INPC del INEGI), para practicar con la app. No citar.',
      },
      market: {
        series: series([1450, 1580, 1720, 1680, 1890, 2050, 2280, 2190, 2340, 2420],
          [62, 65, 64, 68, 66, 70, 69, 67, 71, 72]),
        deflate: true, priceMethod: 'mean', priceLastN: 5, yieldMethod: 'mean', yieldLastN: 5,
        loss: 0.08, soldShare: 1, otherIncome: 0,
        channels: [{ name: 'Central de abasto', share: '70', factor: '1' }, { name: 'Venta directa', share: '30', factor: '1.25' }],
        byproducts: [{ name: 'Penca para forraje', perUnit: '0.05', price: '900' }],
        demand: 42000, supply: 38000, demandGrowth: 0.03, supplyGrowth: 0.025, elasticity: -0.4,
      },
      budget: {
        investments: [
          { name: 'Preparación del terreno', kind: 'Obra civil e instalaciones', qty: '3', unitCost: '11000', year: '0', life: '15', salvagePct: '0', replace: 'no' },
          { name: 'Planta y establecimiento', kind: 'Establecimiento de la plantación', qty: '3', unitCost: '38000', year: '0', life: '15', salvagePct: '0', replace: 'no' },
          { name: 'Cerco perimetral y bodega', kind: 'Obra civil e instalaciones', qty: '3', unitCost: '9000', year: '0', life: '20', salvagePct: '0.1', replace: 'no' },
          { name: 'Equipo de riego por goteo', kind: 'Equipo y herramienta', qty: '3', unitCost: '14000', year: '0', life: '10', salvagePct: '5', replace: 'sí' },
          { name: 'Herramienta y equipo menor', kind: 'Equipo y herramienta', qty: '1', unitCost: '32000', year: '0', life: '5', salvagePct: '0', replace: 'sí' },
        ],
        deferred: [{ name: 'Estudios y trámites', amount: '35000', year: '0' }],
        deferredLife: 5,
        establishment: [
          { name: 'Jornales de establecimiento', group: 'Mano de obra', base: 'por unidad', qty: '30', unitCost: '350' },
          { name: 'Composta y fertilización', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '11000' },
          { name: 'Control de plagas', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '4000' },
        ],
        operating: [
          { name: 'Jornales de manejo y corte', group: 'Mano de obra', base: 'por unidad', qty: '95', unitCost: '350' },
          { name: 'Composta y fertilización', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '16000' },
          { name: 'Control de plagas y enfermedades', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '6000' },
          { name: 'Energía para riego', group: 'Maquinaria y energía', base: 'por unidad', qty: '1', unitCost: '3500' },
          { name: 'Empaque y flete', group: 'Servicios y fletes', base: 'por tonelada', qty: '1', unitCost: '420' },
        ],
        fixed: [{ name: 'Administración', amount: '26000' }, { name: 'Servicios y contabilidad', amount: '12000' }],
        wcMethod: 'cycle', wcDaysInventory: 45, wcDaysReceivable: 20, wcDaysPayable: 25,
      },
      finance: { longTermShare: 0.45, longTermRate: 0.125, longTermYears: 8, longTermGrace: 1, longTermGraceType: 'interest', longTermType: 'level', fee: 0.01, seasonalShare: 0, seasonalRate: 0.16 },
      risk: {
        delta: 0.1, varA: 'price', varB: 'yield', dist: 'triangular', corr: -0.35, runs: 2000,
        simPrice: 0.22, simYield: 0.18, simCost: 0.10, simInvest: 0.08, treeProbability: 0.6,
        scenarios: [
          { name: 'Pesimista', probability: '25', price: '-20', yield: '-15', cost: '10', invest: '5' },
          { name: 'Esperado', probability: '50', price: '0', yield: '0', cost: '0', invest: '0' },
          { name: 'Optimista', probability: '25', price: '15', yield: '10', cost: '-5', invest: '0' },
        ],
      },
      social: { standard: 0.90, product: 1.00, labour: 0.65, inputs: 0.95, machinery: 1.00, services: 0.90, admin: 0.90, other: 0.90, investment: null, exchange: 1.05, exportShare: 0, importShare: 0.15, wage: 350, daysPerJob: 270, subsidy: 0, beneficiaries: 1 },
    },

    cafe: {
      es: 'Café de altura con beneficio húmedo en Huatusco', en: 'Highland coffee with a wet mill in Huatusco',
      what: ['Tres años sin cosecha, producto exportable y horizonte largo: tensiona la gestación, la gracia del crédito y la evaluación económica.',
        'Three years with no harvest, an exportable product and a long horizon: it strains the gestation, the loan grace period and the economic appraisal.'],
      teaches: ['Mira el Bloque 5 con y sin gracia en el crédito, y el Bloque 8 con la exportación puesta en 70 %: ahí aparece el valor de las divisas.',
        'Look at Block 5 with and without a grace period, and at Block 8 with exports set to 70%: that is where the value of foreign exchange shows up.'],
      project: {
        name: 'Renovación de cafetal con beneficio húmedo (caso de práctica)',
        owner: 'Sociedad de productores de práctica', location: 'Huatusco, Veracruz',
        kind: 'perennial', unitName: 'ha', scale: 8,
        horizon: 20, baseYear: 2026, gestation: 3, ramp: 3, salvage: 0.25,
        priceBasis: 'constant', inflation: 0.045,
        rate: { mode: 'wacc', equity: 55, debt: 45, costEquity: 0.17, costDebt: 0.125 },
        tax: { income: 0.30, primaryRegime: 'moral', members: 12, umaDaily: 113.14 },
        socialRate: 0.10,
        notes: 'Datos FICTICIOS (salvo el índice de precios, que es el INPC del INEGI), para practicar con la app. No citar.',
      },
      market: {
        series: series([42000, 48000, 44000, 51000, 58000, 72000, 96000, 81000, 88000, 94000],
          [1.8, 1.9, 1.7, 2.0, 1.9, 2.1, 2.0, 1.8, 2.1, 2.2]),
        deflate: true, priceMethod: 'mean', priceLastN: 5, yieldMethod: 'mean', yieldLastN: 5,
        loss: 0.05, soldShare: 1, otherIncome: 0,
        channels: [{ name: 'Exportación por cooperativa', share: '70', factor: '1.1' }, { name: 'Mercado nacional', share: '30', factor: '0.9' }],
        byproducts: [{ name: 'Pulpa para composta', perUnit: '0.4', price: '400' }],
        demand: 9500, supply: 8800, demandGrowth: 0.035, supplyGrowth: 0.02, elasticity: -0.7,
      },
      budget: {
        investments: [
          { name: 'Planta, siembra y sombra', kind: 'Establecimiento de la plantación', qty: '8', unitCost: '55000', year: '0', life: '25', salvagePct: '0', replace: 'no' },
          { name: 'Obra de conservación de suelo', kind: 'Obra civil e instalaciones', qty: '8', unitCost: '8000', year: '0', life: '20', salvagePct: '0', replace: 'no' },
          { name: 'Beneficio húmedo', kind: 'Maquinaria', qty: '1', unitCost: '280000', year: '0', life: '12', salvagePct: '10', replace: 'sí' },
          { name: 'Patios y secadoras', kind: 'Obra civil e instalaciones', qty: '1', unitCost: '160000', year: '0', life: '15', salvagePct: '5', replace: 'sí' },
          { name: 'Herramienta y equipo menor', kind: 'Equipo y herramienta', qty: '8', unitCost: '3500', year: '0', life: '5', salvagePct: '0', replace: 'sí' },
          { name: 'Vehículo de acarreo', kind: 'Vehículos', qty: '1', unitCost: '240000', year: '0', life: '8', salvagePct: '15', replace: 'sí' },
        ],
        deferred: [
          { name: 'Proyecto, certificación y trámites', amount: '120000', year: '0' },
          { name: 'Capacitación en beneficiado', amount: '45000', year: '0' },
        ],
        deferredLife: 5,
        establishment: [
          { name: 'Jornales de mantenimiento', group: 'Mano de obra', base: 'por unidad', qty: '45', unitCost: '350' },
          { name: 'Fertilización', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '13000' },
          { name: 'Control de roya y broca', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '7000' },
        ],
        operating: [
          { name: 'Jornales de manejo', group: 'Mano de obra', base: 'por unidad', qty: '60', unitCost: '350' },
          { name: 'Fertilización', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '16000' },
          { name: 'Control de roya y broca', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '9000' },
          { name: 'Pizca', group: 'Mano de obra', base: 'por tonelada', qty: '1', unitCost: '9500' },
          { name: 'Beneficiado y secado', group: 'Servicios y fletes', base: 'por tonelada', qty: '1', unitCost: '4200' },
          { name: 'Flete y comisión de exportación', group: 'Servicios y fletes', base: 'por tonelada', qty: '1', unitCost: '3800' },
        ],
        fixed: [{ name: 'Administración de la sociedad', amount: '140000' }, { name: 'Certificación anual', amount: '45000' }],
        wcMethod: 'cycle', wcDaysInventory: 90, wcDaysReceivable: 45, wcDaysPayable: 30,
      },
      finance: { longTermShare: 0.5, longTermRate: 0.125, longTermYears: 12, longTermGrace: 3, longTermGraceType: 'interest', longTermType: 'level', fee: 0.015, seasonalShare: 0.6, seasonalRate: 0.155 },
      risk: {
        delta: 0.1, varA: 'price', varB: 'yield', dist: 'pert', corr: -0.2, runs: 3000,
        simPrice: 0.35, simYield: 0.20, simCost: 0.12, simInvest: 0.10, treeProbability: 0.5,
        scenarios: [
          { name: 'Pesimista', probability: '30', price: '-30', yield: '-20', cost: '10', invest: '10' },
          { name: 'Esperado', probability: '45', price: '0', yield: '0', cost: '0', invest: '0' },
          { name: 'Optimista', probability: '25', price: '25', yield: '12', cost: '-5', invest: '0' },
        ],
      },
      social: { standard: 0.90, product: 1.05, labour: 0.60, inputs: 0.95, machinery: 1.00, services: 0.90, admin: 0.90, other: 0.90, investment: null, exchange: 1.10, exportShare: 0.70, importShare: 0.20, wage: 350, daysPerJob: 270, subsidy: 0, beneficiaries: 12 },
    },

    fresa: {
      es: 'Fresa bajo macrotúnel en Zamora', en: 'Strawberry under macrotunnel in Zamora',
      what: ['Inversión grande, crédito pesado y márgenes exigentes: es el caso donde un proyecto rentable se queda sin caja y donde el riesgo decide.',
        'A large investment, a heavy loan and demanding margins: this is the case where a profitable project runs out of cash and where risk decides.'],
      teaches: ['Revisa el saldo de caja del Bloque 5 y la probabilidad de perder del Bloque 7; luego baja el crédito o alarga el plazo y vuelve a mirar.',
        'Look at the cash balance of Block 5 and the probability of a loss in Block 7; then lower the loan or lengthen the term and look again.'],
      project: {
        name: 'Producción de fresa bajo macrotúnel (caso de práctica)',
        owner: 'Empresa agrícola de práctica', location: 'Zamora, Michoacán',
        kind: 'protected', unitName: 'ha', scale: 2,
        horizon: 10, baseYear: 2026, gestation: 0, ramp: 2, salvage: 0.15,
        priceBasis: 'constant', inflation: 0.045,
        rate: { mode: 'capm', rf: 0.075, beta: 1.15, marketPremium: 0.055, countryRisk: 0.02, equity: 40, debt: 60, costDebt: 0.145 },
        tax: { income: 0.30, applyPTU: true, ptu: 0.10, primaryRegime: 'none' },
        socialRate: 0.10,
        notes: 'Datos FICTICIOS (salvo el índice de precios, que es el INPC del INEGI), para practicar con la app. No citar.',
      },
      market: {
        series: series([18500, 21000, 19800, 23400, 26800, 25200, 29500, 31200, 28900, 32400],
          [46, 48, 47, 50, 49, 52, 51, 53, 52, 55]),
        deflate: true, priceMethod: 'trend', priceLastN: 5, yieldMethod: 'mean', yieldLastN: 5,
        loss: 0.12, soldShare: 1, otherIncome: 0,
        channels: [{ name: 'Empacadora de exportación', share: '75', factor: '1.15' }, { name: 'Mercado nacional', share: '25', factor: '0.7' }],
        byproducts: [],
        demand: 28000, supply: 26500, demandGrowth: 0.05, supplyGrowth: 0.045, elasticity: -0.9,
      },
      budget: {
        investments: [
          { name: 'Macrotúnel y estructura', kind: 'Obra civil e instalaciones', qty: '2', unitCost: '650000', year: '0', life: '10', salvagePct: '5', replace: 'sí' },
          { name: 'Riego y fertirriego', kind: 'Equipo y herramienta', qty: '2', unitCost: '210000', year: '0', life: '8', salvagePct: '5', replace: 'sí' },
          { name: 'Cámara fría y andén', kind: 'Equipo y herramienta', qty: '1', unitCost: '430000', year: '0', life: '10', salvagePct: '10', replace: 'sí' },
          { name: 'Pozo, bombeo y obra', kind: 'Obra civil e instalaciones', qty: '1', unitCost: '260000', year: '0', life: '20', salvagePct: '0', replace: 'no' },
          { name: 'Equipo de cosecha y empaque', kind: 'Equipo y herramienta', qty: '1', unitCost: '180000', year: '0', life: '6', salvagePct: '10', replace: 'sí' },
        ],
        deferred: [
          { name: 'Proyecto, permisos y certificación', amount: '160000', year: '0' },
          { name: 'Puesta en marcha y capacitación', amount: '90000', year: '0' },
        ],
        deferredLife: 5,
        establishment: [],
        operating: [
          { name: 'Plántula', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '340000' },
          { name: 'Fertilizantes y solución nutritiva', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '175000' },
          { name: 'Agroquímicos y control biológico', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '95000' },
          { name: 'Acolchado y materiales', group: 'Insumos', base: 'por unidad', qty: '1', unitCost: '70000' },
          { name: 'Jornales', group: 'Mano de obra', base: 'por unidad', qty: '320', unitCost: '350' },
          { name: 'Energía y agua', group: 'Maquinaria y energía', base: 'por unidad', qty: '1', unitCost: '48000' },
          { name: 'Empaque, frío y flete', group: 'Servicios y fletes', base: 'por tonelada', qty: '1', unitCost: '3400' },
        ],
        fixed: [{ name: 'Técnico responsable', amount: '260000' }, { name: 'Administración y seguros', amount: '120000' }],
        wcMethod: 'cycle', wcDaysInventory: 40, wcDaysReceivable: 35, wcDaysPayable: 20,
      },
      finance: { longTermShare: 0.6, longTermRate: 0.145, longTermYears: 8, longTermGrace: 0, longTermGraceType: 'interest', longTermType: 'level', fee: 0.015, seasonalShare: 0.8, seasonalRate: 0.17 },
      risk: {
        delta: 0.1, varA: 'price', varB: 'cost', dist: 'triangular', corr: -0.4, runs: 3000,
        simPrice: 0.28, simYield: 0.15, simCost: 0.15, simInvest: 0.12, treeProbability: 0.45,
        scenarios: [
          { name: 'Pesimista', probability: '30', price: '-25', yield: '-12', cost: '12', invest: '10' },
          { name: 'Esperado', probability: '45', price: '0', yield: '0', cost: '0', invest: '0' },
          { name: 'Optimista', probability: '25', price: '18', yield: '8', cost: '-5', invest: '0' },
        ],
      },
      social: { standard: 0.90, product: 1.02, labour: 0.75, inputs: 0.95, machinery: 1.00, services: 0.90, admin: 0.90, other: 0.90, investment: null, exchange: 1.08, exportShare: 0.75, importShare: 0.30, wage: 350, daysPerJob: 270, subsidy: 0, beneficiaries: 1 },
    },
  };

  /* ================================================================
     turning a case into a project the app can open
     ================================================================ */
  function toProject(key) {
    const c = CASES[key];
    if (!c) return null;
    const p = Project.merge(Project.defaults(), c.project);
    p.market = Project.merge(Project.defaults().market, c.market);
    p.budget = Project.merge(Project.defaults().budget, c.budget);
    p.finance = Project.merge(Project.defaults().finance, c.finance);
    p.risk = Project.merge(Project.defaults().risk, c.risk);
    p.social = Project.merge(Project.defaults().social, c.social);
    p.appraisal = Project.defaults().appraisal;
    return p;
  }

  /* Loads the case into the app: every block rebuilds its own grids and
     redraws, which is what the 'projectloaded' event is for. */
  function load(key) {
    const p = toProject(key);
    if (!p) return null;
    state.project = p;
    Project.save(p);
    document.dispatchEvent(new CustomEvent('projectloaded', { detail: { project: p, practice: key } }));
    return p;
  }

  function downloadProject(key) {
    const p = toProject(key);
    if (!p) return;
    download(JSON.stringify(p, null, 2), 'practica-' + key + '-economicspro.json', 'application/json');
  }

  /* the historical series on its own, to practise the import of Block 3 */
  function downloadSeries(key) {
    const c = CASES[key];
    if (!c) return;
    const head = ['ano', 'precio_nominal', 'rendimiento', 'indice_de_precios'];
    const lines = [head.join(',')].concat(c.market.series.map(r => [r.year, r.price, r.yield, r.index].map(csvEscape).join(',')));
    download(lines.join('\n'), 'practica-' + key + '-serie.csv', 'text/csv;charset=utf-8');
  }

  window.Practice = { CASES, YEARS, CPI, toProject, load, downloadProject, downloadSeries };
})();
