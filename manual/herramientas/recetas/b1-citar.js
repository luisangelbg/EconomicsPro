/* Bloque 1: cómo citar el programa */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  goStep(1); await W(500);
  const t = document.getElementById("cite");
  const caja1 = document.querySelector("#panel-1 .cite-box");
  const sub = t.nextElementSibling;
  irA(t); await W(400);
  return caja([t, sub, caja1], 10);
})()
