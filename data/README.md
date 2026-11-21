# Scraping

## Sportbootführerschein (SBF See / Binnen)

The catalogs (Basisfragen, Spezifische Fragen See / Binnen / Segeln) are fetched directly from
https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Sportbootfuehrerscheine-node.html

```bash
npm run scrape
```

## Sportküstenschifferschein (SKS)

The SKS catalog (Navigation, Schifffahrtsrecht, Wetterkunde, Seemannschaft I + II) is fetched directly from
https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Fragenkatalog-SKS-node

```bash
npm run scrape:sks
```

SKS questions are open questions, so in the app the official answer is revealed and you rate yourself.

## Fachkundenachweis für Seenotsignalmittel (FKN)

The FKN catalog is parsed from the PDF "Anlage 2 zur Prüfungsordnung FKN" which DSV/DMYV link on
https://www.sportbootfuehrerscheine.org/fuehrerscheine-funk/fkn-fachkundenachweis/

```bash
npm run scrape:fkn
# or with a newer/local version of the PDF
node scrape-fkn.js ./path/to/catalog.pdf
```

Multiple choice questions are marked with "m" in the questionnaire overview of the PDF, the right answers are printed in bold
(some questions have more than one right answer). All other questions are open questions.

## Merge

Run `npm run merge` to combine all scraped catalogs (missing ones are skipped) into `popquiz/src/assets/questions.json`
and copy the images to `popquiz/src/assets/images`.

Node >= 18 is required (uses the built-in `fetch`).

## Explanations

`explanations/*.json` contains short AI-generated background explanations (not part of the official
catalogs) keyed by question id, e.g. `"sks_weather_7": "…"`. `npm run merge` adds them to the questions.
They are AI-generated and shown in the app below the answer buttons, marked as "KI-generiert".
