/* EconomicsPro — Block 3: market, prices and revenue.

   What this block has to answer is simple to say and hard to do well: how much
   will the project produce each year, at what price will it sell it, and what
   revenue does that leave. Everything else here exists to keep that answer
   honest.

   Three rules run through the file:

   · A price series is read in real terms. Nominal prices of different years
     cannot be averaged, and a trend fitted on them measures inflation, not the
     market. The series is deflated with a price index to the base year of the
     project before anything is computed.
   · A forecast states its uncertainty. Every method returns a central value
     and a band, taken from the residuals of the fit or from the variability of
     the series, and that band is what Block 7 turns into risk.
   · The revenue programme follows the biology of the project: the yield ramp
     of Block 2, the share that is actually sold, the premium or the discount
     of each channel, and the by-products. */

(function () {

  /* ================================================================
     1 · the historical series
     ================================================================ */

  /* Deflates a nominal series to the money of `baseYear` with a price index.
     A year without an index keeps its nominal value and is reported, instead
     of silently producing a wrong real price. */
  function deflate(years, nominal, index, baseYear, opt) {
    const o = opt || {};
    const pos = years.indexOf(baseYear);
    const lastPos = lastFiniteIndex(index);
    let baseIdx, usedBase, extrapolated = false;
    if (pos >= 0 && isFinite(index[pos])) {
      baseIdx = index[pos];
      usedBase = baseYear;
    } else if (lastPos >= 0 && isFinite(o.inflation) && baseYear > years[lastPos]) {
      /* the series almost always ends before the base year of the project: the
         index is carried forward with the inflation declared in Block 2, so
         the real series really is in money of the base year */
      baseIdx = index[lastPos] * Math.pow(1 + o.inflation, baseYear - years[lastPos]);
      usedBase = baseYear;
      extrapolated = true;
    } else {
      baseIdx = lastFinite(index);
      usedBase = lastPos >= 0 ? years[lastPos] : null;
    }
    const real = nominal.map((v, i) => {
      const ix = index[i];
      return (v == null || !isFinite(v) || ix == null || !isFinite(ix) || ix <= 0) ? null : v * baseIdx / ix;
    });
    return { real, baseIndex: baseIdx, baseYear: usedBase, extrapolated, missing: index.filter(v => v == null || !isFinite(v)).length };
  }
  function lastFiniteIndex(a) { for (let i = a.length - 1; i >= 0; i--) if (isFinite(a[i])) return i; return -1; }
  function lastFinite(a) { const i = lastFiniteIndex(a); return i < 0 ? null : a[i]; }

  /* The description of a series that a thesis reports: mean, deviation,
     coefficient of variation, compound growth, and the straight line with the
     t test of its slope, so nobody projects a trend that is not there. */
  function describe(years, values) {
    const pairs = years.map((y, i) => [y, values[i]]).filter(p => p[1] != null && isFinite(p[1]));
    const x = pairs.map(p => p[0]), v = pairs.map(p => p[1]);
    if (v.length < 2) return { n: v.length, mean: v.length ? v[0] : null, sd: null, cv: null, cagr: null, trend: null };
    const mean = Stats.mean(v), sd = Stats.sd(v);
    const fit = Stats.linreg(x, v);
    let t = null, p = null;
    if (fit && fit.seB && fit.seB > 0) {
      t = fit.b / fit.seB;
      p = 2 * (1 - studentCdf(Math.abs(t), v.length - 2));
    } else if (fit && fit.seB === 0) {
      /* the points fall exactly on a line: the residual variance is zero, so
         the relation is perfect. A slope of zero is a flat series with no
         trend; any other slope is as significant as it gets. */
      t = fit.b === 0 ? 0 : Infinity;
      p = fit.b === 0 ? 1 : 0;
    }
    return {
      n: v.length, years: x, values: v,
      mean, sd, cv: mean ? sd / Math.abs(mean) : null,
      min: Math.min(...v), max: Math.max(...v),
      cagr: v[0] > 0 && v[v.length - 1] > 0 ? Fin.cagr(v[0], v[v.length - 1], x[x.length - 1] - x[0]) : null,
      trend: fit ? { a: fit.a, b: fit.b, r2: fit.r2, se: fit.se, t, p, significant: p != null && p < 0.05 } : null,
    };
  }

  /* Student's t distribution function, by the incomplete beta function: it is
     needed to say whether a trend of five or ten years is real or is noise. */
  function studentCdf(t, df) {
    if (t === Infinity) return 1;
    if (t === -Infinity) return 0;
    if (!isFinite(t) || df <= 0) return 0.5;
    const x = df / (df + t * t);
    const ib = incompleteBeta(x, df / 2, 0.5);
    return 1 - 0.5 * ib;
  }
  /* Regularised incomplete beta function, by the continued fraction of
     Numerical Recipes, evaluated on the side where it converges fast. */
  function incompleteBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
    const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
    return x < (a + 1) / (a + b + 2)
      ? front * betacf(x, a, b) / a
      : 1 - front * betacf(1 - x, b, a) / b;
  }
  function betacf(x, a, b) {
    const MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function lgamma(z) {
    const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < g.length; i++) x += g[i] / (z + i + 1);
    const t = z + g.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  /* ================================================================
     2 · the forecast
     ================================================================ */

  /* Projects a series over `horizon` years from the last historical year.
     Methods, each with the band that goes with it:
       'mean'   the average of the last k years; band from the deviation
       'trend'  the least squares line; band from the prediction interval
       'cagr'   compound growth of the series; band from the deviation
       'last'   the last value observed; band from the deviation
       'fixed'  a value the user states; band from the percentage given
     The band is one standard deviation wide by default, which is what a
     project document reports as optimistic and pessimistic. */
  function forecast(desc, opt) {
    const o = opt || {};
    const method = o.method || 'mean';
    const h = Math.max(1, Math.round(o.horizon || 1));
    const lastYear = desc.years ? desc.years[desc.years.length - 1] : (o.lastYear || 0);
    const k = Math.max(1, Math.min(o.lastN || 5, desc.n || 1));
    const recent = desc.values ? desc.values.slice(-k) : [];
    const out = [];
    let centre0 = null, spread = null, note = null;

    if (method === 'fixed') {
      centre0 = Number(o.fixed) || 0;
      spread = centre0 * (o.spread == null ? 0.15 : o.spread);
      note = ['valor fijado por el evaluador', 'value set by the analyst'];
    } else if (method === 'trend' && desc.trend) {
      spread = desc.trend.se;
      note = ['tendencia de mínimos cuadrados', 'least squares trend'];
    } else if (method === 'cagr') {
      centre0 = desc.values[desc.values.length - 1];
      spread = desc.sd;
      note = ['crecimiento compuesto de la serie', 'compound growth of the series'];
    } else if (method === 'last') {
      centre0 = desc.values[desc.values.length - 1];
      spread = desc.sd;
      note = ['último valor observado', 'last value observed'];
    } else {
      centre0 = Stats.mean(recent);
      spread = recent.length > 1 ? Stats.sd(recent) : desc.sd;
      note = [`promedio de los últimos ${k} años`, `average of the last ${k} years`];
    }

    const g = method === 'cagr' ? (o.growth == null ? (desc.cagr || 0) : o.growth) : 0;
    for (let i = 1; i <= h; i++) {
      const year = lastYear + i;
      let centre;
      if (method === 'trend' && desc.trend) centre = desc.trend.a + desc.trend.b * year;
      else if (method === 'cagr') centre = centre0 * Math.pow(1 + g, i);
      else centre = centre0;
      /* the prediction interval of a line widens as it leaves the data */
      let sd = spread == null || !isFinite(spread) ? 0 : spread;
      if (method === 'trend' && desc.trend && desc.n > 2) {
        const mx = Stats.mean(desc.years);
        const sxx = desc.years.reduce((a, x) => a + (x - mx) * (x - mx), 0);
        sd = desc.trend.se * Math.sqrt(1 + 1 / desc.n + (sxx > 0 ? Math.pow(year - mx, 2) / sxx : 0));
      }
      out.push({ year, t: i, value: centre, low: centre - sd, high: centre + sd, sd });
    }
    return { method, values: out, note, growth: g, lastN: k, spread };
  }

  /* ================================================================
     3 · the market the project enters
     ================================================================ */

  /* Unsatisfied demand and the share the project would take. A project that
     takes a large share of its market can no longer treat the price as given:
     the app says so and, if an elasticity was stated, estimates how much the
     price would fall. */
  function marketBalance(o) {
    const demand = Number(o.demand) || 0;
    const supply = Number(o.supply) || 0;
    const growth = Number(o.demandGrowth) || 0;
    const years = Math.max(1, Math.round(o.horizon || 1));
    const rows = [];
    for (let t = 1; t <= years; t++) {
      const d = demand * Math.pow(1 + growth, t);
      const s = supply * Math.pow(1 + (Number(o.supplyGrowth) || 0), t);
      rows.push({ t, demand: d, supply: s, gap: d - s });
    }
    const projectVolume = Number(o.projectVolume) || 0;
    const gap0 = rows[0] ? rows[0].gap : demand - supply;
    const share = demand > 0 ? projectVolume / demand : null;
    const shareOfGap = gap0 > 0 ? projectVolume / gap0 : null;
    /* with an elasticity, the price effect of adding that volume:
       %Δprice = (%Δquantity) / elasticity, with the elasticity negative */
    const e = Number(o.elasticity);
    const priceEffect = (isFinite(e) && e < 0 && demand > 0) ? (projectVolume / demand) / e : null;
    return { rows, share, shareOfGap, gap: gap0, priceEffect };
  }

  /* ================================================================
     4 · the production and sales programme
     ================================================================ */

  /* The share of the full yield obtained in year t: nothing while the
     plantation grows, then a straight ramp until it matures. The same rule as
     the laboratory of Block 1, so both agree. */
  function yieldShare(t, gestation, ramp) {
    if (t <= gestation) return 0;
    if (ramp <= 1) return 1;
    const k = t - gestation;
    return Math.min(1, 0.35 + 0.65 * (k - 1) / Math.max(1, ramp - 1));
  }

  /* The weighted price of the channels: each one takes a share of the volume
     and pays a premium or a discount over the reference price. */
  function channelPrice(price, channels) {
    if (!channels || !channels.length) return { price, weight: 1 };
    const total = channels.reduce((a, c) => a + (Number(c.share) || 0), 0);
    if (total <= 0) return { price, weight: 1 };
    const w = channels.reduce((a, c) => a + (Number(c.share) || 0) * (Number(c.factor) == null ? 1 : Number(c.factor)), 0) / total;
    return { price: price * w, weight: w };
  }

  /* Builds the year-by-year table of revenue. Everything the block knows ends
     here, and this is what Blocks 5 and 6 read. */
  function programme(o) {
    const n = Math.max(1, Math.round(o.horizon || 1));
    const scale = Number(o.scale) || 0;
    const full = Number(o.yieldFull) || 0;
    const loss = Math.min(0.95, Math.max(0, Number(o.loss) || 0));
    const sold = Math.min(1, Math.max(0, o.soldShare == null ? 1 : Number(o.soldShare)));
    const rows = [];
    for (let t = 1; t <= n; t++) {
      const share = yieldShare(t, Number(o.gestation) || 0, Number(o.ramp) || 1);
      const yieldT = (o.yieldByYear && o.yieldByYear[t - 1] != null) ? Number(o.yieldByYear[t - 1]) : full * share;
      const gross = yieldT * scale;
      const marketable = gross * (1 - loss);
      const volume = marketable * sold;
      const priceT = (o.priceByYear && o.priceByYear[t - 1] != null) ? Number(o.priceByYear[t - 1]) : Number(o.price) || 0;
      const ch = channelPrice(priceT, o.channels);
      const main = volume * ch.price;
      const by = (o.byproducts || []).reduce((a, b) => a + gross * (Number(b.perUnit) || 0) * (Number(b.price) || 0), 0);
      const other = Number(o.otherIncome) || 0;
      rows.push({
        t, year: (Number(o.baseYear) || 0) + t,
        share, yield: yieldT, production: gross, loss: gross - marketable,
        volume, price: priceT, effectivePrice: ch.price,
        revenue: main, byproducts: by, other, total: main + by + other,
      });
    }
    const totals = rows.reduce((a, r) => ({
      production: a.production + r.production, volume: a.volume + r.volume,
      revenue: a.revenue + r.revenue, byproducts: a.byproducts + r.byproducts, total: a.total + r.total,
    }), { production: 0, volume: 0, revenue: 0, byproducts: 0, total: 0 });
    return { rows, totals, atFull: rows.find(r => r.share >= 1) || rows[rows.length - 1] };
  }

  /* ================================================================
     5 · coherence
     ================================================================ */

  function validate(m, p) {
    const out = [];
    const add = (level, es, en) => out.push({ level, es, en });
    const pd = m.priceDesc, yd = m.yieldDesc;

    if (!pd || pd.n < 2) {
      add('error', 'Hacen falta al menos dos años de precios para proyectar algo.', 'At least two years of prices are needed to project anything.');
    } else if (pd.n < 5) {
      add('warning', `Solo hay ${pd.n} años de precios: cualquier tendencia estimada con tan pocos datos es frágil, y conviene usar el promedio.`,
        `There are only ${pd.n} years of prices: any trend estimated from so few data is fragile, and the average is usually safer.`);
    }
    if (pd && pd.trend && !pd.trend.significant && m.priceMethod === 'trend') {
      /* with two points the slope cannot even be tested; with more, it can be
         tested and simply is not different from zero */
      const how = pd.trend.p == null
        ? ['no se puede probar con tan pocos años', 'cannot be tested with so few years']
        : [pEq(pd.trend.p), pEq(pd.trend.p)];
      add('warning', `La pendiente del precio no es distinta de cero (${how[0]}): estás proyectando una tendencia que los datos no sostienen.`,
        `The slope of the price is not different from zero (${how[1]}): you are projecting a trend the data do not support.`);
    }
    if (pd && pd.cv != null && pd.cv > 0.25) {
      add('warning', `El precio real varía mucho (CV = ${fmtPct(pd.cv, 0)}); el resultado dependerá más del riesgo que de la media. Llévalo al Bloque 7.`,
        `The real price varies a lot (CV = ${fmtPct(pd.cv, 0)}); the result will depend more on risk than on the average. Take it to Block 7.`);
    }
    if (m.deflated && m.deflated.missing > 0) {
      add('warning', `${m.deflated.missing} año(s) de la serie no traen índice de precios y se quedaron en valores nominales.`,
        `${m.deflated.missing} year(s) of the series have no price index and stayed at nominal values.`);
    }
    if (p && p.priceBasis === 'constant' && m.priceMethod === 'cagr' && (m.priceGrowth || 0) > 0.02) {
      add('warning', 'Estás haciendo crecer un precio real a precios constantes: eso supone que el producto se encarecerá frente a todo lo demás, y hay que justificarlo.',
        'You are growing a real price at constant prices: that assumes the product will become dearer than everything else, and it has to be justified.');
    }
    if (m.balance && m.balance.share != null && m.balance.share > 0.2) {
      add('warning', `El proyecto tomaría el ${fmtPct(m.balance.share, 0)} del mercado: con esa participación el precio ya no es un dato, sino algo que el propio proyecto mueve.`,
        `The project would take ${fmtPct(m.balance.share, 0)} of the market: at that share the price is no longer given, it is something the project itself moves.`);
    }
    if (m.balance && m.balance.gap != null && m.balance.gap <= 0) {
      add('warning', 'La oferta actual ya cubre la demanda: el proyecto tendría que desplazar a alguien para vender.',
        'Current supply already covers demand: the project would have to displace someone in order to sell.');
    }
    if (m.programme) {
      const fullRow = m.programme.atFull;
      if (yd && yd.max != null && fullRow && fullRow.yield > yd.max * 1.25) {
        add('warning', `El rendimiento pleno (${fmtNum(fullRow.yield, 2)}) queda ${fmtPct(fullRow.yield / yd.max - 1, 0)} por encima del máximo histórico de la serie.`,
          `The full yield (${fmtNum(fullRow.yield, 2)}) is ${fmtPct(fullRow.yield / yd.max - 1, 0)} above the highest value in the series.`);
      }
      if ((m.loss || 0) > 0.3) {
        add('warning', `Estás suponiendo ${fmtPct(m.loss, 0)} de merma; revísalo, porque se come el ingreso.`, `You are assuming ${fmtPct(m.loss, 0)} of losses; check it, because it eats the revenue.`);
      }
      if (m.programme.totals.total <= 0) {
        add('error', 'El programa de ventas no genera ingreso: revisa rendimiento, precio y escala.', 'The sales programme generates no revenue: check yield, price and scale.');
      }
    }
    const chTotal = (m.channels || []).reduce((a, c) => a + (Number(c.share) || 0), 0);
    if (m.channels && m.channels.length && Math.abs(chTotal - 1) > 0.01 && Math.abs(chTotal - 100) > 1) {
      add('warning', `Los canales de venta suman ${fmtPct(chTotal, 0)}; se normalizan para repartir el volumen, pero conviene que sumen 100 %.`,
        `The sales channels add up to ${fmtPct(chTotal, 0)}; they are normalised to share the volume out, but they should add up to 100%.`);
    }
    return out;
  }

  window.Market = {
    deflate, describe, studentCdf, forecast, marketBalance, yieldShare, channelPrice, programme, validate,
  };
})();
