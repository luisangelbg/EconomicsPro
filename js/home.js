/* EconomicsPro — Block 1: the home page.
   Builds the stepper, the block cards, the strip of project types, the method
   gallery, the comparison of indicators and the reference list. The content
   lives here as bilingual data, so the map of the app is one editable list. */

(function () {

  /* ---------------- the ten blocks ---------------- */
  const BLOCKS = [
    { n: 2, art: 'projSetup', tag: ['proyecto', 'project'],
      t: ['El proyecto y sus supuestos', 'The project and its assumptions'],
      d: ['Define la unidad de producción, el horizonte de evaluación, la moneda y si trabajas a precios constantes o corrientes. Calcula la TREMA a partir de la inflación y el premio al riesgo, o el costo de capital promedio ponderado cuando hay crédito, y fija el régimen fiscal.',
        'Define the productive unit, the appraisal horizon, the currency and whether you work at constant or current prices. Work out the minimum acceptable rate of return from inflation and the risk premium, or the weighted average cost of capital when there is a loan, and set the tax regime.'] },
    { n: 3, art: 'marketPrice', tag: ['mercado', 'market'],
      t: ['Mercado, precios e ingresos', 'Market, prices and revenue'],
      d: ['Series de precios y de rendimientos deflactadas, tendencia y estacionalidad, proyección de la demanda y del precio con su incertidumbre, elasticidades, participación de mercado y el programa de producción y ventas año por año.',
        'Price and yield series in real terms, trend and seasonality, demand and price forecasts with their uncertainty, elasticities, market share and the year-by-year production and sales programme.'] },
    { n: 4, art: 'investCost', tag: ['inversión', 'investment'],
      t: ['Inversión, costos y capital de trabajo', 'Investment, costs and working capital'],
      d: ['Inversión fija y diferida, calendario de inversiones, depreciación por línea recta, saldos decrecientes o suma de dígitos, presupuestos de costos por hectárea o por unidad con sus coeficientes técnicos, y el capital de trabajo que exige el ciclo del cultivo o del hato.',
        'Fixed and pre-operating investment, the investment schedule, depreciation by straight line, declining balance or sum of the years\' digits, cost budgets per hectare or per unit with their technical coefficients, and the working capital the crop or herd cycle demands.'] },
    { n: 5, art: 'proforma', tag: ['estados', 'statements'],
      t: ['Financiamiento y estados proforma', 'Financing and pro-forma statements'],
      d: ['Tablas de amortización del crédito con pagos iguales, capital constante o pago único, con periodo de gracia; estado de resultados, flujo de efectivo con y sin financiamiento, balance general proyectado, punto de equilibrio y razones financieras.',
        'Loan schedules with level instalments, constant principal or a single repayment, with a grace period; income statement, cash flow with and without financing, projected balance sheet, break-even point and financial ratios.'] },
    { n: 6, art: 'npvProfile', tag: ['evaluación', 'appraisal'],
      t: ['Evaluación financiera', 'Financial appraisal'],
      d: ['VAN, TIR y TIR modificada, relación beneficio–costo bruta y neta, índice de rentabilidad, periodo de recuperación simple y descontado, valor anual equivalente para comparar proyectos de distinta duración, perfil del VAN y presupuestos parciales con análisis marginal.',
        'NPV, IRR and modified IRR, gross and net benefit–cost ratio, profitability index, simple and discounted payback, equivalent annual value to compare projects of different length, the NPV profile and partial budgets with marginal analysis.'] },
    { n: 7, art: 'riskFan', tag: ['riesgo', 'risk'],
      t: ['Riesgo e incertidumbre', 'Risk and uncertainty'],
      d: ['Sensibilidad de una y dos variables, valores límite, diagrama de tornado, escenarios pesimista, esperado y optimista, simulación de Monte Carlo con correlación entre precio y rendimiento, y árboles de decisión para las decisiones que se toman por etapas.',
        'One- and two-way sensitivity, switching values, tornado diagrams, pessimistic, expected and optimistic scenarios, Monte Carlo simulation with correlation between price and yield, and decision trees for decisions taken in stages.'] },
    { n: 8, art: 'socialScale', tag: ['social', 'social'],
      t: ['Evaluación económica y social', 'Economic and social appraisal'],
      d: ['Precios cuenta y factores de conversión, corrección por impuestos, subsidios y transferencias, VAN y TIR económicos, empleo generado, divisas netas, distribución del ingreso y los indicadores que piden los programas de inversión pública.',
        'Accounting prices and conversion factors, correction for taxes, subsidies and transfers, economic NPV and IRR, employment created, net foreign exchange, income distribution and the indicators that public investment programmes ask for.'] },
    { n: 9, art: 'decisionFork', tag: ['decisiones', 'decisions'],
      t: ['Comparación y decisiones', 'Comparison and decisions'],
      d: ['Comparación de alternativas con TIR incremental e intersección de Fisher, racionamiento de capital, reemplazo de maquinaria por costo anual equivalente, vida económica óptima, ciclo de renovación de plantaciones por el modelo de Faustmann y la decisión de comprar o arrendar.',
        'Comparison of alternatives with the incremental IRR and Fisher\'s intersection, capital rationing, machinery replacement by equivalent annual cost, optimal economic life, the renewal cycle of a plantation by Faustmann\'s model and the buy-or-lease decision.'] },
    { n: 10, art: 'reportDoc', tag: ['publicar', 'publish'],
      t: ['Figuras e informe', 'Figures and report'],
      d: ['Cada figura del estudio sale con su título y su nota al pie, en claro u oscuro, como PNG, JPG o SVG hasta 900 ppp. Un clic arma el informe con los cuadros, la memoria de cálculo y la metodología con sus citas, y un ZIP con el informe, las figuras, las tablas y el archivo que reproduce el estudio.',
        'Every figure of the study comes out with its own title and footnote, light or dark, as PNG, JPG or SVG at up to 900 dpi. One click builds the report with the tables, the calculation record and the methodology with its citations, and a ZIP with the report, the figures, the tables and the file that reproduces the study.'] },
  ];

  /* ---------------- the kinds of project it was written for ---------------- */
  const MATERIALS = [
    { art: 'matAnnual', k: ['cultivos anuales', 'annual crops'], kc: 'l', t: ['Cultivos anuales', 'Annual crops'], s: ['Maíz, frijol, trigo, hortalizas: un ciclo por año, capital de trabajo que se recupera con la cosecha.', 'Maize, bean, wheat, vegetables: one cycle a year, working capital recovered with the harvest.'] },
    { art: 'matOrchard', k: ['perennes', 'perennials'], kc: '', t: ['Plantaciones perennes', 'Perennial plantations'], s: ['Aguacate, cítricos, café, agave: años sin cosecha, vida larga y comparación por valor anual equivalente.', 'Avocado, citrus, coffee, agave: years with no harvest, a long life and comparison by equivalent annual value.'] },
    { art: 'matGreenhouse', k: ['protegida', 'protected'], kc: 'g', t: ['Agricultura protegida', 'Protected agriculture'], s: ['Invernaderos y malla sombra: inversión alta por hectárea y sensibilidad fuerte al precio.', 'Greenhouses and shade houses: a large investment per hectare and strong sensitivity to price.'] },
    { art: 'matLivestock', k: ['pecuario', 'livestock'], kc: 'l', t: ['Producción pecuaria', 'Livestock production'], s: ['Engorda, leche, ovinos, apicultura: inventario de animales, ciclos cortos y márgenes estrechos.', 'Feedlots, dairy, sheep, beekeeping: animal inventory, short cycles and narrow margins.'] },
    { art: 'matAgroindustry', k: ['agroindustria', 'agro-industry'], kc: 'g', t: ['Plantas agroindustriales', 'Agro-industrial plants'], s: ['Quesos, mezcal, empaques, beneficios: capacidad instalada, punto de equilibrio y valor agregado.', 'Cheese, mezcal, packing, processing: installed capacity, break-even and added value.'] },
    { art: 'matIrrigation', k: ['infraestructura', 'infrastructure'], kc: '', t: ['Riego y maquinaria', 'Irrigation and machinery'], s: ['Proyectos incrementales: solo cuentan los ingresos y costos que el proyecto agrega, y el reemplazo del equipo.', 'Incremental projects: only the revenue and cost the project adds are counted, plus equipment replacement.'] },
    { art: 'matForestry', k: ['forestal', 'forestry'], kc: 'l', t: ['Forestal y agroforestal', 'Forestry and agroforestry'], s: ['Rotaciones largas, cosecha única y valor de la tierra por el modelo de Faustmann.', 'Long rotations, a single harvest and the value of the land by Faustmann\'s model.'] },
    { art: 'matSocial', k: ['social', 'social'], kc: 'g', t: ['Proyectos sociales y públicos', 'Social and public projects'], s: ['Obras y programas de inversión pública: precios cuenta, empleo, divisas y beneficios no comerciales.', 'Public works and investment programmes: accounting prices, employment, foreign exchange and non-traded benefits.'] },
  ];

  /* ---------------- method gallery ---------------- */
  const FAMS = {
    fin: ['rentabilidad', 'profitability'], tas: ['tasas', 'rates'], flu: ['flujos y costos', 'flows and costs'],
    mer: ['mercado', 'market'], rie: ['riesgo', 'risk'], soc: ['evaluación social', 'social appraisal'], dec: ['decisiones', 'decisions'],
  };
  const METHODS = [
    { art: 'npvBars', fam: 'fin', n: ['Valor actual neto', 'Net present value'], s: ['VAN a la tasa que exige el inversionista', 'NPV at the rate the investor demands'] },
    { art: 'irrCross', fam: 'fin', n: ['Tasa interna de retorno', 'Internal rate of return'], s: ['con aviso de TIR múltiple', 'with a warning for multiple IRRs'] },
    { art: 'mirrArrow', fam: 'fin', n: ['TIR modificada', 'Modified IRR'], s: ['reinversión a una tasa realista', 'reinvestment at a realistic rate'] },
    { art: 'bcScale', fam: 'fin', n: ['Relación beneficio–costo', 'Benefit–cost ratio'], s: ['bruta y neta, descontadas', 'gross and net, discounted'] },
    { art: 'paybackLine', fam: 'fin', n: ['Periodo de recuperación', 'Payback period'], s: ['simple y descontado', 'simple and discounted'] },
    { art: 'eaaBars', fam: 'fin', n: ['Valor anual equivalente', 'Equivalent annual value'], s: ['compara horizontes distintos', 'compares different horizons'] },
    { art: 'partialBudget', fam: 'fin', n: ['Presupuesto parcial', 'Partial budget'], s: ['qué cambia al cambiar la tecnología', 'what changes when technology changes'] },
    { art: 'marginalRate', fam: 'fin', n: ['Análisis marginal', 'Marginal analysis'], s: ['dominancia y tasa de retorno marginal', 'dominance and marginal rate of return'] },
    { art: 'waccMix', fam: 'tas', n: ['Costo de capital', 'Cost of capital'], s: ['CPPC con deuda y capital propio', 'WACC with debt and equity'] },
    { art: 'capmLine', fam: 'tas', n: ['TREMA y CAPM', 'MARR and CAPM'], s: ['premio al riesgo y riesgo país', 'risk premium and country risk'] },
    { art: 'fisherFig', fam: 'tas', n: ['Tasas reales y nominales', 'Real and nominal rates'], s: ['ecuación de Fisher, sin aproximar', 'Fisher\'s equation, not approximated'] },
    { art: 'amortTable', fam: 'tas', n: ['Tablas de amortización', 'Loan schedules'], s: ['pagos iguales, capital constante, gracia', 'level, constant principal, grace'] },
    { art: 'cashTable', fam: 'flu', n: ['Flujo de efectivo', 'Cash flow'], s: ['del proyecto y del inversionista', 'of the project and of the investor'] },
    { art: 'incomeStatement', fam: 'flu', n: ['Estados proforma', 'Pro-forma statements'], s: ['resultados, flujo y balance', 'income, cash flow and balance sheet'] },
    { art: 'workingCapital', fam: 'flu', n: ['Capital de trabajo', 'Working capital'], s: ['ciclo de caja del cultivo o el hato', 'cash cycle of the crop or the herd'] },
    { art: 'depreciationStep', fam: 'flu', n: ['Depreciación', 'Depreciation'], s: ['línea recta, saldos, dígitos, unidades', 'line, balance, digits, units'] },
    { art: 'breakevenCross', fam: 'flu', n: ['Punto de equilibrio', 'Break-even point'], s: ['en volumen, en precio y en rendimiento', 'in volume, in price and in yield'] },
    { art: 'leverageBeam', fam: 'flu', n: ['Apalancamiento', 'Leverage'], s: ['operativo, financiero y total', 'operating, financial and total'] },
    { art: 'priceTrend', fam: 'mer', n: ['Series de precios', 'Price series'], s: ['deflactadas, con tendencia', 'deflated, with a trend'] },
    { art: 'demandCurve', fam: 'mer', n: ['Oferta y demanda', 'Supply and demand'], s: ['balance del mercado y del proyecto', 'market and project balance'] },
    { art: 'elasticityFig', fam: 'mer', n: ['Elasticidades', 'Elasticities'], s: ['precio, ingreso y cruzada', 'price, income and cross'] },
    { art: 'salesProgram', fam: 'mer', n: ['Programa de ventas', 'Sales programme'], s: ['capacidad usada año por año', 'capacity used year by year'] },
    { art: 'tornadoFig', fam: 'rie', n: ['Análisis de sensibilidad', 'Sensitivity analysis'], s: ['una variable, dos variables, tornado', 'one variable, two variables, tornado'] },
    { art: 'switchingFig', fam: 'rie', n: ['Valores límite', 'Switching values'], s: ['cuánto aguanta antes de no convenir', 'how far it can fall before failing'] },
    { art: 'scenarioCards', fam: 'rie', n: ['Escenarios', 'Scenarios'], s: ['pesimista, esperado y optimista', 'pessimistic, expected and optimistic'] },
    { art: 'montecarloHist', fam: 'rie', n: ['Simulación de Monte Carlo', 'Monte Carlo simulation'], s: ['con correlación entre variables', 'with correlation between variables'] },
    { art: 'decisionTree', fam: 'rie', n: ['Árboles de decisión', 'Decision trees'], s: ['decidir por etapas, valor de la información', 'staged decisions, value of information'] },
    { art: 'shadowPrice', fam: 'soc', n: ['Precios cuenta', 'Accounting prices'], s: ['factores de conversión y transferencias', 'conversion factors and transfers'] },
    { art: 'socialBC', fam: 'soc', n: ['VAN y TIR económicos', 'Economic NPV and IRR'], s: ['el proyecto visto por el país', 'the project seen by the country'] },
    { art: 'employmentFig', fam: 'soc', n: ['Empleo y distribución', 'Employment and distribution'], s: ['jornales, beneficiarios y su reparto', 'labour days, beneficiaries and their share'] },
    { art: 'foreignExchange', fam: 'soc', n: ['Divisas', 'Foreign exchange'], s: ['efecto neto sobre la balanza', 'net effect on the balance'] },
    { art: 'compareProjects', fam: 'dec', n: ['Comparar alternativas', 'Compare alternatives'], s: ['cartera ordenada por su aporte', 'a portfolio ranked by its contribution'] },
    { art: 'incrementalFig', fam: 'dec', n: ['TIR incremental', 'Incremental IRR'], s: ['cuando VAN y TIR se contradicen', 'when NPV and IRR disagree'] },
    { art: 'rationingFig', fam: 'dec', n: ['Racionamiento de capital', 'Capital rationing'], s: ['el mejor paquete con presupuesto fijo', 'the best package under a fixed budget'] },
    { art: 'replacementFig', fam: 'dec', n: ['Reemplazo y vida óptima', 'Replacement and optimal life'], s: ['maquinaria por costo anual equivalente', 'machinery by equivalent annual cost'] },
    { art: 'faustmannFig', fam: 'dec', n: ['Rotación óptima', 'Optimal rotation'], s: ['renovar la plantación con Faustmann', 'renewing a plantation with Faustmann'] },
  ];

  /* ---------------- what it brings together ---------------- */
  const ICONS = {
    route: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M8.6 18H13a4 4 0 0 0 0-8H8a4 4 0 0 1 0-8h1"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    fig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    seed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21c0-6 3-11 9-12 0 7-4 11-9 12z"/><path d="M12 21C12 14 8 10 3 9c0 7 4 11 9 12z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="7" rx="8" ry="3.4"/><path d="M4 7v6c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4V7"/><path d="M4 13v4c0 1.9 3.6 3.4 8 3.4s8-1.5 8-3.4v-4"/></svg>',
  };
  const BRING = [
    ['route', ['Del estudio de mercado al dictamen', 'From the market study to the verdict'],
      ['Los diez bloques siguen el orden en que se formula un proyecto, así que la app se recorre una vez y el documento queda armado.', 'The ten blocks follow the order in which a project is formulated, so the app is walked once and the document comes out finished.']],
    ['seed', ['Pensada para el campo, no para la bolsa', 'Written for the field, not for the stock market'],
      ['Años de gestación, estacionalidad, capital de trabajo por ciclo, valor residual de la plantación, riesgo de precio y de clima: lo que distingue a un proyecto agropecuario.', 'Years to bear, seasonality, working capital per cycle, the residual value of the plantation, price and weather risk: what makes an agricultural project different.']],
    ['check', ['Revisa antes de calcular', 'It checks before it computes'],
      ['Avisa si mezclaste precios corrientes con una tasa real, si la TIR es múltiple, si el capital de trabajo no se recupera o si el horizonte no alcanza para que la plantación produzca.', 'It warns if you mixed current prices with a real rate, if the IRR is multiple, if the working capital is never recovered or if the horizon is too short for the plantation to bear.']],
    ['chat', ['Explica cada resultado', 'It explains every result'],
      ['Cada cuadro trae su lectura escrita: qué significa el número, qué decisión sostiene y qué no se puede concluir con él.', 'Every table comes with its reading: what the number means, what decision it supports and what cannot be concluded from it.']],
    ['fig', ['Figuras y cuadros listos para la tesis', 'Figures and tables ready for the thesis'],
      ['Perfil del VAN, tornado, histograma de la simulación, punto de equilibrio y flujo de caja, editables y en alta resolución.', 'NPV profile, tornado, simulation histogram, break-even and cash flow, editable and at high resolution.']],
    ['lock', ['Tus datos no salen de tu computadora', 'Your data never leave your computer'],
      ['Todo se calcula en el navegador. No hay servidor, no hay cuenta y no hay conexión: puedes trabajar el proyecto en el campo, sin internet.', 'Everything is computed in the browser. There is no server, no account and no connection: you can work on the project in the field, with no internet.']],
  ];

  /* ---------------- indicators side by side ---------------- */
  const COMPARE_COLS = [
    ['Qué responde', 'What it answers'],
    ['En qué unidad', 'In what unit'],
    ['Sirve para elegir entre proyectos', 'Use for choosing between projects'],
    ['Cuidado con', 'Watch out for'],
  ];
  const COMPARE = [
    [['VAN', 'NPV'],
      { es: '¿Cuánta riqueza agrega el proyecto, hoy, por encima de la tasa que exijo?', en: 'How much wealth does the project add, today, above the rate I demand?' },
      { es: 'Dinero', en: 'Money' },
      { c: 'yes', es: 'Sí: es el criterio que no se equivoca', en: 'Yes: the criterion that does not fail' },
      { es: 'Depende de la tasa elegida y favorece al proyecto más grande', en: 'It depends on the chosen rate and favours the larger project' }],
    [['TIR', 'IRR'],
      { es: '¿A qué tasa anual rinde el dinero mientras está metido en el proyecto?', en: 'What annual rate does the money earn while it is inside the project?' },
      { es: 'Porcentaje', en: 'Per cent' },
      { c: 'opt', es: 'Solo junto con el VAN', en: 'Only alongside the NPV' },
      { es: 'Puede no existir o ser múltiple, y supone reinvertir a la propia TIR', en: 'It may not exist or may be multiple, and it assumes reinvestment at the IRR itself' }],
    [['TIRM', 'MIRR'],
      { es: 'Lo mismo, pero reinvirtiendo a una tasa realista', en: 'The same, but reinvesting at a realistic rate' },
      { es: 'Porcentaje', en: 'Per cent' },
      { c: 'yes', es: 'Sí, cuando la TIR es múltiple', en: 'Yes, when the IRR is multiple' },
      { es: 'Hay que declarar las dos tasas que se usaron', en: 'The two rates used have to be stated' }],
    [['B/C', 'B/C'],
      { es: '¿Cuántos pesos de beneficio deja cada peso de costo?', en: 'How many pesos of benefit does each peso of cost leave?' },
      { es: 'Razón', en: 'Ratio' },
      { c: 'opt', es: 'Para jerarquizar, no para elegir', en: 'To rank, not to choose' },
      { es: 'Cambia según qué se cuente como costo y qué como menor beneficio', en: 'It changes with what counts as a cost and what as a smaller benefit' }],
    [['PR', 'PB'],
      { es: '¿En cuántos años recupero lo invertido?', en: 'In how many years do I get the investment back?' },
      { es: 'Años', en: 'Years' },
      { c: 'no', es: 'No: ignora todo lo que pasa después', en: 'No: it ignores everything that happens later' },
      { es: 'Solo el descontado toma en cuenta el costo del dinero', en: 'Only the discounted one accounts for the cost of money' }],
    [['VAE', 'EAV'],
      { es: '¿Cuánto deja el proyecto por año, en promedio equivalente?', en: 'How much does the project leave per year, as an equivalent average?' },
      { es: 'Dinero por año', en: 'Money per year' },
      { c: 'yes', es: 'Sí, y es el único justo entre horizontes distintos', en: 'Yes, and the only fair one between different horizons' },
      { es: 'Supone que el proyecto se repite al terminar', en: 'It assumes the project is repeated when it ends' }],
  ];

  /* ---------------- references ---------------- */
  const REFS = [
    ['fin', 'Gittinger, J.P. (1982)', 'Economic Analysis of Agricultural Projects, 2nd ed. Johns Hopkins University Press, Baltimore. <i>El libro que fijó la manera de evaluar proyectos agrícolas.</i>'],
    ['fin', 'Baca Urbina, G. (2013)', 'Evaluación de proyectos, 7.ª ed. McGraw-Hill, México.'],
    ['fin', 'Sapag Chaín, N. & Sapag Chaín, R. (2011)', 'Preparación y evaluación de proyectos, 5.ª ed. McGraw-Hill, Santiago.'],
    ['fin', 'Coss Bu, R. (2005)', 'Análisis y evaluación de proyectos de inversión, 2.ª ed. Limusa, México.'],
    ['fin', 'Perrin, R.K., Winkelmann, D.L., Moscardi, E.R. & Anderson, J.R. (1976)', 'From Agronomic Data to Farmer Recommendations: An Economics Training Manual. CIMMYT, México. <i>Presupuestos parciales, dominancia y tasa de retorno marginal.</i>'],
    ['tas', 'Brealey, R.A., Myers, S.C. & Allen, F. (2020)', 'Principles of Corporate Finance, 13th ed. McGraw-Hill, New York.'],
    ['tas', 'Fisher, I. (1930)', 'The Theory of Interest. Macmillan, New York.'],
    ['tas', 'Sharpe, W.F. (1964)', 'Capital asset prices: a theory of market equilibrium under conditions of risk. <i>The Journal of Finance</i> 19: 425–442.'],
    ['tas', 'Damodaran, A. (2012)', 'Investment Valuation, 3rd ed. Wiley, Hoboken.'],
    ['flu', 'Kay, R.D., Edwards, W.M. & Duffy, P.A. (2020)', 'Farm Management, 9th ed. McGraw-Hill, New York.'],
    ['flu', 'Barry, P.J. & Ellinger, P.N. (2012)', 'Financial Management in Agriculture, 7th ed. Pearson, Upper Saddle River.'],
    ['flu', 'Horngren, C.T., Datar, S.M. & Rajan, M.V. (2015)', 'Cost Accounting: A Managerial Emphasis, 15th ed. Pearson, Boston.'],
    ['mer', 'Tomek, W.G. & Kaiser, H.M. (2014)', 'Agricultural Product Prices, 5th ed. Cornell University Press, Ithaca.'],
    ['mer', 'Norton, G.W., Alwang, J. & Masters, W.A. (2015)', 'Economics of Agricultural Development, 3rd ed. Routledge, London.'],
    ['rie', 'Hardaker, J.B., Lien, G., Anderson, J.R. & Huirne, R.B.M. (2015)', 'Coping with Risk in Agriculture, 3rd ed. CABI, Wallingford.'],
    ['rie', 'Savvides, S.C. (1994)', 'Risk analysis in investment appraisal. <i>Project Appraisal</i> 9: 3–18.'],
    ['rie', 'Vose, D. (2008)', 'Risk Analysis: A Quantitative Guide, 3rd ed. Wiley, Chichester.'],
    ['rie', 'Iman, R.L. & Conover, W.J. (1982)', 'A distribution-free approach to inducing rank correlation among input variables. <i>Communications in Statistics</i> 11: 311–334.'],
    ['soc', 'Squire, L. & van der Tak, H.G. (1975)', 'Economic Analysis of Projects. Johns Hopkins University Press, Baltimore.'],
    ['soc', 'Dasgupta, P., Marglin, S. & Sen, A. (1972)', 'Guidelines for Project Evaluation. UNIDO, Vienna.'],
    ['soc', 'Belli, P., Anderson, J.R., Barnum, H.N., Dixon, J.A. & Tan, J.-P. (2001)', 'Economic Analysis of Investment Operations. World Bank Institute, Washington.'],
    ['soc', 'Boardman, A.E., Greenberg, D.H., Vining, A.R. & Weimer, D.L. (2018)', 'Cost-Benefit Analysis: Concepts and Practice, 5th ed. Cambridge University Press.'],
    ['dec', 'Faustmann, M. (1849)', 'Berechnung des Wertes welchen Waldboden sowie noch nicht haubare Holzbestände für die Waldwirtschaft besitzen. <i>Allgemeine Forst- und Jagd-Zeitung</i> 25: 441–455.'],
    ['dec', 'Lorie, J.H. & Savage, L.J. (1955)', 'Three problems in rationing capital. <i>The Journal of Business</i> 28: 229–239.'],
    ['dec', 'Perrin, R.K. (1972)', 'Asset replacement principles. <i>American Journal of Agricultural Economics</i> 54: 60–67.'],
  ];

  /* ---------------- renderers ---------------- */
  const two = pair => L2(pair[0], pair[1]);

  function renderStepper() {
    const nav = el('stepper');
    if (!nav) return;
    nav.innerHTML = STEPS.map(s => `<button class="step-btn${s.n === 1 ? ' active' : ''}" data-step="${s.n}"${s.ready ? '' : ' disabled'}><span class="step-num">${s.n}</span>${L2(s.es, s.en)}</button>`).join('');
  }

  function renderFeatures() {
    const g = el('featureGrid');
    if (!g) return;
    g.innerHTML = '';
    BLOCKS.forEach(b => {
      const card = mk('div', { class: 'feature', tabindex: '0', role: 'button' });
      const ready = !(document.querySelector(`.step-btn[data-step="${b.n}"]`) || {}).disabled;
      card.innerHTML = `<div class="f-num">${b.n}</div>` +
        `<div class="f-art">${Art[b.art] ? Art[b.art]() : ''}</div><div class="f-tag">${two(b.tag)}${ready ? '' : ` <span class="f-soon">${L2('en construcción', 'coming next')}</span>`}</div><h3>${two(b.t)}</h3><p>${two(b.d)}</p>`;
      const open = () => {
        const btn = document.querySelector('.step-btn[data-step="' + b.n + '"]');
        if (btn && !btn.disabled) goStep(b.n);
        else {
          const m = el('homeMessages');
          if (m) {
            clearMessages(m);
            showMessage(m, 'info', L2(`El bloque ${b.n} se construye en una etapa posterior; la portada ya muestra lo que hará.`, `Block ${b.n} is built in a later stage; the home page already shows what it will do.`));
            m.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      g.appendChild(card);
    });
  }

  function renderMaterials() {
    const g = el('materialStrip');
    if (!g) return;
    g.innerHTML = MATERIALS.map(m => `<div class="material">${Art[m.art]()}<div class="mt-t">${two(m.t)}</div><div class="mt-s">${two(m.s)}</div><span class="mt-k ${m.kc}">${two(m.k)}</span></div>`).join('');
  }

  let famFilter = 'all';
  function renderMethods() {
    const g = el('methodGallery'), f = el('methodFilter');
    if (!g) return;
    if (f && !f.dataset.built) {
      f.dataset.built = '1';
      f.innerHTML = `<button class="chip on" data-fam="all">${L2('todos', 'all')} · ${METHODS.length}</button>` +
        Object.keys(FAMS).map(k => `<button class="chip" data-fam="${k}">${two(FAMS[k])} · ${METHODS.filter(m => m.fam === k).length}</button>`).join('');
      f.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        famFilter = b.dataset.fam;
        els('.chip', f).forEach(c => c.classList.toggle('on', c === b));
        renderMethods();
      });
    }
    g.innerHTML = METHODS.filter(m => famFilter === 'all' || m.fam === famFilter).map(m =>
      `<div class="method-card"><span class="m-fam ${m.fam}">${two(FAMS[m.fam])}</span>${Art[m.art] ? Art[m.art]() : ''}<div class="m-name">${two(m.n)}</div><div class="m-sub">${two(m.s)}</div></div>`).join('');
  }

  /* the three practice databases, with what each one is good for */
  function renderPractice() {
    const g = el('practiceGrid');
    if (!g || typeof Practice === 'undefined') return;
    g.innerHTML = '';
    Object.keys(Practice.CASES).forEach((key, i) => {
      const c = Practice.CASES[key];
      const pr = c.project;
      const card = mk('div', { class: 'feature' });
      card.innerHTML = `<div class="f-num">${i + 1}</div>
        <div class="f-art">${Art[Project.KINDS[pr.kind].art] ? Art[Project.KINDS[pr.kind].art]() : ''}</div>
        <div class="f-tag">${L2(Project.KINDS[pr.kind].es, Project.KINDS[pr.kind].en)}</div>
        <h3>${L2(c.es, c.en)}</h3>
        <p>${L2(c.what[0], c.what[1])}</p>
        <p class="hint" style="margin:0 0 10px">${L2(`<b>${pr.scale} ${pr.unitName}</b> · ${pr.horizon} años · ${L2('primera cosecha en el año', 'first harvest in year')} ${pr.gestation + 1} · ${pr.location}`,
        `<b>${pr.scale} ${pr.unitName}</b> · ${pr.horizon} years · first harvest in year ${pr.gestation + 1} · ${pr.location}`)}</p>
        <p class="hint" style="margin:0 0 12px"><b>${L2('Qué practicar', 'What to practise')}:</b> ${L2(c.teaches[0], c.teaches[1])}</p>
        <div class="btn-row" style="margin:0">
          <button class="btn btn-primary btn-sm" data-load="${key}">${L2('Cargar en la app', 'Load into the app')}</button>
          <button class="btn btn-secondary btn-sm" data-json="${key}">${L2('.json', '.json')}</button>
          <button class="btn btn-secondary btn-sm" data-csv="${key}">${L2('serie .csv', 'series .csv')}</button>
        </div>`;
      g.appendChild(card);
    });
    if (!g.dataset.wired) {
      g.dataset.wired = '1';
      g.addEventListener('click', e => {
        const load = e.target.closest('[data-load]'), json = e.target.closest('[data-json]'), csv = e.target.closest('[data-csv]');
        if (load) {
          const key = load.dataset.load;
          Practice.load(key);
          const m = el('homeMessages');
          if (m) {
            clearMessages(m);
            showMessage(m, 'success', L2(
              `Cargado: ${Practice.CASES[key].es}. Los diez bloques ya traen sus datos; empieza por el Bloque 2 y sigue el orden. Recuerda que las cifras son ficticias.`,
              `Loaded: ${Practice.CASES[key].en}. All ten blocks now carry its data; start with Block 2 and follow the order. Remember the figures are fictional.`));
          }
          goStep(2);
        } else if (json) Practice.downloadProject(json.dataset.json);
        else if (csv) Practice.downloadSeries(csv.dataset.csv);
      });
    }
  }

  function renderBring() {
    const g = el('bringGrid');
    if (!g) return;
    g.innerHTML = BRING.map(b => `<div class="bring"><div class="b-ic">${ICONS[b[0]]}</div><div><b>${two(b[1])}</b><span>${two(b[2])}</span></div></div>`).join('');
  }

  function renderCompare() {
    const wrap = el('methodCompare');
    if (!wrap) return;
    let html = '<table><thead><tr><th></th>' + COMPARE_COLS.map(c => `<th>${two(c)}</th>`).join('') + '</tr></thead><tbody>';
    COMPARE.forEach(row => {
      html += `<tr><td>${two(row[0])}</td>` + row.slice(1).map(c => `<td>${c.c ? `<span class="${c.c}">${c.c === 'yes' ? '●' : c.c === 'no' ? '○' : '◐'}</span> ` : ''}${L2(c.es, c.en)}</td>`).join('') + '</tr>';
    });
    wrap.innerHTML = html + '</tbody></table>';
  }

  let refFilter = 'all';
  function renderRefs() {
    const g = el('refList'), f = el('refFilter');
    if (!g) return;
    if (f && !f.dataset.built) {
      f.dataset.built = '1';
      f.innerHTML = `<button class="chip on" data-fam="all">${L2('todas', 'all')} · ${REFS.length}</button>` +
        Object.keys(FAMS).map(k => `<button class="chip" data-fam="${k}">${two(FAMS[k])}</button>`).join('');
      f.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        refFilter = b.dataset.fam;
        els('.chip', f).forEach(c => c.classList.toggle('on', c === b));
        renderRefs();
      });
    }
    g.innerHTML = REFS.filter(r => refFilter === 'all' || r[0] === refFilter).map(r => `<li><b>${r[1]}</b> ${r[2]}</li>`).join('');
  }

  /* illustrations that contain translated labels are redrawn when the language changes */
  function renderArt() {
    const h = el('heroArt'); if (h) h.innerHTML = Art.hero();
    const figs = {
      theoryTimeFig: 'npvBars', theoryIndFig: 'npvProfile', theoryPriceFig: 'fisherFig', theoryCashFig: 'workingCapital',
      theoryAgroFig: 'matOrchard', theorySocialFig: 'shadowPrice', theoryRiskFig: 'tornadoFig', theoryDocFig: 'reportDoc',
    };
    for (const id in figs) {
      const n = el(id);
      if (n) { const cap = n.querySelector('.cap'); n.innerHTML = Art[figs[id]](); if (cap) n.appendChild(cap); }
    }
    const b = el('brandLogo');
    if (b) b.innerHTML = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 25 L11 15 L18 19 L28 6" stroke="var(--primary)" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="11" cy="15" r="2.4" fill="var(--leaf)"/><circle cx="18" cy="19" r="2.4" fill="var(--leaf)"/>
      <ellipse cx="27" cy="25" rx="5" ry="3.6" fill="var(--gold)"/><ellipse cx="27" cy="23.2" rx="5" ry="3.6" fill="var(--gold)" stroke="var(--card-bg)" stroke-width="1.2"/></svg>`;
  }

  /* ---------------- navigation ---------------- */
  function wire() {
    const nav = el('stepper');
    if (nav) nav.addEventListener('click', e => { const b = e.target.closest('.step-btn'); if (b && !b.disabled) goStep(b.dataset.step); });
    const brand = el('brand');
    if (brand) brand.addEventListener('click', () => goStep(1));
    const scrollTo = id => { const n = el(id); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const on = (id, fn) => { const n = el(id); if (n) n.addEventListener('click', fn); };
    on('startBtn', () => {
      const b = document.querySelector('.step-btn[data-step="2"]');
      if (b && !b.disabled) goStep(2);
      else {
        const m = el('homeMessages');
        if (m) {
          clearMessages(m);
          showMessage(m, 'info', L2('La captura del proyecto llega con el Bloque 2. Mientras tanto, prueba los laboratorios y la teoría de esta página.', 'Entering your own project arrives with Block 2. Meanwhile, try the labs and the theory on this page.'));
          m.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
    on('simBtn', () => scrollTo('labs'));
    on('theoryBtn', () => { scrollTo('theory'); const first = document.querySelector('#theory .acc'); if (first) first.open = true; });
    on('citeBtn', () => scrollTo('cite'));
    on('copyCite', () => {
      const t = el('citeText');
      if (!t || !navigator.clipboard) return;
      const txt = [...t.querySelectorAll('[data-l="' + I18N.lang + '"]')].map(n => n.textContent).join('') || t.textContent;
      navigator.clipboard.writeText(txt.trim()).then(() => {
        const b = el('copyCite'); if (b) { b.textContent = T('✓ Copiada', '✓ Copied'); setTimeout(() => I18N.apply(b.parentNode), 1800); }
      });
    });
    /* the illustrations carry their own labels, so the cards, the project types
       and the method gallery are drawn again when the language changes */
    const redraw = () => { renderArt(); renderFeatures(); renderMaterials(); renderMethods(); renderPractice(); };
    document.addEventListener('langchange', redraw);
    document.addEventListener('themechange', renderArt);
  }

  function init() {
    renderStepper();
    renderArt();
    renderFeatures();
    renderMaterials();
    renderPractice();
    renderMethods();
    renderBring();
    renderCompare();
    renderRefs();
    wire();
    I18N.apply();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Home = { BLOCKS, METHODS, REFS, MATERIALS, COMPARE };
})();
