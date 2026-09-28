# Manual de usuario de EconomicsPro

El manual se escribe por partes, en HTML, con el mismo estilo que los manuales de BreedingPro, PopGeneticsPro,
ClusteringPro, AgriDesign y PCAPro. Primero se hace en español; la versión en inglés se decide al final. Cuando
todas las partes estén listas se unen en un solo documento y se imprime a PDF **una sola vez**.

```
manual/
  manual.css           hoja común: tamaño carta y marco de la portada
  interior.css         páginas interiores: hojas blancas, vivos en verde agua y negro, un color por bloque
  paginar.js           reparte el contenido en hojas tamaño carta (encabezados, números de página, índice)
  img/                 capturas de pantalla de la app
  herramientas/
    captura.ps1        abre la app, ejecuta una receta y guarda la captura en img/ al doble de resolución
    recetas/           una receta por captura (JS): inicio, ejemplos, bloque, figura, b1-…
    evaluar.ps1        abre una página sin ventana, ejecuta un guion y escribe el resultado (recortes, marcas, valores)
    huecos.js          guion para evaluar.ps1: el hueco al pie de cada hoja de una parte del manual
    unir-manual.ps1    une la portada y las partes en es/manual-completo.html para imprimir el manual completo
                       (no hay Perl en esta máquina, así que se usa la versión en PowerShell)
  es/
    00a-portada.html   portada blanca: título en español e inglés; al centro, el flujo de efectivo de un proyecto
                       agrícola año por año —la inversión hacia abajo, las cosechas hacia arriba tras la gestación,
                       el valor de rescate en ámbar sobre la última y, dentro de cada barra, el contorno de lo que
                       vale traída a hoy bajo la curva de descuento—; a los lados, aguacate, maíz, nopal verdura,
                       café de altura, jitomate de invernadero y fresa de macrotúnel, cada uno con su nombre
                       científico; abajo, cuatro viñetas: perfil del VAN con la TIR, punto de equilibrio,
                       simulación de Monte Carlo y puente del VAN privado al económico (todo dibujado con gráficos
                       vectoriales originales, con semilla fija)
```

## Plan de partes

| Parte | Archivo | Contenido |
|---|---|---|
| 1 | `00a-portada.html` | portada (**lista**) |
| 2 | `00b-introduccion.html` | créditos, índice general, cómo leer el manual e introducción I.1–I.9 (**lista**) |
| 3 | `01-bloque1.html` | Bloque 1 · Inicio: el motor financiero, los dos laboratorios con trece prácticas, los 36 métodos, la teoría y las 25 referencias (**listo**) |
| 4 | `02-bloque2.html` | Bloque 2 · El proyecto y sus supuestos: tipo, horizonte, moneda y base de precios, los cuatro modos de la tasa, régimen fiscal y la ficha (**listo**) |
| 5 | `03-bloque3.html` | Bloque 3 · Mercado, precios e ingresos: la serie y su deflación, la prueba de la tendencia, los cinco métodos de proyección, el mercado y el programa de ventas (**listo**) |
| 6 | `04-bloque4.html` | Bloque 4 · Inversión, costos y capital de trabajo: los 8 tipos de activo, la reposición automática, las tres bases de costo, el ciclo de caja y la depreciación por compra (**listo**) |
| 7 | `05-bloque5.html` | Bloque 5 · Financiamiento y estados proforma: los dos créditos, el estado de resultados con la exención del art. 74, los dos flujos, el balance que se comprueba solo, el punto de equilibrio por año y la cobertura de la deuda (**listo**) |
| 8 | `06-bloque6.html` | Bloque 6 · Evaluación financiera: el dictamen redactado, los diez indicadores de los dos flujos, la descomposición exacta del VAN, las tres figuras y el análisis marginal del CIMMYT (**listo**) |
| 9 | `07-bloque7.html` | Bloque 7 · Riesgo e incertidumbre: la araña y el tornado, los valores límite de Gittinger, la rejilla de dos variables, los escenarios con su probabilidad, la simulación de Monte Carlo con correlación precio–rendimiento y el árbol de invertir ahora o esperar (**listo**) |
| 10 | `08-bloque8.html` | Bloque 8 · Evaluación económica y social: los nueve factores de conversión, los datos de los indicadores sociales, el puente exacto del VAN privado al económico, los dos perfiles, el flujo económico año por año y el empleo, las divisas y el reparto del valor agregado (**listo**) |
| 11 | `09-bloque9.html` | Bloque 9 · Comparación y decisiones: el proyecto contra otras alternativas, el valor anual equivalente cuando los horizontes difieren, la TIR incremental y el cruce de Fisher, el racionamiento de capital contra la búsqueda exhaustiva, la vida económica de un equipo, el turno de Faustmann y comprar contra rentar (**listo**) |
| 12 | `10-bloque10.html` | Bloque 10 · Figuras, informe y paquete: el estudio de figuras con sus colores horneados, la resolución y el tamaño impreso, el informe de un solo archivo y sus trece secciones, el paquete .zip con el proyecto.json que lo hace reproducible y la revisión final (**listo**) |
| 13 | `11-apendices.html` | apéndices A–F: los archivos que la app lee y escribe, las reglas de decisión de los diez bloques reunidas, el glosario (28 términos), qué hacer cuando algo no sale, las 25 referencias por familia y la licencia con la cita (**listo**) |

## Colores por bloque

Los de la franja de la portada, en el mismo orden; son los de la app.

| Bloque | Color | Variable |
|---|---|---|
| Preliminares e introducción | verde muy oscuro `#0e3b31` | `--b0` |
| 1 Inicio | verde agua profundo `#145e4e` | `--b1` |
| 2 Proyecto | ámbar de cosecha `#b06e0c` | `--b2` |
| 3 Mercado | azul cielo `#2d78b0` | `--b3` |
| 4 Inversión y costos | naranja de tierra `#d0682a` | `--b4` |
| 5 Financiamiento | verde hoja `#5a8f2b` | `--b5` |
| 6 Evaluación financiera | verde azulado `#1d7a6f` | `--b6` |
| 7 Riesgo | carmín `#c0406a` | `--b7` |
| 8 Evaluación social | violeta `#7b5ea7` | `--b8` |
| 9 Decisiones | café `#8a6a4a` | `--b9` |
| 10 Informe | grafito `#4b5a72` | `--b10` |
| Apéndices | negro `#111111` | `--bx` |

## Convenciones (las mismas de los otros manuales)

- **El paginador parte listas de definición:** `paginar.js` reparte `DL` entre hojas como ya hacía con `UL`, `OL` y `TABLE`, y nunca deja un término al pie de una hoja con su definición al principio de la siguiente. Se añadió al escribir el glosario de los apéndices.
- **Un capítulo es una sección:** `<section class="capitulo" id="cap-bN" data-pestana="BN" data-orden="N" style="--acento: var(--bN)">`.
  Con 12 pestañas, `paginar.js` las separa 0.68 in y cada una mide 0.56 in de alto.
- **Numeración:** el capítulo N es el Bloque N: secciones, figuras y tablas N.x, anclas `sN-x` y archivo
  `NN-bloqueN.html`. La introducción no lleva número de capítulo: pestaña «In», secciones, figuras y tablas I.x y
  anclas `si-x`. La portada y la introducción son `00a-` y `00b-`; los apéndices, `11-apendices.html`.
- **Recuadros:** `caja nota`, `caja importante`, `caja teoria`, `caja ejemplo`, `caja regla` y `caja dato`; pasos en
  `ol.pasos`; texto de la app en `span.ui` y `span.ruta`.
- **Citas:** «y colaboradores» (no «et al.») y «y» entre dos autores. No se nombran programas comerciales ni de
  terceros en el texto.
- **Números:** `95&nbsp;%` con espacio fijo; los miles también con espacio fijo (`1&nbsp;512&nbsp;493`), para que el
  número no se parta entre renglones. Todo valor que se cite como resultado de la app se comprueba en la app antes
  de escribirlo.
- **Dinero:** con el signo y sin decimales cuando es un total (`$1,512,493`) y con dos cuando es un precio unitario
  (`$102,177.71`), igual que la app.
- **Datos de los ejemplos:** las tres bases de práctica (nopal, café, fresa) son **ficticias** y así se dice cada vez
  que se usan; las series y los presupuestos de ejemplo son **ilustrativos**, no cifras oficiales.

## Capturas de pantalla

Desde la carpeta de la app, con una receta de `herramientas/recetas/`:

```
powershell -ExecutionPolicy Bypass -File manual\herramientas\captura.ps1 -Receta inicio -Recorte "0,0,1400,790"
powershell -ExecutionPolicy Bypass -File manual\herramientas\captura.ps1 -Receta figura -Tema dark -Idioma en -Salida figura-oscuro-en
```

La captura sale en `img/<receta>.png` (o `-Salida`) al doble de resolución. `-Recorte "x,y,ancho,alto"` se da en
píxeles de pantalla. El encabezado de la app mide unos 88 píxeles: las recetas desplazan la vista 104 píxeles por
encima del elemento para que no lo tape.

## Ver e imprimir una parte

Abre el HTML con doble clic. El PDF del manual se imprime una sola vez, al final, con todas las partes unidas. Para
revisar una parte, desde la carpeta de la app y con salida fuera del manual:

```
powershell -ExecutionPolicy Bypass -File tools\local\shot.ps1 -Out $env:TEMP\parte.pdf -Page manual/es/01-bloque1.html -Pdf -Wait 6000
```

Desde el cuadro de impresión del navegador: destino **Guardar como PDF**, márgenes **Ninguno** y **Gráficos de
fondo** activado.

## Cómo obtener el PDF

Desde la carpeta `manual/`:

```
powershell -ExecutionPolicy Bypass -File herramientas\unir-manual.ps1 es
msedge --headless=new --no-pdf-header-footer --virtual-time-budget=300000 --user-data-dir=%TEMP%\economicspro-shot --print-to-pdf=C:\ruta\sin\espacios\manual-es.pdf "file:///C:/Users/luisa/Documents/LABG%20Apps/EconomicsPro/manual/es/manual-completo.html"
```

- `unir-manual.ps1` escribe `es/manual-completo.html` con la portada y las partes de `00b-introduccion.html` a
  `11-apendices.html`, con un solo `paginar.js`, para que la numeración sea continua y el índice general encuentre
  las páginas de todos los capítulos. Ese archivo no se edita: se corrigen las partes y se vuelve a generar.
- **Cuidado con las reglas de una sola parte:** al unir, valen para todo el manual; si una parte necesita una regla
  propia, se acota con `.hoja[data-pestana="N"]`.
- Se imprime de una sola vez: unir PDF sueltos pierde los enlaces del índice y reinicia la numeración. Edge no
  escribe el PDF si la ruta de `--print-to-pdf` tiene espacios: se imprime en una carpeta sin espacios y se copia.

## Componentes de terceros

La app no lleva ninguno. El manual sí usa tres tipografías, que se cargan del servicio público de fuentes web:

- **Cormorant**, de Christian Thalmann. Licencia SIL Open Font License 1.1.
- **Crimson Pro**, de Jacques Le Bailly. Licencia SIL Open Font License 1.1.
- **Jost**, de Owen Earl. Licencia SIL Open Font License 1.1.

Todo lo demás es original: ilustraciones, diagramas, capturas y el paginador. No se usan imágenes de terceros.

## Capturas hechas hasta ahora

Se miden con `evaluar.ps1` (la receta devuelve el recorte en `window.__recorte`) y se toman con `captura.ps1`
usando la misma ventana. Las dos de los laboratorios necesitan una ventana de 1500 × 1100.

| Archivo | Receta | Ventana | Recorte | Dónde se usa |
|---|---|---|---|---|
| `img/inicio.png` | `inicio` | 1400 × 900 | `0,0,1400,800` | Figura I.3 |
| `img/bloque.png` | `bloque` | 1400 × 1000 | `125,95,1185,265` | Figura I.4 |
| `img/practica.png` | `practica` | 1400 × 1000 | `120,107,1191,690` | Figura I.5 |
| `img/b1-lab-proyecto.png` | `b1-lab-proyecto` | 1500 × 1100 | `181,94,1138,799` | Figura 1.1 |
| `img/b1-lab-riesgo.png` | `b1-lab-riesgo` | 1500 × 1100 | `181,94,1138,891` | Figura 1.2 |
| `img/b1-metodos.png` | `b1-metodos` | 1400 × 1000 | `112,96,1176,555` | Figura 1.3 |
| `img/b1-comparar.png` | `b1-comparar` | 1400 × 1000 | `112,96,1176,364` | Figura 1.4 |
| `img/b1-teoria.png` | `b1-teoria` | 1400 × 1000 | `115,96,1173,293` | Figura 1.5 |
| `img/b1-citar.png` | `b1-citar` | 1400 × 1000 | `110,94,1180,263` | Figura 1.6 |
| `img/b2-identificacion.png` | `b2-identificacion` | 1500 × 1100 | `160,94,1180,761` | Figura 2.1 |
| `img/b2-horizonte.png` | `b2-horizonte` | 1500 × 1100 | `160,94,1180,709` | Figura 2.2 |
| `img/b2-precios.png` | `b2-precios` | 1500 × 1100 | `160,94,1180,344` | Figura 2.3 |
| `img/b2-tasa.png` | `b2-tasa` | 1500 × 1100 | `160,94,1180,869` | Figura 2.4 |
| `img/b2-fiscal.png` | `b2-fiscal` | 1500 × 1100 | `160,94,1180,345` | Figura 2.5 |
| `img/b2-ficha.png` | `b2-ficha` | 1500 × 1100 | `160,109,1180,831` | Figura 2.6 |

| `img/b3-serie.png` | `b3-serie` | 1500 × 1200 | `160,94,1180,763` | Figura 3.1 |
| `img/b3-proyeccion.png` | `b3-proyeccion` | 1500 × 1200 | `160,94,1180,626` | Figura 3.2 |
| `img/b3-mercado.png` | `b3-mercado` | 1500 × 1200 | `160,94,1180,892` | Figura 3.3 |
| `img/b3-programa.png` | `b3-programa` | 1500 × 1200 | `187,119,1126,841` | Figura 3.4 |
| `img/b3-prog-fig.png` | `b3-prog-fig` | 1500 × 1200 | `189,234,1122,517` | Figura 3.5 |

| `img/b4-inversion.png` | `b4-inversion` | 1500 × 1300 | `160,94,1180,526` | Figura 4.1 |
| `img/b4-diferida.png` | `b4-diferida` | 1500 × 1300 | `160,94,1180,342` | Figura 4.2 |
| `img/b4-costos.png` | `b4-costos` | 1500 × 1500 | `160,94,1180,1333` | Figura 4.3 |
| `img/b4-capital.png` | `b4-capital` | 1500 × 1300 | `160,94,1180,420` | Figura 4.4 |
| `img/b4-resulta.png` | `b4-resulta` | 1500 × 1300 | `187,119,1126,957` | Figura 4.5 |
| `img/b4-depreciacion.png` | `b4-depreciacion` | 1500 × 1300 | `187,221,1126,373` | Figura 4.6 |

| `img/b5-credito.png` | `b5-credito` | 1500 × 1300 | `160,94,1180,546` | Figura 5.1 |
| `img/b5-resulta.png` | `b5-resulta` | 1500 × 1300 | `160,94,1180,620` | Figura 5.2 |
| `img/b5-resultados.png` | `b5-resultados` | 1500 × 1300 | `187,119,1126,377` | Figura 5.3 |
| `img/b5-equilibrio.png` | `b5-equilibrio` | 1500 × 1300 | `160,94,1180,769` | Figura 5.4 |
| `img/b5-razones.png` | `b5-razones` | 1500 × 1300 | `160,94,1180,700` | Figura 5.5 |

| `img/b6-dictamen.png` | `b6-dictamen` | 1500 × 1300 | `160,94,1180,565` | Figura 6.1 |
| `img/b6-indicadores.png` | `b6-indicadores` | 1500 × 1300 | `160,94,1180,1279` | Figura 6.2 |
| `img/b6-marginal.png` | `b6-marginal` | 1500 × 1400 | `160,94,1180,1309` | Figura 6.3 |
|  |  |  |  |  |
| `img/b7-sensibilidad.png` | `b7-sensibilidad` | 1500 × 3000 | `185,117,1130,1055` | Figura 7.1 |
| `img/b7-limite.png` | `b7-limite` | 1500 × 3000 | `185,92,1130,289` | Figura 7.2 |
| `img/b7-dos.png` | `b7-dos` | 1500 × 3000 | `160,94,1180,773` | Figura 7.3 |
| `img/b7-escenarios.png` | `b7-escenarios` | 1500 × 3000 | `160,656,1180,495` | Figura 7.4 |
| `img/b7-montecarlo.png` | `b7-montecarlo` | 1500 × 3000 | `160,968,1180,792` | Figura 7.5 |
| `img/b7-arbol.png` | `b7-arbol` | 1500 × 3000 | `160,1809,1180,747` | Figura 7.6 |
|  |  |  |  |  |
| `img/b8-dictamen.png` | `b8-dictamen` | 1500 × 3000 | `158,92,1184,187` | Figura 8.1 |
| `img/b8-factores.png` | `b8-factores` | 1500 × 3000 | `160,94,1180,561` | Figura 8.2 |
| `img/b8-datos.png` | `b8-datos` | 1500 × 3000 | `160,94,1180,336` | Figura 8.3 |
| `img/b8-puente.png` | `b8-puente` | 1500 × 3000 | `185,117,1130,896` | Figura 8.4 |
| `img/b8-perfiles.png` | `b8-perfiles` | 1500 × 3000 | `185,474,1130,525` | Figura 8.5 |
| `img/b8-indicadores.png` | `b8-indicadores` | 1500 × 3000 | `160,1816,1180,763` | Figura 8.6 |
|  |  |  |  |  |
| `img/b9-alternativas.png` | `b9-alternativas` | 1500 × 3200 | `160,94,1180,591` | Figura 9.1 |
| `img/b9-incremental.png` | `b9-incremental` | 1500 × 3200 | `160,94,1180,840` | Figura 9.2 |
| `img/b9-racionamiento.png` | `b9-racionamiento` | 1500 × 3200 | `160,94,1180,587` | Figura 9.3 |
| `img/b9-reemplazo.png` | `b9-reemplazo` | 1500 × 3200 | `185,117,1130,802` | Figura 9.4 |
| `img/b9-rotacion.png` | `b9-rotacion` | 1500 × 3200 | `185,854,1130,961` | Figura 9.5 |
| `img/b9-rentar.png` | `b9-rentar` | 1500 × 3200 | `160,1997,1180,464` | Figura 9.6 |
|  |  |  |  |  |
| `img/b10-estudio.png` | `b10-estudio` | 1500 × 3200 | `160,251,1180,824` | Figura 10.1 |
| `img/b10-informe.png` | `b10-informe` | 1500 × 3200 | `160,1073,1180,324` | Figura 10.2 |
| `img/b10-hoja.png` | `b10-hoja` | 1500 × 3200 | `300,0,900,760` | Figura 10.3 (el informe generado, no la app) |
| `img/b10-paquete.png` | `b10-paquete` | 1500 × 3200 | `160,1395,1180,705` | Figura 10.4 |

**Cuidado al capturar:** `captura.ps1` y `shot.ps1` comparten el puerto de depuración. Si quedó viva una instancia
del navegador de una impresión anterior, la captura se toma de *esa* página y sale una imagen equivocada sin avisar.
Antes de una tanda de capturas conviene cerrar las instancias sin ventana:

```
Get-Process msedge | Where-Object { $_.MainWindowTitle -eq '' } | Stop-Process -Force
```
