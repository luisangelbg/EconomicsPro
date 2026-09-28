/* Bloque 6 con la base de práctica del café: los indicadores y el dictamen */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  await W(1000);
  Practice.load('cafe'); await W(1200);
  goStep(6); await W(1500);
  const c = document.getElementById('b6Tiles');
  window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 104, behavior: 'instant' });
  await W(500);
})()
