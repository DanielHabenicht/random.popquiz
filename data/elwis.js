// Helpers shared by the ELWIS scrapers (scrape.js, scrape-sks.js).
const $ = require('cheerio');
const fs = require('fs');
const path = require('path');

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

/** Downloads a catalog page and returns the html of its main content. */
async function loadContent(url) {
  const html = (await download(url)).toString('utf-8');
  const start = html.indexOf('id="content"');
  const end = html.indexOf('class="sectionRelated', start);
  return html.slice(start, end > 0 ? end : undefined);
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

/**
 * Images are wrapped in (sometimes inline, invalidly nested) <p class="picture ...">...</p> blocks.
 * Removes them from the html so the rest is well formed and returns them with their position.
 * The images are named `${qId}_${index}.${ext}` and queued in `downloads`.
 */
function extractPictures(html, qId, pageUrl, downloads, namePrefix = '') {
  const pictures = [];
  const cleaned = html.replace(/<p class="picture[^"]*"[^>]*>([\s\S]*?)<\/p>/g, (match, inner, offset) => {
    const img = /<img[^>]*src="([^"]+)"[^>]*>/.exec(inner);
    if (img) {
      const src = $.load(`<img src="${img[1]}">`)('img').attr('src');
      const titleMatch = /title="([^"]*)"/.exec(img[0]) || /alt="([^"]*)"/.exec(img[0]);
      const title = titleMatch ? $.load(`<i>${titleMatch[1]}</i>`)('i').text() : '';
      const ext = (/\.(\w+)(\?|$)/.exec(src) || [null, 'gif'])[1];
      const name = `${qId}_${namePrefix}${pictures.length}.${ext}`;
      downloads.push({ url: new URL(src, pageUrl).toString(), name });
      pictures.push({ title, url: name, offset });
    }
    return ' ';
  });
  return { html: cleaned, pictures };
}

/** Downloads the queued images sequentially (to be gentle with the server). */
async function downloadImages(downloads) {
  fs.mkdirSync(imageDir, { recursive: true });
  for (const { url, name } of downloads) {
    fs.writeFileSync(path.join(imageDir, name), await download(url));
  }
}

function writeCatalog(name, questions) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, `${name}.json`), JSON.stringify(questions, undefined, 2));
}

module.exports = { download, loadContent, htmlToText, extractPictures, downloadImages, writeCatalog };
