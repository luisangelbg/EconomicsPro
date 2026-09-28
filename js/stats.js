/* EconomicsPro — the small statistical toolbox.

   Project appraisal needs less statistics than an experiment, but it does need
   it to be right: the trend of a price series, the deviation that feeds the
   simulation, the histogram of the simulated net present values and the
   probability that the project loses money. Everything here is written from
   the definition and checked in tests/index.html against published values. */

(function () {

  const num = a => a.map(Number).filter(v => isFinite(v));

  function sum(a) { return num(a).reduce((x, y) => x + y, 0); }
  function mean(a) { const v = num(a); return v.length ? sum(v) / v.length : null; }
  /* sample variance and deviation, divided by n − 1 */
  function variance(a) {
    const v = num(a);
    if (v.length < 2) return null;
    const m = mean(v);
    return v.reduce((x, y) => x + (y - m) * (y - m), 0) / (v.length - 1);
  }
  function sd(a) { const s = variance(a); return s == null ? null : Math.sqrt(s); }
  /* coefficient of variation, the usual measure of risk per unit of return */
  function cv(a) { const m = mean(a), s = sd(a); return m && s != null ? s / Math.abs(m) : null; }
  function median(a) { const v = num(a).sort((x, y) => x - y); return v.length ? Fin.quantile(v, 0.5) : null; }
  function range(a) { const v = num(a); return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null; }

  /* Pearson correlation, used to link price and yield in the simulation. */
  function pearson(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 3) return null;
    const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
  }

  /* Least squares line y = a + b x, with the coefficient of determination.
     Block 3 uses it to project prices and yields, and reports that a straight
     line through few years is a weak forecast. */
  function linreg(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return null;
    const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    if (sxx === 0) return null;
    const b = sxy / sxx, a = my - b * mx;
    const ssr = b * sxy, sse = syy - ssr;
    const df = n - 2;
    const mse = df > 0 ? sse / df : null;
    return {
      a, b, n,
      r2: syy > 0 ? ssr / syy : null,
      se: mse != null ? Math.sqrt(mse) : null,
      seB: mse != null && sxx > 0 ? Math.sqrt(mse / sxx) : null,
      predict: xv => a + b * xv,
    };
  }

  /* Histogram with a fixed number of equal classes, for the simulation figure. */
  function histogram(values, bins) {
    const v = num(values);
    if (!v.length) return { bins: [], min: 0, max: 0 };
    const k = bins || Math.max(8, Math.min(40, Math.round(Math.sqrt(v.length))));
    const min = Math.min(...v), max = Math.max(...v);
    const w = (max - min) / k || 1;
    const counts = new Array(k).fill(0);
    v.forEach(x => {
      let i = Math.floor((x - min) / w);
      if (i >= k) i = k - 1;
      if (i < 0) i = 0;
      counts[i]++;
    });
    return {
      min, max, width: w, n: v.length,
      bins: counts.map((c, i) => ({ from: min + i * w, to: min + (i + 1) * w, count: c, p: c / v.length })),
    };
  }

  /* Standard normal distribution: the cumulative function by Abramowitz and
     Stegun 7.1.26 through the error function, and its inverse by Acklam's
     rational approximation. Both are accurate to about seven digits, far more
     than any project forecast deserves, and they let the risk block state the
     probability of a negative net present value when the simulation is
     summarised by a normal curve. */
  function erf(x) {
    const s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function normInv(p) {
    if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425, ph = 1 - pl;
    let q, r;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > ph) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  window.Stats = { sum, mean, variance, sd, cv, median, range, pearson, linreg, histogram, erf, normCdf, normInv };
})();
