/* portada: las tres bases de datos para practicar */
(async () => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  await W(1200);
  const c = document.getElementById('practice');
  window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - 104, behavior: 'instant' });
  await W(500);
})()
