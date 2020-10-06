export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  answers: Answer[];
  pictureUrls: PictureUrl[];
}

export interface PictureUrl {
  title: string;
  url: string;
}

export interface Answer {
  value: string;
  right: boolean;
}
export type QuestionType = 'basic' | 'advanced';

export type QuestionMode = QuestionType | 'all';
