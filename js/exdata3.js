/* EconomicsPro — example series for Block 3.

   IMPORTANT, and the app says it on the screen too: these series are
   ILLUSTRATIVE. They have the order of magnitude, the variability and the
   behaviour that the rural mean prices and yields of these products have had
   in Mexico, and they are here so that anyone can walk the block from end to
   end before having their own data. They are NOT official figures and must not
   be cited as such: the real series are published by the SIAP (yields and rural
   mean prices), by the SNIIM (wholesale market prices) and by INEGI (the
   consumer price index), and whoever writes a thesis has to take them from
   there.

   The price index is the Mexican consumer price index (second half of July
   2018 = 100), rounded to one decimal, and 2025 and 2026 continue it at the
   inflation the project assumes. */

(function () {

  const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  /* consumer price index, December of each year, 2018 = 100 */
  const CPI = [91.6, 98.3, 103.0, 105.9, 109.3, 117.3, 126.5, 132.4, 137.9, 143.4];

  /* Each series: nominal price of the product (per tonne, or per head where
     the unit says so) and yield per unit, as they would be written in the
     grid of the block. */
  const SERIES = {
    avocado: {
      es: 'Aguacate (precio medio rural, $/t; rendimiento t/ha)', en: 'Avocado (rural mean price, $/t; yield t/ha)',
      price: [18400, 19600, 21800, 20400, 24300, 26800, 29500, 27200, 31500, 33800],
      yield: [10.2, 10.6, 10.4, 10.9, 11.3, 11.1, 11.6, 10.8, 11.9, 12.2],
    },
    maize: {
      es: 'Maíz grano de temporal ($/t; t/ha)', en: 'Rain-fed grain maize ($/t; t/ha)',
      price: [3450, 3620, 3980, 3880, 4150, 5240, 6480, 5960, 5480, 5620],
      yield: [3.1, 2.9, 3.4, 3.2, 3.6, 3.3, 3.5, 2.8, 3.6, 3.4],
    },
    greenhouse: {
      es: 'Jitomate saladette de invernadero ($/t; t/ha)', en: 'Greenhouse saladette tomato ($/t; t/ha)',
      price: [11200, 12600, 11900, 13400, 14800, 16200, 18600, 17400, 19800, 21300],
      yield: [265, 280, 292, 288, 305, 312, 298, 316, 324, 330],
    },
    feedlot: {
      es: 'Bovino en pie para engorda ($/t de peso vivo; t ganadas por cabeza)', en: 'Feedlot cattle (live weight, $/t; t gained per head)',
      price: [38500, 41200, 44800, 46300, 52600, 61400, 72800, 78200, 84600, 91200],
      yield: [0.23, 0.24, 0.23, 0.25, 0.24, 0.25, 0.24, 0.26, 0.25, 0.26],
    },
    dairy: {
      es: 'Queso fresco artesanal ($/t; t por línea al año)', en: 'Artisanal fresh cheese ($/t; t per line a year)',
      price: [62000, 66500, 71200, 74800, 82400, 91600, 104000, 112500, 118400, 124800],
      yield: [31, 32, 33, 34, 33, 35, 34, 36, 35, 36],
    },
    irrigation: {
      es: 'Maíz con riego, rendimiento adicional ($/t; t/ha adicionales)', en: 'Irrigated maize, extra yield ($/t; extra t/ha)',
      price: [3450, 3620, 3980, 3880, 4150, 5240, 6480, 5960, 5480, 5620],
      yield: [2.2, 2.4, 2.3, 2.6, 2.5, 2.4, 2.7, 2.3, 2.6, 2.5],
    },
  };

  /* the market the project enters, in the same illustrative spirit */
  const MARKETS = {
    avocado: { demand: 240000, supply: 205000, demandGrowth: 0.035, supplyGrowth: 0.03, elasticity: -0.6, unit: ['t al año en la región', 't a year in the region'] },
    maize: { demand: 180000, supply: 172000, demandGrowth: 0.012, supplyGrowth: 0.01, elasticity: -0.3, unit: ['t al año en la región', 't a year in the region'] },
    greenhouse: { demand: 95000, supply: 78000, demandGrowth: 0.045, supplyGrowth: 0.04, elasticity: -0.8, unit: ['t al año en la zona de venta', 't a year in the selling area'] },
    feedlot: { demand: 32000, supply: 29500, demandGrowth: 0.028, supplyGrowth: 0.025, elasticity: -0.5, unit: ['t de carne al año', 't of meat a year'] },
    dairy: { demand: 4200, supply: 3600, demandGrowth: 0.04, supplyGrowth: 0.03, elasticity: -0.9, unit: ['t de queso al año', 't of cheese a year'] },
    irrigation: { demand: 180000, supply: 172000, demandGrowth: 0.012, supplyGrowth: 0.01, elasticity: -0.3, unit: ['t al año en la región', 't a year in the region'] },
  };

  /* the rows the grid of the block expects */
  function rowsFor(key) {
    const s = SERIES[key] || SERIES.maize;
    return YEARS.map((y, i) => ({
      year: String(y),
      price: String(s.price[i]),
      yield: String(s.yield[i]),
      index: String(CPI[i]),
    }));
  }

  window.ExData3 = { YEARS, CPI, SERIES, MARKETS, rowsFor };
})();
