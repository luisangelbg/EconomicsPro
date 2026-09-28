/* Bloque 10 - una hoja del informe que genera la app */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  await W(900); Practice.load("cafe"); await W(1500);
  for (let s = 2; s <= 8; s++) { goStep(s); await W(300); }
  goStep(9); await W(900); document.getElementById("b9Example").click(); await W(1200);
  goStep(10); await W(2600);
  const r = Report.build({ author: "", institution: "", figures: true, methods: true, record: true, references: true });
  document.open(); document.write(r.html); document.close();
  await W(1600);
  window.scrollTo({ top: 0, behavior: "instant" });
  const pag = document.querySelector(".page");
  const b = pag.getBoundingClientRect();
  window.__recorte = [Math.round(b.left) - 10, 0, Math.round(b.width) + 20, 1300].join(",");
  return window.__recorte;
})()
