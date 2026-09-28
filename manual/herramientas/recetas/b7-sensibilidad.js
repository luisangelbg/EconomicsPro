/* Bloque 7 - la arana y el tornado */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-7 .card")[i];
  await W(900); Practice.load("fresa"); await W(1200); goStep(7); await W(2000);
  const c0 = tarjeta(0);
  const panes = c0.querySelectorAll(".pg-pane");
  irA(c0); await W(700);
  return caja([c0.querySelector("h2"), panes[0], panes[1]], 12);
})()
