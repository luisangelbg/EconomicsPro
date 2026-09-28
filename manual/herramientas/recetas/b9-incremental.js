/* Bloque 9 - la TIR incremental y el cruce de Fisher */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-9 .card")[i];
  await W(900); Practice.load("nopal"); await W(1400); goStep(9); await W(1800);
  document.getElementById("b9Example").click(); await W(1800);
  const c = tarjeta(1);
  irA(c); await W(700);
  return caja([c], 10);
})()
