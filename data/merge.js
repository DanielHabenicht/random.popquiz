const fs = require('fs');
const path = require('path');

const basePath = './dist/';
const assetsPath = '../popquiz/src/assets/';

// file in ./dist => question type in the app
const catalogs = [
  { file: 'basic.json', type: 'basic' },
  { file: 'advanced_sea.json', type: 'advanced_sea' },
  { file: 'advanced_sail.json', type: 'advanced_sail' },
  { file: 'advanced_inland.json', type: 'advanced_inland' },
  { file: 'sks.json', type: 'sks' },
  { file: 'fkn.json', type: 'fkn' },
];

const allQuestions = [];
for (const catalog of catalogs) {
  const file = path.join(basePath, catalog.file);
  if (!fs.existsSync(file)) {
    console.warn(`skipping ${catalog.type}: ${file} not found`);
    continue;
  }
  const questions = JSON.parse(fs.readFileSync(file));
  console.log(` ${catalog.type}: ${questions.length}`);
  allQuestions.push(...questions.map((q) => ({ ...q, type: catalog.type })));
}

fs.writeFileSync(path.join(basePath, 'questions.json'), JSON.stringify(allQuestions));
fs.writeFileSync(path.join(assetsPath, 'questions.json'), JSON.stringify(allQuestions));

// copy the scraped images into the app
const imageSrc = path.join(basePath, 'images');
const imageDest = path.join(assetsPath, 'images');
if (fs.existsSync(imageSrc)) {
  fs.mkdirSync(imageDest, { recursive: true });
  for (const image of fs.readdirSync(imageSrc)) {
    fs.copyFileSync(path.join(imageSrc, image), path.join(imageDest, image));
  }
}
