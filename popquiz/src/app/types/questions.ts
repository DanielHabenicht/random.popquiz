export interface Question {
  id: string;
  type: QuestionType;
  catalogId?: string;
  /** Sub category of the catalog, e.g. "Wetterkunde" for SKS questions. */
  category?: string;
  /**
   * Open questions (SKS, parts of FKN) have no answer options. The single answer contains the
   * official answer which is revealed, the user then rates whether they knew it.
   */
  open?: boolean;
  question: string;
  answers: Answer[];
  pictureUrls: PictureUrl[];
  /** Pictures belonging to the official answer of open questions. */
  answerPictureUrls?: PictureUrl[];
}

export interface PictureUrl {
  title: string;
  url: string;
}

export interface Answer {
  value: string;
  right: boolean;
}
export type QuestionType = 'basic' | 'advanced_sea' | 'advanced_sail' | 'advanced_inland' | 'sks' | 'fkn';

export type QuestionMode = QuestionType | 'all';
