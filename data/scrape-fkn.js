// Parses the official FKN (Fachkundenachweis für Seenotsignalmittel) question catalog.
//
// Source: "Anlage 2 zur Prüfungsordnung FKN" as linked by DSV/DMYV on
// https://www.sportbootfuehrerscheine.org/fuehrerscheine-funk/fkn-fachkundenachweis/
//
// The PDF is a two column table (question | answer). Most questions are open questions,
// some are multiple choice ("a) b) c)") where the right answer is printed in bold.
//
// Usage: node scrape-fkn.js [path-or-url-to-pdf]
// Output: ./dist/fkn.json
const PDFParser = require('pdf2json');
const fs = require('fs');
const path = require('path');

const defaultSource =
  'https://www.sportbootfuehrerscheine.org/app/uploads/sites/6/2024/08/Anlage-2-Fachkunde_Fragen-_und_Antwortenkatalog_Anlage_2.pdf';
const distDir = './dist/';

// Column boundaries in pdf2json page units.
const NUMBER_COLUMN_END = 4;
const ANSWER_COLUMN_START = 25;
const FOOTER_START = 33;

async function loadPdf(source) {
  let buffer;
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`GET ${source} failed with ${res.status}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    buffer = fs.readFileSync(source);
  }
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataError', (err) => reject(err.parserError || err));
    parser.on('pdfParser_dataReady', resolve);
    parser.parseBuffer(buffer);
  });
}

/** Groups the text fragments of all pages into lines per column. */
function toLines(pdf) {
  const lines = [];
  pdf.Pages.forEach((page, pageIndex) => {
    const byKey = {};
    for (const t of page.Texts) {
      if (t.y > FOOTER_START) {
        continue;
      }
      const text = t.R.map((r) => decodeURIComponent(r.T)).join('');
      const bold = t.R.some((r) => r.TS[2] === 1) && text.trim().length > 0;
      const column = t.x < NUMBER_COLUMN_END ? 'number' : t.x < ANSWER_COLUMN_START ? 'question' : 'answer';
      const key = `${column}|${t.y.toFixed(2)}`;
      byKey[key] = byKey[key] || { page: pageIndex, y: t.y, column, parts: [] };
      byKey[key].parts.push({ x: t.x, text, bold });
    }
    for (const line of Object.values(byKey)) {
      line.parts.sort((a, b) => a.x - b.x);
      line.text = line.parts
        .map((p) => p.text)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      line.bold = line.parts.some((p) => p.bold);
      if (line.text) {
        lines.push(line);
      }
    }
  });
  return lines.sort((a, b) => a.page - b.page || a.y - b.y);
}

/** Joins wrapped lines, fixing words hyphenated at the line end ("Bauartzulassungszei-" + "chen"). */
function joinLines(lines) {
  return lines.reduce((text, line) => {
    if (!text) {
      return line;
    }
    if (/[a-zäöüß]-$/.test(text)) {
      // "Bauartzulassungszei-" + "chen" => "Bauartzulassungszeichen", "Seenot-" + "Handfackel" => "Seenot-Handfackel"
      return /^[a-zäöüß]/.test(line) ? text.slice(0, -1) + line : text + line;
    }
    // Numbered list entries ("1. Feuchtigkeit,") and sub questions ("b) ...") start on a new line.
    return text + (/^(\d+\.|[a-z]\))\s/.test(line) ? '\n' : ' ') + line;
  }, '');
}

/** Splits lines into a) b) c) options. */
function toOptions(lines) {
  const options = [];
  for (const line of lines) {
    const m = /^([a-z])\)\s*(.*)$/.exec(line.text);
    if (m) {
      options.push({ lines: [m[2]], bold: line.bold });
    } else if (options.length > 0) {
      options[options.length - 1].lines.push(line.text);
      options[options.length - 1].bold = options[options.length - 1].bold || line.bold;
    }
  }
  return options.map((o) => ({ value: joinLines(o.lines), right: o.bold }));
}

async function main() {
  const source = process.argv[2] || defaultSource;
  const lines = toLines(await loadPdf(source));

  // Questions start after the table header ("Nr. Frage") and end before the questionnaire overview.
  const startIndex = lines.findIndex((l) => /^Nr\.? Frage/.test(l.text) || l.text === 'Nr.');
  const endIndex = lines.findIndex((l) => l.text.startsWith('Zusammenstellung der Fragen'));
  const tableLines = lines.slice(startIndex + 1, endIndex < 0 ? undefined : endIndex);

  // The overview at the end lists the questionnaires FKN 001 - 004 and marks multiple choice
  // questions with an "m" (e.g. "12 m").
  const overview = endIndex < 0 ? '' : lines.slice(endIndex).map((l) => l.text).join(' ');
  const multipleChoice = new Set([...overview.matchAll(/(\d+) m\b/g)].map((m) => parseInt(m[1], 10)));

  const numbers = tableLines.filter((l) => l.column === 'number' && /^\d+\.$/.test(l.text));
  const questions = numbers.map((n) => ({ number: parseInt(n.text, 10), page: n.page, y: n.y, question: [], answer: [] }));

  // Assign each line to the last question number above it (with a small tolerance, numbers are
  // sometimes printed slightly below the first line of the question).
  for (const line of tableLines) {
    if (line.column === 'number') {
      continue;
    }
    let owner = null;
    for (const q of questions) {
      if (q.page < line.page || (q.page === line.page && q.y - 0.5 <= line.y)) {
        owner = q;
      }
    }
    if (owner) {
      owner[line.column].push(line);
    }
  }

  const results = [];
  for (const q of questions) {
    const id = `fkn_${q.number}`;
    const firstOption = q.question.findIndex((l) => /^[a-z]\)/.test(l.text));
    const isMultipleChoiceLayout = firstOption > 0;
    const questionText = joinLines(
      (isMultipleChoiceLayout ? q.question.slice(0, firstOption) : q.question).map((l) => l.text)
    );

    let answers;
    let open = false;
    const isMultipleChoice = multipleChoice.size > 0 ? multipleChoice.has(q.number) : firstOption > 0;
    if (isMultipleChoice) {
      answers = toOptions(q.answer);
      const rightCount = answers.filter((a) => a.right).length;
      // Some questions have more than one right answer (all printed in bold).
      if (answers.length < 2 || rightCount < 1) {
        console.warn(`${id}: could not detect the right answer (${rightCount} of ${answers.length} bold)`);
      }
    } else {
      open = true;
      answers = [{ value: joinLines(q.answer.map((l) => l.text)), right: true }];
    }

    results.push({
      id: id,
      catalogId: String(q.number),
      category: 'Fachkunde Seenotsignalmittel',
      open: open,
      question: questionText,
      pictureUrls: [],
      answers: answers,
    });
  }

  if (results.length !== 60) {
    console.warn(`expected 60 questions, found ${results.length}`);
  }
  console.log(` fkn: ${results.length} (${results.filter((r) => !r.open).length} multiple choice)`);
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'fkn.json'), JSON.stringify(results, undefined, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
