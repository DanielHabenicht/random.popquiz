const fs = require('fs');

let basePath = './dist/';
basicQ = JSON.parse(fs.readFileSync(basePath + 'basicQuestions.json'));
advancedQ = JSON.parse(fs.readFileSync(basePath + 'advancedQuestions.json'));

allQuestions = [
  ...basicQ.map((q) => {
    return {
      ...q,
      type: 'basic',
    };
  }),
  ...advancedQ.map((q) => {
    return {
      ...q,
      type: 'advanced',
    };
  }),
];

fs.writeFileSync(basePath + 'questions.json', JSON.stringify(allQuestions));
