const fs = require('fs');

let basePath = './dist/';
basicQ = JSON.parse(fs.readFileSync(basePath + 'basic.json'));
advancedQSea = JSON.parse(fs.readFileSync(basePath + 'advanced_sea.json'));
advancedQSail = JSON.parse(fs.readFileSync(basePath + 'advanced_sail.json'));
advancedQInland = JSON.parse(fs.readFileSync(basePath + 'advanced_inland.json'));

allQuestions = [
  ...basicQ.map((q) => {
    return {
      ...q,
      type: 'basic',
    };
  }),
  ...advancedQSea.map((q) => {
    return {
      ...q,
      type: 'advanced_sea',
    };
  }),
  ...advancedQSail.map((q) => {
    return {
      ...q,
      type: 'advanced_sail',
    };
  }),
  ...advancedQInland.map((q) => {
    return {
      ...q,
      type: 'advanced_inland',
    };
  }),
];

fs.writeFileSync(basePath + 'questions.json', JSON.stringify(allQuestions));
fs.writeFileSync('../popquiz/src/assets/' + 'questions.json', JSON.stringify(allQuestions));
