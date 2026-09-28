/* Bloque 10 - las opciones del informe */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-10 .card")[i];
  await W(900); Practice.load("cafe"); await W(1500);
  for (let s = 2; s <= 8; s++) { goStep(s); await W(300); }
  goStep(9); await W(900); document.getElementById("b9Example").click(); await W(1200);
  goStep(10); await W(2600);
  const c = tarjeta(1);
  irA(c); await W(700);
  return caja([c], 10);
})()
