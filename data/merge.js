const fs = require('fs');

let basePath = './dist/';
basicQ = JSON.parse(fs.readFileSync(basePath + 'basicQuestions.json'));
advancedQSea = JSON.parse(fs.readFileSync(basePath + 'advancedQuestionsSea.json'));
advancedQSail = JSON.parse(fs.readFileSync(basePath + 'advancedQuestionsSail.json'));
advancedQInland = JSON.parse(fs.readFileSync(basePath + 'advancedQuestionsInland.json'));

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
      type: 'advanced',
    };
  }),
  ...advancedQSail.map((q) => {
    return {
      ...q,
      type: 'sail',
    };
  }),
  ...advancedQInland.map((q) => {
    return {
      ...q,
      type: 'inland',
    };
  }),
];

fs.writeFileSync(basePath + 'questions.json', JSON.stringify(allQuestions));
