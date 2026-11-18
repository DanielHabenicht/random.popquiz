Vertikale antworten
Zurückwischen (verhindern von gleichen Fragen)
Bei halten Frage länger anzeigen
Fragen die nur einmal beantwortet wurden erneut fragen
Directly on graph click

## Deployment

Every push to `master` scrapes the question catalogs, builds the app and deploys it to GitHub Pages
(`.github/workflows/deploy.yml`). It can also be started manually from the Actions tab.

Manual Firebase deployment (generate the questions first, see `data/README.md`):

```bash
cd popquiz
NODE_OPTIONS=--openssl-legacy-provider ng build --prod
firebase deploy
firebase open
```
