/* Bloque 3: la tarjeta 4, controles y las primeras filas del programa */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-3 .card")[i];
  await W(900); Practice.load("cafe"); await W(1000); goStep(3); await W(1400);
  const c = tarjeta(3);
  irA(c); await W(600);
  const filas = document.querySelectorAll("#b3Programme tbody tr");
  return caja([c.querySelector("h2"), c.querySelector(".form-grid"), document.getElementById("b3Channels"), document.getElementById("b3Byproducts"), filas[0], filas[7]], 10);
})()
