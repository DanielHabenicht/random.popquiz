// Scrapes the official Sportbootführerschein (SBF See / Binnen) question catalogs from ELWIS.
// The first answer ("a") of every question is the right one.
//
// Usage: node scrape.js
// Output: ./dist/basic.json, ./dist/advanced_*.json and images in ./dist/images/
const { loadContent, htmlToText, extractPictures, downloadImages, writeCatalog } = require('./elwis');

const baseUrl = 'https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine';
const catalogs = [
  // The base questions are the same for SBF See and SBF Binnen.
  { name: 'basic', url: `${baseUrl}/Fragenkatalog-See/Basisfragen/Basisfragen-node` },
  { name: 'advanced_sea', url: `${baseUrl}/Fragenkatalog-See/Spezifische-Fragen-See/Spezifische-Fragen-See-node` },
  {
    name: 'advanced_inland',
    url: `${baseUrl}/Fragenkatalog-Binnen/Spezifische-Fragen-Binnen/Spezifische-Fragen-Binnen-node`,
  },
  {
    name: 'advanced_sail',
    url: `${baseUrl}/Fragenkatalog-Binnen/Spezifische-Fragen-Segeln/Spezifische-Fragen-Segeln-node`,
  },
];

async function scrapeCatalog(catalog) {
  const content = await loadContent(catalog.url);
  const results = [];
  const downloads = [];

  // Questions are separated by <p class="line"></p>.
  for (const raw of content.split('<p class="line">')) {
    const number = /<p>(\d+)\.\s/.exec(raw);
    const listStart = raw.indexOf('<ol');
    if (!number || listStart < 0) {
      continue;
    }
    const catalogId = number[1];
    const qId = `${catalog.name}_${catalogId}`;

    // question (with pictures) is everything before the answer list
    const questionPart = extractPictures(raw.slice(number.index, listStart), qId, catalog.url, downloads);
    const question = htmlToText(questionPart.html).replace(/^\d+\.\s*/, '');

    const list = raw.slice(listStart);
    const answers = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li, i) => {
      const answerPart = extractPictures(li[1], qId, catalog.url, downloads, `answer_${i}_`);
      const picture = answerPart.pictures[0];
      return {
        value: htmlToText(answerPart.html),
        image: picture ? picture.url : undefined,
        imageTitle: picture ? picture.title : undefined,
        right: i === 0,
      };
    });

    if (!question || answers.length < 2) {
      console.warn(`left out ${qId}: unexpected structure`);
      continue;
    }
    results.push({
      id: qId,
      catalogId: catalogId,
      question: question,
      pictureUrls: questionPart.pictures.map(({ title, url }) => ({ title, url })),
      answers: answers,
    });
  }

  await downloadImages(downloads);
  console.log(` ${catalog.name}: ${results.length}`);
  writeCatalog(catalog.name, results);
}

async function main() {
  for (const catalog of catalogs) {
    await scrapeCatalog(catalog);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
