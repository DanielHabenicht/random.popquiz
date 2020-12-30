const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs');

let jsonSpace = 2;

//const urlbasicQuestion = 'https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Basisfragen/Basisfragen-node.html';
const baseUrl = 'http://127.0.0.1:8080';

function getBaseQuestions() {
  const urlbasicQuestion = 'http://127.0.0.1:8080/ELWIS%20-%20Basisfragen.html';
  rp(urlbasicQuestion)
    .then(function (html) {
      fs.mkdirSync('./dist/', { recursive: true });
      fs.mkdirSync('./dist/images/', { recursive: true });

      const elms = $(`div#content > ol > li`, html);
      const results = [];
      elms.each((index, e) => {
        const q = $(e).text();
        const regex = /(.+)/.exec(q);
        const catalogId = $(e).parent().attr('start');
        const qId = 'basic_' + catalogId;
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
                fs.writeFileSync('./dist/images/' + name, ans, { encoding: 'binary' });
              });
            }
            images.push({
              title: title,
              url: name,
            });
          });

        results.push({
          id: qId,
          catalogId: catalogId,
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

      fs.writeFileSync('./dist/basic.json', JSON.stringify(results, undefined, jsonSpace));
    })
    .catch(function (err) {
      throw err;
      //handle error
    });
}

function getAdvancedQuestions(catalog) {
  rp(catalog.url)
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
        const catalogId = regex[1];
        const qId = catalog.name + '_' + catalogId;
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
              .map((e, i) => {
                const image = $(e).find('img');
                let name = undefined;
                let title = undefined;
                if (image.length > 0) {
                  const src = image.attr('src').slice(1);
                  name = qId + '_answer_' + i + '.gif';
                  title = image.attr('title');
                  if (src) {
                    rp(baseUrl + src, {
                      encoding: 'binary',
                    }).then((ans) => {
                      fs.writeFileSync('./dist/images/' + name, ans, { encoding: 'binary' });
                    });
                  }
                }

                return {
                  value: $(e).text().replace(/\n/g, ''),
                  image: name,
                  imageTitle: title,
                };
              });
          }
        } while (!(currElement[0].name == 'ol'));

        if (ans.length > 0) {
          results.push({
            id: qId,
            catalogId: catalogId,
            question: qText,
            pictureUrls: images,
            answers: [
              {
                ...ans[0],
                right: true,
              },
              ...ans.slice(1).map((e, i) => {
                return { ...e, right: false };
              }),
            ],
          });
        } else {
          console.warn(`left Out: "${q}" with ${ans}`);
        }
      });

      console.log(` ${catalog.name}: ${results.length}`);
      fs.writeFileSync(`./dist/${catalog.name}.json`, JSON.stringify(results, undefined, jsonSpace));
    })
    .catch(function (err) {
      console.error(err);
      //handle error
    });
}

getBaseQuestions();
questionCatalogs = [
  {
    url: 'http://127.0.0.1:8080/ELWIS%20-%20Spezifische%20Fragen%20See.html',
    name: 'advanced_sea',
  },
  {
    url: 'http://127.0.0.1:8080/ELWIS%20-%20Spezifische%20Fragen%20Segeln.html',
    name: 'advanced_sail',
  },
  {
    url: 'http://127.0.0.1:8080/ELWIS%20-%20Spezifische%20Fragen%20Binnen.html',
    name: 'advanced_inland',
  },
];
questionCatalogs.forEach((catalog) => {
  getAdvancedQuestions(catalog);
});
