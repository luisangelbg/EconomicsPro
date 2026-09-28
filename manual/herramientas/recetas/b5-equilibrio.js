/* Bloque 5: la tarjeta 4: el punto de equilibrio */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  const tarjeta = i => document.querySelectorAll("#panel-5 .card")[i];
  await W(900); Practice.load("cafe"); await W(1000); goStep(5); await W(1800);
  const sel = document.getElementById("b5BeYear");
  const op = [...sel.options].find(o => /2032/.test(o.textContent));
  if (op) { sel.value = op.value; sel.dispatchEvent(new Event("change")); }
  await W(700);
  const c = tarjeta(3);
  irA(c); await W(600);
  return caja([c], 10);
})()
