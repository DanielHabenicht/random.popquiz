// Scrapes the official SKS (Sportküstenschifferschein) question catalog from ELWIS.
// The SKS questions are open questions (no multiple choice), so every question gets exactly
// one "answer" which is the official answer text from the catalog.
//
// Usage: node scrape-sks.js
// Output: ./dist/sks.json and images in ./dist/images/
const { loadContent, htmlToText, extractPictures, downloadImages, writeCatalog } = require('./elwis');

const baseUrl = 'https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS';
const catalogs = [
  { name: 'navigation', title: 'Navigation', url: `${baseUrl}/Navigation/Navigation-node` },
  { name: 'law', title: 'Schifffahrtsrecht', url: `${baseUrl}/Schifffahrtsrecht/Schifffahrtsrecht-node` },
  { name: 'weather', title: 'Wetterkunde', url: `${baseUrl}/Wetterkunde/Wetterkunde-node` },
  { name: 'seamanship1', title: 'Seemannschaft I', url: `${baseUrl}/Seemannschaft-I/Seemannschaft-I-node` },
  { name: 'seamanship2', title: 'Seemannschaft II', url: `${baseUrl}/Seemannschaft-II/Seemannschaft-II-node` },
];

async function scrapeCatalog(catalog) {
  const content = await loadContent(catalog.url);

  // Every question starts with a "<p>Nummer X:</p>" paragraph.
  const chunks = content.split(/<p>Nummer (\d+):<\/p>/);
  const results = [];
  const downloads = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const catalogId = chunks[i];
    const qId = `sks_${catalog.name}_${catalogId}`;
    const raw = chunks[i + 1].split('<p class="line">')[0];

    const questionEnd = raw.indexOf('</strong></p>');
    const { html, pictures } = extractPictures(raw, qId, catalog.url, downloads);
    const inQuestion = (p) => questionEnd < 0 || p.offset < questionEnd;
    const questionPictures = pictures.filter(inQuestion).map(({ title, url }) => ({ title, url }));
    const answerPictures = pictures.filter((p) => !inQuestion(p)).map(({ title, url }) => ({ title, url }));

    const match = /^\s*<p><strong>([\s\S]*?)<\/strong><\/p>([\s\S]*)$/.exec(html);
    if (!match) {
      console.warn(`left out ${qId}: unexpected structure`);
      continue;
    }
    const question = htmlToText(match[1]);
    const answer = htmlToText(match[2]);
    if (!question || (!answer && answerPictures.length === 0)) {
      console.warn(`left out ${qId}: missing question or answer`);
      continue;
    }

    results.push({
      id: qId,
      catalogId: catalogId,
      category: catalog.title,
      open: true,
      question: question,
      pictureUrls: questionPictures,
      answerPictureUrls: answerPictures,
      answers: [{ value: answer, right: true }],
    });
  }
  await downloadImages(downloads);
  console.log(` sks ${catalog.name}: ${results.length}`);
  return results;
}

async function main() {
  const all = [];
  for (const catalog of catalogs) {
    all.push(...(await scrapeCatalog(catalog)));
  }
  writeCatalog('sks', all);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
