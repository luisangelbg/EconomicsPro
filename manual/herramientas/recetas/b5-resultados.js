/* Bloque 5: el estado de resultados, encabezado y primeros años */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-5 .card")[i];
  await W(900); Practice.load("cafe"); await W(1000); goStep(5); await W(1800);
  const c = tarjeta(2);
  irA(c); await W(600);
  const filas = c.querySelectorAll("tbody tr");
  return caja([c.querySelector("h2"), c.querySelector("table thead"), filas[0], filas[7]], 10);
})()
