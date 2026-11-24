import { sheetNumbers } from './exam-sheet-numbers';

/** A part of a question sheet that is scored separately (e.g. Basisfragen). */
export interface ExamPart {
  title: string;
  questionIds: string[];
  /** Minimum number of right answers to pass this part (if scored separately). */
  minCorrect?: number;
}

export interface ExamSheet {
  /** Stable id, used in the url and to store results. */
  id: string;
  groupId: string;
  title: string;
  parts: ExamPart[];
  /** Minimum number of points over all parts (if the sheet is scored as a whole). */
  minPoints?: number;
  /** With at least this many points (but less than minPoints) an oral exam decides (SKS). */
  oralMinPoints?: number;
  /** Points per right answer. */
  pointsPerQuestion: number;
  /** Official time limit in minutes (if known). */
  minutes?: number;
}

export interface ExamGroup {
  id: string;
  /** Licence (see catalogs.ts) this group belongs to; hidden together with the licence. */
  licenceId: string;
  title: string;
  description: string;
  /** Short summary of the pass criteria. */
  rules: string;
  /** Additional hint, e.g. parts of the real exam that are not part of the simulation. */
  note?: string;
  sheets: ExamSheet[];
}

const sbfId = (sea: boolean) => (n: number) =>
  n <= 72 ? `basic_${n}` : sea ? `advanced_sea_${n}` : n <= 253 ? `advanced_inland_${n}` : `advanced_sail_${n}`;

function sheetsOf(
  groupId: string,
  numbers: { [sheet: string]: number[] },
  build: (sheetNumber: string, numbers: number[]) => Omit<ExamSheet, 'id' | 'groupId'>
): ExamSheet[] {
  return Object.keys(numbers)
    .sort((a, b) => +a - +b)
    .map((n) => ({ id: `${groupId}_${n}`, groupId, ...build(n, numbers[n]) }));
}

const seeId = sbfId(true);
const binnenId = sbfId(false);

export const examGroups: ExamGroup[] = [
  {
    id: 'sbf_see',
    licenceId: 'sbf_see',
    title: 'SBF See',
    description: '15 amtliche Fragebögen mit je 7 Basisfragen und 23 spezifischen Fragen See.',
    rules: 'Bestanden mit mindestens 5 von 7 Basisfragen und 18 von 23 spezifischen Fragen. Zeit: 60 Minuten.',
    note: 'Die Navigationsaufgabe (9 Fragen) der echten Prüfung ist hier nicht enthalten.',
    sheets: sheetsOf('sbf_see', sheetNumbers.see, (n, nums) => ({
      title: `Fragebogen ${n}`,
      pointsPerQuestion: 1,
      minutes: 60,
      parts: [
        { title: 'Basisfragen', questionIds: nums.filter((x) => x <= 72).map(seeId), minCorrect: 5 },
        { title: 'Spezifische Fragen See', questionIds: nums.filter((x) => x > 72).map(seeId), minCorrect: 18 },
      ],
    })),
  },
  {
    id: 'sbf_binnen',
    licenceId: 'sbf_binnen',
    title: 'SBF Binnen mit Antriebsmaschine',
    description: '15 amtliche Fragebögen mit je 7 Basisfragen und 23 spezifischen Fragen Binnen.',
    rules: 'Bestanden mit mindestens 5 von 7 Basisfragen und 18 von 23 spezifischen Fragen. Zeit: 45 Minuten.',
    sheets: sheetsOf('sbf_binnen', sheetNumbers.binnen, (n, nums) => ({
      title: `Fragebogen ${n}`,
      pointsPerQuestion: 1,
      minutes: 45,
      parts: [
        { title: 'Basisfragen', questionIds: nums.filter((x) => x <= 72).map(binnenId), minCorrect: 5 },
        { title: 'Spezifische Fragen Binnen', questionIds: nums.filter((x) => x > 72).map(binnenId), minCorrect: 18 },
      ],
    })),
  },
  {
    id: 'sbf_binnen_segel',
    licenceId: 'sbf_binnen_segel',
    title: 'SBF Binnen unter Segel',
    description: '15 amtliche Fragebögen (S 1 – S 15) für den Schein unter Segel ohne Antriebsmaschine.',
    rules: 'Je 4 Basisfragen, 14 Fragen Binnen und 7 Fragen Segeln. Bestanden mit insgesamt mindestens 20 von 25 Punkten. Zeit: 35 Minuten.',
    sheets: sheetsOf('sbf_binnen_segel', sheetNumbers.segel, (n, nums) => ({
      title: `Fragebogen S ${n}`,
      pointsPerQuestion: 1,
      minutes: 35,
      minPoints: 20,
      parts: [
        { title: 'Basisfragen', questionIds: nums.filter((x) => x <= 72).map(binnenId) },
        { title: 'Spezifische Fragen Binnen', questionIds: nums.filter((x) => x > 72 && x <= 253).map(binnenId) },
        { title: 'Spezifische Fragen Segeln', questionIds: nums.filter((x) => x > 253).map(binnenId) },
      ],
    })),
  },
  {
    id: 'sbf_segel_ergaenzung',
    licenceId: 'sbf_binnen_segel',
    title: 'Ergänzungsbogen Segeln',
    description: '15 amtliche Ergänzungsbögen mit je 7 Fragen Segeln, z. B. wenn man den SBF Binnen mit Antriebsmaschine schon hat.',
    rules: 'Bestanden mit mindestens 5 von 7 Fragen. Zeit: 15 Minuten.',
    sheets: sheetsOf('sbf_segel_ergaenzung', sheetNumbers.segelErgaenzung, (n, nums) => ({
      title: `Ergänzungsbogen ${n}`,
      pointsPerQuestion: 1,
      minutes: 15,
      parts: [{ title: 'Spezifische Fragen Segeln', questionIds: nums.map(binnenId), minCorrect: 5 }],
    })),
  },
  {
    id: 'fkn',
    licenceId: 'fkn',
    title: 'FKN',
    description: '4 amtliche Fragebögen (FKN 001 – FKN 004) mit je 15 Fragen.',
    rules: 'Jede richtige Antwort gibt 2 Punkte. Bestanden mit mindestens 24 von 30 Punkten.',
    note: 'In der echten Prüfung gibt es für teilweise richtige Antworten auch 1 Punkt – hier bewertest du offene Fragen selbst.',
    sheets: sheetsOf('fkn', sheetNumbers.fkn, (n, nums) => ({
      title: `Fragebogen FKN 00${n}`,
      pointsPerQuestion: 2,
      minPoints: 24,
      parts: [{ title: 'Fragen', questionIds: nums.map((x) => `fkn_${x}`) }],
    })),
  },
];

examGroups.splice(4, 0, {
  id: 'sks',
  licenceId: 'sks',
  title: 'SKS',
  description:
    '15 Fragebögen mit je 9 Fragen Navigation, 7 Schifffahrtsrecht, 5 Wetterkunde und 9 Seemannschaft (Antriebsmaschine und unter Segel).',
  rules:
    'Jede Frage gibt bis zu 2 Punkte. Ab 39 von 60 Punkten bestanden, 33–38 Punkte: mündliche Nachprüfung. Zeit: 90 Minuten.',
  note:
    'Die Verteilung der Fragen auf die Bögen ist nicht amtlich veröffentlicht; sie stammt aus einer Zusammenstellung im Segeln-Forum (Stand 2018). Die Kartenaufgabe der echten Prüfung ist nicht enthalten. Teilpunkte gibt es hier nicht – du bewertest dich selbst.',
  sheets: Object.keys(sheetNumbers.sks)
    .sort((a, b) => +a - +b)
    .map((n) => {
      const nums = sheetNumbers.sks[n];
      return {
        id: `sks_${n}`,
        groupId: 'sks',
        title: `Fragebogen ${n}`,
        pointsPerQuestion: 2,
        minutes: 90,
        minPoints: 39,
        oralMinPoints: 33,
        parts: [
          { title: 'Navigation', questionIds: nums.navigation.map((x) => `sks_navigation_${x}`) },
          { title: 'Schifffahrtsrecht', questionIds: nums.law.map((x) => `sks_law_${x}`) },
          { title: 'Wetterkunde', questionIds: nums.weather.map((x) => `sks_weather_${x}`) },
          { title: 'Seemannschaft', questionIds: nums.seamanship1.map((x) => `sks_seamanship1_${x}`) },
        ],
      };
    }),
});

export function findSheet(id: string): ExamSheet | undefined {
  for (const group of examGroups) {
    const sheet = group.sheets.find((s) => s.id === id);
    if (sheet) {
      return sheet;
    }
  }
  return undefined;
}

export function findGroup(id: string): ExamGroup | undefined {
  return examGroups.find((g) => g.id === id);
}

export interface ExamPartResult {
  title: string;
  correct: number;
  total: number;
  minCorrect?: number;
  passed: boolean;
}

export interface ExamResult {
  date: string;
  correct: number;
  total: number;
  points: number;
  maxPoints: number;
  passed: boolean;
  /** Not passed, but enough points for an oral exam. */
  oral?: boolean;
  parts: ExamPartResult[];
}

/** Scores a sheet; `isCorrect` tells whether a question was answered correctly. */
export function scoreSheet(sheet: ExamSheet, isCorrect: (questionId: string) => boolean): ExamResult {
  const parts = sheet.parts.map((part) => {
    const correct = part.questionIds.filter(isCorrect).length;
    return {
      title: part.title,
      correct,
      total: part.questionIds.length,
      minCorrect: part.minCorrect,
      passed: part.minCorrect === undefined || correct >= part.minCorrect,
    };
  });
  const correct = parts.reduce((sum, p) => sum + p.correct, 0);
  const total = parts.reduce((sum, p) => sum + p.total, 0);
  const points = correct * sheet.pointsPerQuestion;
  const passed = parts.every((p) => p.passed) && (sheet.minPoints === undefined || points >= sheet.minPoints);
  const oral = !passed && sheet.oralMinPoints !== undefined && points >= sheet.oralMinPoints;
  return {
    date: new Date().toISOString(),
    correct,
    total,
    points,
    maxPoints: total * sheet.pointsPerQuestion,
    passed,
    oral,
    parts,
  };
}
