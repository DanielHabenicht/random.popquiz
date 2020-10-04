const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs');

//const urlbasicQuestion = 'https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Basisfragen/Basisfragen-node.html';
const baseUrl = 'http://172.26.16.1:8080';

function getBaseQuestions() {
  const urlbasicQuestion = 'http://172.26.16.1:8080/ELWIS%20-%20Basisfragen.html';
  rp(urlbasicQuestion)
    .then(function (html) {
      fs.mkdirSync('./dist/', { recursive: true });
      fs.mkdirSync('./dist/images/', { recursive: true });

      const elms = $(`div#content > ol > li`, html);
      const results = [];
      elms.each((index, e) => {
        const q = $(e).text();
        const regex = /(.+)/.exec(q);
        const qId = $(e).parent().attr('start');
        const qText = regex[1];
        let images = [];
        let ans = $(e)
          .find('li')
          .toArray()
          .map((e) => $(e).text());

        $(e)
          .find('img')
          .each((index, e) => {
            const src = $(e).attr('src').slice(1);
            const title = $(e).attr('title');
            const name = qId + '_' + index + '.gif';
            if (src) {
              rp(baseUrl + src, {
                encoding: 'binary',
              }).then((ans) => {
                console.log(title);
                fs.writeFileSync('./dist/images/' + name, ans, { encoding: 'binary' });
              });
            }
            images.push({
              title: title,
              url: name,
            });
          });
        //console.log(images);

        results.push({
          id: qId,
          question: qText,
          pictureUrls: images,
          answers: [
            {
              value: ans[0],
              right: true,
            },
            ...ans.slice(1).map((e) => {
              return { value: e, right: false };
            }),
          ],
        });
      });

      console.log(results);
      fs.writeFileSync('./dist/basicQuestions.json', JSON.stringify(results));
    })
    .catch(function (err) {
      throw err;
      //handle error
    });
}

function getAdvancedQuestions() {
  const urlAdvancedQuestion = 'http://172.26.16.1:8080/ELWIS%20-%20Spezifische%20Fragen%20See.html';

  rp(urlAdvancedQuestion)
    .then(function (html) {
      fs.mkdirSync('./dist/', { recursive: true });
      fs.mkdirSync('./dist/images/', { recursive: true });

      const elms = $(`div#content > p`, html).not('.picture').not('.wsv-red');
      const results = [];
      elms.each((index, e) => {
        let images = [];
        let ans = [];
        const q = $(e).text();

        if (q === '') {
          return;
        }
        const regex = /(\d+)\. (.+)/.exec(q);
        const qId = regex[1];
        const qText = regex[2];

        let currElement = $(e);

        let pictureIndex = 0;
        do {
          currElement = currElement.next();
          if (
            currElement[0].attribs &&
            currElement[0].attribs.class &&
            currElement[0].attribs.class.includes('picture')
          ) {
            $(e)
              .next()
              .find('img')
              .each((i, e) => {
                const src = $(e).attr('src').slice(1);
                const name = qId + '_' + pictureIndex + '.gif';
                const title = $(e).attr('title');
                if (src) {
                  rp(baseUrl + src, {
                    encoding: 'binary',
                  }).then((ans) => {
                    fs.writeFileSync('./dist/images/' + name, ans, { encoding: 'binary' });
                  });
                }
                images.push({
                  title: title,
                  url: name,
                });
              });
          }
          if (currElement[0].name == 'ol') {
            ans = currElement
              .find('li')
              .toArray()
              .map((e) => $(e).text().replace(/\n/g, ''));
          }
          pictureIndex += 1;
        } while (!(currElement[0].name == 'ol'));

        if (ans.length > 0) {
          results.push({
            id: qId,
            question: qText,
            pictureUrls: images,
            answers: [
              {
                value: ans[0],
                right: true,
              },
              ...ans.slice(1).map((e) => {
                return { value: e, right: false };
              }),
            ],
          });
        } else {
          console.warn(`left Out: "${q}" with ${ans}`);
        }
      });

      console.log(results.length);
      fs.writeFileSync('./dist/advancedQuestions.json', JSON.stringify(results));
    })
    .catch(function (err) {
      //handle error
    });
}

getBaseQuestions();
// getAdvancedQuestions();
