/* Bloque 7 - la simulacion de Monte Carlo */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-7 .card")[i];
  await W(900); Practice.load("fresa"); await W(1200); goStep(7); await W(2000);
  document.getElementById("b7Simulate").click(); await W(5000);
  const c = tarjeta(3);
  irA(c); await W(700);
  return caja([c], 10);
})()
