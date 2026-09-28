/* Bloque 1: el laboratorio de proyectos, con la huerta de aguacate */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const top = n => n.getBoundingClientRect().top + window.scrollY;
  const irA = n => window.scrollTo({ top: top(n) - 104, behavior: "instant" });
  const caja = (nodos, p) => { const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect()); const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p; window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(","); return window.__recorte; };
  goStep(1); await W(400);
  const sel = document.getElementById("epPreset");
  sel.value = "avocado"; sel.dispatchEvent(new Event("change"));
  document.getElementById("epReset").click(); await W(700);
  document.querySelector('[data-lab="labProject"]').click(); await W(600);
  const lab = document.getElementById("labProject");
  irA(lab); await W(400);
  return caja([lab], 10);
})()
