import { QuestionType } from './types/questions';

/** A selection of question types that can be learned together, e.g. everything needed for one licence. */
export interface Catalog {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  types: QuestionType[];
}

/** Everything needed for one licence. Shown on the start page and in the menu. */
export const licences: Catalog[] = [
  {
    id: 'sbf_see',
    title: 'SBF See',
    subtitle: 'Basisfragen + Spezifische Fragen See',
    icon: 'boat',
    types: ['basic', 'advanced_sea'],
  },
  {
    id: 'sbf_binnen',
    title: 'SBF Binnen',
    subtitle: 'Basisfragen + Spezifische Fragen Binnen',
    icon: 'water',
    types: ['basic', 'advanced_inland'],
  },
  {
    id: 'sbf_binnen_segel',
    title: 'SBF Binnen unter Segel',
    subtitle: 'Basisfragen + Binnen + Segeln',
    icon: 'flag',
    types: ['basic', 'advanced_inland', 'advanced_sail'],
  },
  {
    id: 'sks',
    title: 'SKS',
    subtitle: 'Sportküstenschifferschein',
    icon: 'compass',
    types: ['sks'],
  },
  {
    id: 'fkn',
    title: 'FKN',
    subtitle: 'Fachkundenachweis Seenotsignalmittel',
    icon: 'flame',
    types: ['fkn'],
  },
];

/** The individual parts of the SBF catalogs. */
export const parts: Catalog[] = [
  { id: 'basic', title: 'Basisfragen', subtitle: 'SBF See und Binnen', icon: 'list', types: ['basic'] },
  { id: 'advanced_sea', title: 'Spezifische Fragen See', subtitle: 'SBF See', icon: 'list', types: ['advanced_sea'] },
  {
    id: 'advanced_inland',
    title: 'Spezifische Fragen Binnen',
    subtitle: 'SBF Binnen',
    icon: 'list',
    types: ['advanced_inland'],
  },
  {
    id: 'advanced_sail',
    title: 'Spezifische Fragen Segeln',
    subtitle: 'SBF Binnen unter Segel',
    icon: 'list',
    types: ['advanced_sail'],
  },
];

export const allQuestions: Catalog = {
  id: 'all',
  title: 'Alle Fragen',
  subtitle: 'Alle Fragenkataloge',
  icon: 'albums',
  types: ['basic', 'advanced_sea', 'advanced_inland', 'advanced_sail', 'sks', 'fkn'],
};

export function findCatalog(id: string): Catalog {
  return [...licences, ...parts, allQuestions].find((c) => c.id === id) || allQuestions;
}
