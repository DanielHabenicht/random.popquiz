// Scrapes the official SKS (Sportküstenschifferschein) question catalog from ELWIS.
// The SKS questions are open questions (no multiple choice), so every question gets exactly
// one "answer" which is the official answer text from the catalog.
//
// Usage: node scrape-sks.js
// Output: ./dist/sks.json and images in ./dist/images/
const $ = require('cheerio');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS';
const catalogs = [
  { name: 'navigation', title: 'Navigation', url: `${baseUrl}/Navigation/Navigation-node` },
  { name: 'law', title: 'Schifffahrtsrecht', url: `${baseUrl}/Schifffahrtsrecht/Schifffahrtsrecht-node` },
  { name: 'weather', title: 'Wetterkunde', url: `${baseUrl}/Wetterkunde/Wetterkunde-node` },
  { name: 'seamanship1', title: 'Seemannschaft I', url: `${baseUrl}/Seemannschaft-I/Seemannschaft-I-node` },
  { name: 'seamanship2', title: 'Seemannschaft II', url: `${baseUrl}/Seemannschaft-II/Seemannschaft-II-node` },
];

const distDir = './dist/';
const imageDir = path.join(distDir, 'images');

async function download(url, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`GET ${url} failed with ${res.status}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

/** Converts a html fragment into readable plain text (keeps line breaks and list numbering). */
function htmlToText(html) {
  const doc = $.load(`<div id="root">${html}</div>`, { decodeEntities: true });
  doc('br').replaceWith('\n');
  doc('ol').each((_, ol) => {
    const start = parseInt(doc(ol).attr('start') || '1', 10);
    doc(ol)
      .children('li')
      .each((i, li) => {
        doc(li).prepend(`${start + i}. `);
      });
  });
  doc('ul > li').each((_, li) => {
    doc(li).prepend('• ');
  });
  doc('li, p').each((_, e) => {
    doc(e).append('\n');
  });
  return doc('#root')
    .text()
    .replace(/ /g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

async function scrapeCatalog(catalog) {
  const html = (await download(catalog.url)).toString('utf-8');
  const start = html.indexOf('id="content"');
  const end = html.indexOf('class="sectionRelated', start);
  const content = html.slice(start, end > 0 ? end : undefined);

  // Every question starts with a "<p>Nummer X:</p>" paragraph.
  const chunks = content.split(/<p>Nummer (\d+):<\/p>/);
  const results = [];
  const downloads = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const catalogId = chunks[i];
    const qId = `sks_${catalog.name}_${catalogId}`;
    let chunk = chunks[i + 1].split('<p class="line">')[0];

    // Images are wrapped in (sometimes inline) <p class="picture ...">...</p> blocks.
    // Pull them out first so the remaining html is well formed.
    const questionEnd = chunk.indexOf('</strong></p>');
    const questionPictures = [];
    const answerPictures = [];
    let pictureIndex = 0;
    chunk = chunk.replace(/<p class="picture[^"]*"[^>]*>([\s\S]*?)<\/p>/g, (match, inner, offset) => {
      const img = /<img[^>]*src="([^"]+)"[^>]*>/.exec(inner);
      if (img) {
        const src = $.load(`<img src="${img[1]}">`)('img').attr('src');
        const titleMatch = /title="([^"]*)"/.exec(img[0]) || /alt="([^"]*)"/.exec(img[0]);
        const title = titleMatch ? $.load(`<i>${titleMatch[1]}</i>`)('i').text() : '';
        const ext = (/\.(\w+)(\?|$)/.exec(src) || [null, 'gif'])[1];
        const name = `${qId}_${pictureIndex++}.${ext}`;
        const url = new URL(src, catalog.url).toString();
        downloads.push({ url, name });
        (questionEnd < 0 || offset < questionEnd ? questionPictures : answerPictures).push({ title, url: name });
      }
      return ' ';
    });

    const match = /^\s*<p><strong>([\s\S]*?)<\/strong><\/p>([\s\S]*)$/.exec(chunk);
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
  // Download sequentially to be gentle with the server.
  for (const { url, name } of downloads) {
    fs.writeFileSync(path.join(imageDir, name), await download(url));
  }
  console.log(` sks ${catalog.name}: ${results.length}`);
  return results;
}

async function main() {
  fs.mkdirSync(imageDir, { recursive: true });
  const all = [];
  for (const catalog of catalogs) {
    all.push(...(await scrapeCatalog(catalog)));
  }
  fs.writeFileSync(path.join(distDir, 'sks.json'), JSON.stringify(all, undefined, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
