/* Bloque 1: la galería de los 36 métodos con sus filtros */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  goStep(1); await W(500);
  const f = document.getElementById("methodFilter"), g = document.getElementById("methodGallery");
  irA(f); await W(400);
  const tarjetas = [...g.children].slice(0, 8);
  return caja([f].concat(tarjetas), 8);
})()
