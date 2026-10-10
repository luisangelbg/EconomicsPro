# Changelog

## Unreleased

- **The brand link is named by the text it shows.** It was announced as "EconomicsPro home", a name that did not
  contain its visible text (WCAG 2.5.3, Label in Name). `I18N.apply` in `js/i18n.js` copied every tooltip
  (`data-es-title` / `data-en-title`) to `aria-label`; it still does, except where a link, button or tab already
  shows a readable text that the tooltip does not contain: there the control is named by that text and the tooltip
  stays as its description. Nothing looks or computes differently; the 583 tests still pass.

## 1.0.7 — 2026-09-28

- **Published, and the citation now carries its DOI.** The source is on GitHub, the app runs on GitHub Pages and
  every release is archived on Zenodo. The concept DOI —the one that represents all versions and always resolves to
  the latest— is `10.5281/zenodo.23005974`, and it is now written in the citation of the home page, in the citation
  at the end of every report, in `CITATION.cff`, in `codemeta.json`, in the README and in appendix F of the manual.
  It is read from a single `APP_DOI` constant in `core.js`, next to `APP_VERSION`, so it cannot drift either.


## 1.0.6 — 2026-09-24

- **The version of the app was written in four places and three of them had gone stale**: the citation in the
  report, the citation on the home page and the footer still said 1.0.0. There is now a single `APP_VERSION`
  constant in `core.js`; the report reads it and every place on the page that shows the version is filled from it,
  so it cannot drift again.
- **The authorship notice is now written where it belongs.** The app was already licensed under GPL v3, but the
  only copyright line in the repository was the Free Software Foundation's own, on the text of the licence. The
  README, `index.html` and `core.js` now carry the author's copyright notice, which is what the licence expects and
  what a registration record should be able to point at. The last institutional name left anywhere in the source —
  a made-up institution used as a value in one unit test — is now a neutral string.


## 1.0.5 — 2026-09-24

Block 10, read at print resolution while its chapter of the manual was written.

- **The report could come out with a hole in its numbering.** Each of its nine sections carried a fixed number,
  but every section writes itself only when its block has something to report: a study with a single alternative,
  for instance, has nothing to compare, so section 8 disappeared and the report jumped from 7 to 9. The sections
  now number themselves in the order in which they survive, so the numbering is always consecutive.
- **The final-review table** hugged its content instead of filling its box.


## 1.0.4 — 2026-09-24

Block 9, read at print resolution while its chapter of the manual was written.

- **Two tables had no header at all.** The capital-rationing table gave two amounts side by side and the
  buy-or-lease table gave another two, and in both cases nothing said which column was the money spent and which
  the value it brings, or which figure was a present value and which an annual cost. Both now carry a heading.
- **The label of the economic life ran off the right edge** of the chart whenever the minimum of the equivalent
  annual cost fell near the end of the range explored —which is where it usually falls. It now turns around and
  goes to the left of its point, with a halo.
- **Five more tables** —the alternatives, the rationing, the replacement, the rotation and the buy-or-lease—
  hugged their content instead of filling their box.


## 1.0.3 — 2026-09-23

Found the same way as the previous release: by reading the app at print resolution while the manual was written.

- **Every colour written on a chart label was being thrown away.** `.art-txt` and `.art-mut` set `fill` from a
  class, and a class rule always beats the `fill` attribute the drawing code writes on the element, so 26 labels
  across eight files —the rate actually used, the IRR, the break-even, the payback, P(NPV < 0), the name of each
  line of the spider chart, the private and the social rate— all came out in the default text colour. The two
  rules now apply only to a label that does not carry its own colour, in the app and in the stylesheet the figure
  studio bakes into an exported SVG.
- **Block 8, the value added.** The bars stacked every piece upwards from zero, so in the years of gestation the
  negative surplus was painted straight over the wages and the interest and the bar showed one colour instead of
  three. What adds now stacks upwards and what subtracts downwards.
- **Block 8, the value added again.** The table gave the share that goes to wages, to taxes and to the owner, and
  they added up to 92%: the share that goes to interest was drawn in the chart but never written. It is now a row
  of its own, the four lines add up to the value added, and the report says so too.
- **Block 8, the two profiles.** When the private and the social rate are a couple of points apart, one label was
  crossed by the other's line. They now go on opposite sides of their own line.
- **Two more tables** —the bridge and the social indicators— hugged their content instead of filling their box.


## 1.0.2 — 2026-09-23

Everything in this release was found by reading the app page by page while the user's manual was written: each
screen was captured at print resolution, and what could not be read on paper was fixed in the app.

- **A real bug in Block 4.** The figure that breaks the operating cost into groups was reading the last row of the
  table instead of a year at full production. In a perennial, whose last year can carry a partial harvest, that
  drew the wrong composition. It now picks the first year that is out of establishment, has cash cost and reaches
  full production.
- **Block 7, the two-variable grid.** The colour ramp went dark enough that the figures inside the deepest cells
  stopped being readable in print. The scale now runs from a light tint to a firm one —not to a solid block— so
  every number can be read, and the red-to-green reading is unchanged.
- **Block 7, the spider chart.** When two lines finished close together their names sat on top of each other. The
  labels are now pushed apart the minimum needed to be read, they are anchored to the right edge of the plot and
  they carry a halo. In the histogram, the P(NPV < 0) label no longer collides with the median's.
- **Tables that did not fill their box.** The switching values, the scenarios and the simulation summary of
  Block 7 hugged their content and left half of the frame empty, like the project sheet of Block 2 before them.
  They now use the full width.
- **Earlier blocks.** The slider column of Block 2 was too narrow for the track to be worth dragging; the labels of
  the rate chart overlapped and the rate actually used is now named only once, by its amber arrow; the trend tile
  of Block 3 wrapped; the group column of the cost sheet clipped what was typed in it; the price line of the cost
  figure of Block 4 overlapped the axis; and the marginal curve of Block 6 forced its axis to zero, which flattened
  the very curve it was drawing.


## 1.0.1 — 2026-09-23

- The app carries no third-party components any more. `vendor/` held a copy of the SheetJS library that no page ever
  loaded —the file input offered .xlsx and the import always answered that the library was missing— together with a
  notice file copied from another app, which listed datasets this one does not use. Both are gone: the importer now
  reads .csv, .txt and .tsv, and says plainly what to do with a workbook (save it as .csv, or copy the block and
  paste it, which the grid has always accepted). Every line of the app is original work, which is what the README now
  states.
- The practice databases said that not one of their figures came from an official series, and that was not true: the
  price index they deflate with is the real one, INEGI's consumer price index, the same series `exdata3.js` already
  credited. Rather than invent an index —deflating with a made-up one teaches a bad habit— the claim is now the
  accurate one, on the home page, in the header of `practice.js` and in the note each case carries: everything is
  fictional except the index, which is INEGI's and is used under its terms of free use, which ask for attribution.

## 1.0.0 — 2026-09-23

- Block 10, the figure studio, the report and the package. With it the ten blocks are complete.
- The figure studio takes any figure the study drew —there are 33 in the catalogue— and turns it into a file that
  stands on its own: its own title and footnote, light or dark colours, a solid, soft or transparent background,
  and SVG, PNG or JPG at 150, 300, 600 or 900 dpi. The colours of the stylesheet are resolved before the file
  leaves, so nothing depends on the app; the PNG carries its resolution in a pHYs chunk and the JPG in its JFIF
  header, which is what a journal reads when it asks for 300 dpi. Every figure of the study can also be
  downloaded at once as a .zip.
- The report is a single .html that opens in any browser and prints to PDF from there, with no Word and no
  internet: cover, summary with the written verdict and the indicators of both flows, and one section per block
  with its paragraphs, its tables and its figures. It ends with a methodology written out with its citations
  (Gittinger, Baca Urbina, Squire and van der Tak, Iman and Conover, the CIMMYT manual), a calculation record
  that shows each formula with the real numbers substituted —the discount rate, Fisher's real rate, the initial
  investment, the break-even point, the NPV term by term, the IRR, the equivalent annual value and the bridge to
  the economic NPV— and the references. The methodology, the record, the figures and the references can each be
  left out.
- The package is a .zip with the report, every figure as a PNG at 300 dpi, the tables of each block as .csv and
  the project's .json file, which is what lets anybody reopen the study and redo any calculation. A minimal ZIP
  writer of forty lines (`js/zip.js`) keeps the app free of dependencies; the archives it writes open with the
  unpacker of Windows itself.
- A final review says which blocks have data and how many errors or warnings are still pending, so that nothing
  is handed in with something unresolved.
- 583 unit tests, including a round trip of the ZIP (names, count and CRC read back from the central directory),
  the pHYs and JFIF chunks, the resolution of the colour variables and a whole report built over one of the
  practice studies.

## 0.9.0 — 2026-09-23

- Block 9, comparison and decisions. The project of the previous blocks comes in as one more alternative, with its
  real flow, next to the ones typed in with four figures (investment, net flow, horizon and salvage value, with an
  optional annual growth). For each one: NPV, IRR, profitability index, discounted payback and equivalent annual
  value, with the best of each marked.
- The incremental IRR and Fisher's intersection between two mutually exclusive alternatives, drawn on the two NPV
  profiles, with the sentence that says which one wins at the rate in use and at which rate the preference changes
  hands; a warning when the horizons differ, because there the equivalent annual value decides and not the NPV.
- Capital rationing: the usual ranking by profitability index against an exhaustive search of every package that
  fits the budget (up to 18 alternatives), which reports how much NPV the rule of thumb leaves on the table.
- Replacement and economic life: the equivalent annual cost of keeping a machine n years, split into its capital
  part and its running part, with the year that minimises it.
- Optimal rotation: the NPV of a single cycle against Faustmann's land expectation value, which shortens the
  rotation when the plantation is repeated, and says so.
- Buy or lease, after tax, compared as present value and as equivalent annual cost.
- Three complete databases to practise with (`js/practice.js`), with fictional but coherent data: nopal verdura in
  Milpa Alta (the clean case), café de altura in Chiapas (three years of gestation, an exported crop and negative
  cash) and fresa en macrotúnel in Zamora (profitable but short of money in its first year). They load the ten
  blocks at once from the home page or from the example list of Block 2, and can be downloaded as a .json project
  or as a .csv of their series.
- Fixed: opening a project from a file refreshed the forms but not the grids of Blocks 3, 4, 6 and 7. Every block
  now rebuilds itself on a single `projectloaded` event.
- 552 unit tests.

## 0.8.0 — 2026-09-23

- Block 8, economic and social appraisal: conversion factors by item (standard, product, labour, inputs, machinery,
  services, administration and a weighted one for the investment), transfers removed (taxes and any subsidy
  received), the value of the foreign exchange earned or spent, the economic flow year by year with its NPV, IRR
  and benefit–cost ratio at the social rate, and a bridge from the private result to the economic one whose pieces
  add up exactly.
- Social indicators: labour days and equivalent permanent jobs, investment per job, net foreign exchange, value
  added and how it is shared between wages, taxes, interest and the owner's surplus, and the cost per beneficiary.
- 487 unit tests, including two exact invariants: with every factor at 1 the economic flow is the private one plus
  the taxes, and the distribution of the value added always adds up to the value added.


## 0.7.0 — 2026-09-23

- Block 7, risk and uncertainty, on the flow of the project: one-way sensitivity with the spider diagram and the
  tornado, switching values ordered from the most fragile variable to the most robust and each with the question to
  ask about it, a two-variable table with the border where the project stops being worth doing, scenarios with
  their probabilities and the expected NPV, a Monte Carlo simulation with four distributions and the price–yield
  correlation imposed on the ranks, the correlation of each variable with the result to say where it pays to spend
  on information, and a decision tree for investing now or waiting a year, with the value of the option and of
  perfect information.
- A fast rebuild of the project flow (`js/risk.js`) makes 2000 simulation runs take about 80 ms; the tests check
  that it reproduces the flow of Block 5 exactly and that it agrees with the full chain when a variable moves.
- Fixed in Block 5: the amortisation of the loan opening fee, which is a cost of the financing, was entering the
  flow OF THE PROJECT and lowering its tax. The project flow is now independent of how the project is financed.
- 455 unit tests.


## 0.6.0 — 2026-09-23

- Block 6, financial appraisal: the two cash flows discounted each with its own rate (the cost of all the capital
  for the project, the cost of equity for the investor, both taken from Block 2 and overridable); NPV, IRR, modified
  IRR, gross and net benefit–cost ratio, profitability index, simple and discounted payback and equivalent annual
  value, side by side for both flows; the NPV taken apart into the present value of revenue, costs, taxes,
  investment and salvage, which add up to it exactly; the NPV profile with both rates and both internal rates, the
  waterfall and the recovery figure; a written verdict ready to copy into a thesis; and .csv export.
- Partial budgets and marginal analysis (Perrin, Winkelmann, Moscardi and Anderson, CIMMYT 1976): adjusted yields,
  field price, costs that vary, dominance analysis, marginal rate of return, the recommendation at a minimum rate,
  and the net benefit curve.
- 408 unit tests.


## 0.5.0 — 2026-09-23

- Block 5, financing and pro-forma statements: a long-term loan and a seasonal one, with grace periods that pay,
  capitalise or forgive the interest, and an opening fee capitalised with the pre-operating investment; the income
  statement with tax losses carried forward against later profits and the primary sector exemption applied; the two
  cash flows (of the project, with no debt, and of the investor, with the tax shield); a balance sheet built from
  the flows, whose accounting identity the app checks year by year; the break-even point of each year, treating as
  variable only what follows the volume sold; the debt service coverage and the financial ratios; four figures and
  .csv export.
- Block 4 now separates the cost of each year by basis, which is what the break-even needs.
- 365 unit tests.


## 0.4.0 — 2026-09-23

- Block 4, investment, costs and working capital: five grids (fixed investment, pre-operating investment, the budget
  while the project is not yet bearing, the budget once it produces, and the annual fixed costs); automatic
  replacement of the assets whose life ends inside the horizon, each purchase depreciated on its own by straight
  line, declining balance, sum of the years' digits or units; amortisation of the pre-operating investment; costs
  with a basis (per unit, per tonne produced or a lump sum a year) so a change of yield does not break the budget;
  working capital by cash cycle, months of cost or a percentage, invested the year before it is needed and
  recovered at the end; the calendar of investments and costs, the depreciation table with the salvage value, four
  figures and .csv export.
- The kind of an asset, the group of a cost and its basis are typed as words, in Spanish or in English: the app
  recognises "tractor", "maquinaria", "machinery", "por tonelada", "per tonne" and the rest.
- Six illustrative example budgets, one per kind of project.
- An example note no longer wipes the review messages of a block.
- 310 unit tests.


## 0.3.0 — 2026-09-23

- Block 3, market, prices and revenue: a spreadsheet-like grid where the historical series is typed, pasted from
  Excel or imported from CSV and Excel files; deflation to the base year (carrying the index forward with the
  declared inflation when the series ends earlier); description of the series with the t test of its trend;
  forecasts of price and yield by average, trend, compound growth, last value or a stated value, each with its
  uncertainty band; demand, supply, unsatisfied demand, market share and the price effect of an elasticity; and the
  year-by-year production and sales programme with losses, channels with a premium or a discount, by-products and
  other income, exportable as .csv.
- Six illustrative example series (avocado, maize, tomato, feedlot, cheese and irrigation) with the consumer price
  index, clearly labelled as illustrative and not official.
- 254 unit tests.


## 0.2.0 — 2026-09-23

- Block 2, the project and its assumptions: identification and kind of project (eight kinds, each with its own
  defaults), appraisal horizon with the timeline of what it covers, currency and constant or current prices, the
  discount rate built as a MARR, a weighted average cost of capital, the capital asset pricing model or typed in,
  with its nominal and real versions and the figure of where it comes from, the tax regime with the primary sector
  exemption of article 74, the coherence checks, the project sheet, and saving to the browser and to a .json file.
- The plotting kit moved to `js/plotkit.js`, shared by every block.
- 188 unit tests.

## 0.1.0 — 2026-09-22

- First stage: Block 1 (home page with the project laboratory and the risk laboratory, theory in plain language,
  the map of the ten blocks, 36 methods, the indicators side by side and the references), the complete financial
  engine (discounting, profitability indicators, rates, loan schedules, depreciation, break-even, sensitivity,
  switching values, Monte Carlo and comparison of projects), the statistical toolbox, the illustrations, the
  bilingual interface (Spanish and English) with light and dark themes, and 150 unit tests.
