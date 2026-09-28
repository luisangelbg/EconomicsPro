# EconomicsPro

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23005974.svg)](https://doi.org/10.5281/zenodo.23005974)

**Economic and financial appraisal of agrifood projects — without writing code.** The ten blocks are complete: the home
page with the financial engine and its two laboratories, the project and its assumptions, market and revenue,
investment, costs and working capital, financing with the pro-forma statements, the financial appraisal, risk, the
economic and social appraisal, the comparison of alternatives with the decisions that follow it, and the figure
studio with the report and the package that carries the whole study.

A web platform (HTML + JavaScript, no installation; it also runs offline from a local copy) for the study that a
thesis of agricultural economics, a business plan or a public investment file has to hand in: the market and the
revenue programme, the investment and cost budgets, the loan schedule and the pro-forma statements, the break-even
point, the profitability indicators (NPV, IRR, benefit–cost ratio, payback, equivalent annual value), the analysis
of risk (sensitivity, switching values, scenarios and Monte Carlo simulation), the economic and social appraisal
with accounting prices, and the comparison of alternatives.

It was written for agricultural, livestock and agro-industrial projects, not for generic corporate finance: it knows
that a plantation takes years to bear, that working capital follows the cycle of the crop and not the calendar year,
that price and yield move against each other, that the last year of the horizon carries a real residual value, and
that two alternatives of different length can only be compared by their equivalent annual value.

The interface, the figures and the report are available in Spanish and English, with a light or dark theme.

## How to open it

1. Double-click **`index.html`**. It opens in the default browser, on the home page of Block 1. Everything is
   computed in the browser, so it works from the local copy, without a server and without an internet connection.
2. If your institution blocks pages opened as local files, double-click **`Open EconomicsPro.bat`** (or run
   `server.ps1` with PowerShell): it starts a small server on your own computer and opens `http://localhost:9700`.
   Run it as administrator to reach it from a tablet on the same Wi-Fi network; it prints the address.
3. The tests open the same way: double-click **`tests/index.html`**; all of them should come out green.

## The ten blocks

| Block | Content | Status |
|---|---|---|
| 1 | Home: project laboratory (six real agrifood projects built year by year and appraised with the actual formulas) and risk laboratory (Monte Carlo with correlation, tornado and switching values), theory in plain language, the indicators side by side, 36 methods, 25 references, how to cite | ✅ done |
| 2 | The project and its assumptions: productive unit and kind of project, horizon with its timeline, currency and constant or current prices, the discount rate as MARR, WACC, CAPM or typed in (nominal and real), tax regime with the primary sector exemption, coherence checks and the project sheet, saved in the browser and as a .json file | ✅ done |
| 3 | Market, prices and revenue: a grid that takes pasted or imported series, deflation to the base year, description with the test of the trend, five forecasting methods with their uncertainty band, demand, supply and market share with the price effect of an elasticity, and the year-by-year sales programme with losses, channels, by-products and .csv export | ✅ done |
| 4 | Investment, costs and working capital: five budget grids, automatic replacement of short-lived assets, depreciation of each purchase, amortisation of the pre-operating investment, costs with a basis (per unit, per tonne, lump sum), working capital by cash cycle, calendar, salvage value and .csv export | ✅ done |
| 5 | Financing and pro-forma statements: a long-term and a seasonal loan with grace periods, income statement with tax losses carried forward, the two cash flows (project and investor), a balance sheet whose identity is checked year by year, break-even, debt service coverage and ratios | ✅ done |
| 6 | Financial appraisal: the two flows discounted each with its own rate, NPV, IRR and MIRR, benefit–cost ratios, profitability index, payback, equivalent annual value, the NPV taken apart into its pieces, a written verdict, and the partial budgets and marginal analysis of CIMMYT with dominance and the marginal rate of return | ✅ done |
| 7 | Risk and uncertainty: spider and tornado, switching values with the question to ask about each one, a two-variable table, scenarios with their expected value, Monte Carlo with four distributions and the price–yield correlation, what explains the spread, and a decision tree for waiting a year | ✅ done |
| 8 | Economic and social appraisal: conversion factors by item, transfers removed, the value of the foreign exchange, the economic flow with its NPV and IRR at the social rate, a bridge from the private result to the economic one that adds up exactly, and the social indicators (jobs, investment per job, foreign exchange, value added and how it is shared) | ✅ done |
| 9 | Comparison and decisions: the project of the study against other alternatives, incremental IRR and Fisher’s intersection, the equivalent annual value when the horizons differ, capital rationing with the best package a limited budget can buy, when to replace a machine (economic life), when to cut a plantation (Faustmann) and whether to buy or to rent | ✅ done |
| 10 | Figures and report: the figure studio, where every figure of the study leaves with its own title and footnote, light or dark, as PNG, JPG or SVG at up to 900 dpi with the resolution written into the file; a report that opens in any browser and prints to PDF, with the summary, the tables, the figures, the methodology, the calculation record and the references; and a .zip with the report, the figures, the tables as .csv and the project file that reproduces the study | ✅ done |

## Three databases to practise with

The home page (and the example list of Block 2) carries three complete studies with **fictional but coherent data**,
so that somebody who is learning can walk the ten blocks without having to invent numbers first. Each one is a
different kind of exercise:

| Database | What it is | What it makes you practise |
|---|---|---|
| **Nopal verdura** | 12 ha in Milpa Alta, harvested from the first year | the clean case: read the indicators and the break-even without the noise of a gestation period |
| **Café de altura** | 20 ha in Chiapas, renewed with a wet mill, 70 % exported | three years without a harvest, the grace period of the loan, the cash that goes negative, and the foreign exchange of Block 8 |
| **Fresa en macrotúnel** | 6 ha in Zamora, the heaviest loan of the three | a profitable project that runs out of money in its first year: the difference between being profitable and being liquid |

Every one loads the ten blocks at once ("load into the app"), and can also be downloaded as a `.json` project or as
a `.csv` of its ten-year series. They are teaching material: the figures are plausible for the region, but they are
invented, and they should not be cited as a source.

## What is already computing

The financial engine (`js/finance.js`) is complete and checked, with the rest of the app, by 583 unit tests against the worked examples and the
interest tables of the standard textbooks:

- discounting: present and future value, annuities, arithmetic and geometric gradients, perpetuities;
- indicators: NPV, all the internal rates of return of a series (it finds the two roots of a project that invests
  twice, instead of hiding one), modified IRR, benefit–cost ratios, profitability index, simple and discounted
  payback, equivalent annual value and equivalent annual cost;
- rates: effective, nominal and continuous, Fisher's real rate, MARR, WACC and CAPM;
- loans: level instalments, constant principal and single repayment, with grace periods that pay, capitalise or
  forgive the interest;
- depreciation: straight line, declining balance, sum of the years' digits and units of production;
- break-even: single product and product mix, break-even price and yield, operating and financial leverage;
- risk: switching values, one- and two-way sensitivity, tornado, and Monte Carlo simulation with six distributions
  and rank correlation between variables (Iman–Conover);
- decisions: incremental IRR, Fisher's intersection, capital rationing with an exhaustive search of the packages
  that fit the budget, the economic life of a machine, Faustmann's land expectation value and buy or lease;
- prices: deflating a series, inflating a value and the compound annual growth rate.


## What leaves the app

The study is not finished until somebody else can read it, so Block 10 turns it into files:

- **each figure** with its own title and footnote, in light or dark colours, as SVG (vector), PNG or JPG at up to
  900 dpi, with the resolution written inside the file, which is what a journal checks;
- **the report**, one `.html` that opens in any browser and prints to PDF from there, with the summary and the
  verdict, the tables of every block, the figures inside it, the methodology written out with its citations, a
  calculation record that shows each formula with the real numbers substituted, and the references;
- **the package**, a `.zip` with the report, every figure at 300 dpi, the tables as `.csv` and the project's
  `.json` file — the one that lets anybody reopen the study in the app and redo any calculation, which is what
  turns an appendix into something reproducible.

Nothing is uploaded: the files are built inside the browser and saved straight to the computer.

## Structure

```
index.html            the whole interface (one page, ten blocks)
css/style.css         the single stylesheet, light and dark themes
js/i18n.js            language (Spanish/English) and theme
js/core.js            global state, money and rate formatting, navigation
js/finance.js         the financial engine
js/stats.js           the statistical toolbox
js/art.js             the SVG illustrations
js/plotkit.js         the plotting kit shared by every block
js/project.js         the model of Block 2: assumptions, rates, checks, saving
js/plots2.js          the figures of Block 2
js/block2.js          the screen of Block 2
js/import.js          pasting, importing files and the editable grid
js/market.js          the model of Block 3: series, forecasts, market, sales programme
js/exdata3.js         the illustrative example series
js/plots3.js          the figures of Block 3
js/block3.js          the screen of Block 3
js/budget.js          the model of Block 4: investment, depreciation, costs, working capital
js/exdata4.js         the illustrative example budgets
js/plots4.js          the figures of Block 4
js/block4.js          the screen of Block 4
js/finstate.js        the model of Block 5: loans, statements, flows, balance sheet
js/plots5.js          the figures of Block 5
js/block5.js          the screen of Block 5
js/appraisal.js       the model of Block 6: indicators, verdict, marginal analysis
js/plots6.js          the figures of Block 6
js/block6.js          the screen of Block 6
js/risk.js            the model of Block 7: fast rebuild, sensitivity, scenarios, simulation
js/plots7.js          the figures of Block 7
js/block7.js          the screen of Block 7
js/social.js          the model of Block 8: conversion factors, economic flow, social indicators
js/plots8.js          the figures of Block 8
js/block8.js          the screen of Block 8
js/decide.js          the model of Block 9: alternatives, rationing, replacement, rotation, lease
js/plots9.js          the figures of Block 9
js/block9.js          the screen of Block 9
js/zip.js             a minimal ZIP writer, so the study leaves as one file
js/figure.js          the figure studio: palettes, composing, baking the colours, PNG/JPG/SVG
js/report.js          the report: sections, methodology, calculation record, tables for the package
js/block10.js         the screen of Block 10
js/practice.js        the three complete databases to practise with (fictional data)
js/playground.js      the two laboratories of the home page
js/home.js            the content of the home page
tests/index.html      the unit tests
server.ps1            a small local server (only needed if file:// is blocked)
```

## Licence and third-party components

Copyright © 2026 Luis Ángel Barrera-Guzmán. EconomicsPro is free software: it can be used, studied, changed and
redistributed under the terms of the **GNU General Public License, version 3**, whose full text is in
[LICENSE](LICENSE). Any redistributed modified version has to keep the same licence and credit the author.

The app carries **no third-party components**: no libraries, no frameworks, no web fonts, no icon sets, no images
and no external services. Every line of JavaScript, every rule of the stylesheet and every figure is original work;
the pages load nothing from the network, which is why the app runs offline from a local copy.

The example series and budgets are illustrative and the three practice databases are fictional, as the app states on
the screen and in its own source. The only real figures anywhere in it are the consumer price index published by
INEGI and the daily value of the UMA published in the official gazette, both of them official data used as such.
Formulas and methods carry the citation of whoever published them, in the references and in the methodology section
of the report.

## The user's manual

`manual/` carries the manual in Spanish: a cover, an introduction, one chapter per block and the appendices, each
one an HTML file that opens with a double click. `manual/LEEME.md` explains how the parts are written, captured and
joined into a single PDF.

## How to cite it

> Barrera-Guzmán, L.Á. (2026). *EconomicsPro: a browser-based platform for the economic and financial appraisal of
> agrifood projects* (Version 1.0) [Computer software]. https://doi.org/10.5281/zenodo.23005974

The app carries the same citation on its home page, with a button that copies it, and writes it at the end of every
report it generates.

## Published

- Source code: <https://github.com/luisangelbg/EconomicsPro>
- Running app: <https://luisangelbg.github.io/EconomicsPro/>
- Archived versions with a DOI on Zenodo: concept DOI <https://doi.org/10.5281/zenodo.23005974> (always the latest
  version); each release has its own version DOI (v1.0.6: 10.5281/zenodo.23005975; v1.0.7: 10.5281/zenodo.23006090).
