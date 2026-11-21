import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { Question } from './types/questions';
import { QuestionsState, QuestionsStateEnum, QuestionState, QuizMode } from './state/questions.state';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, map, take } from 'rxjs/operators';
import { Catalog } from './catalogs';

export interface CatalogStats {
  total: number;
  /** last answer was right */
  right: number;
  /** last answer was wrong */
  wrong: number;
  /** never answered */
  open: number;
}

export interface NextQuestion {
  question: Question | undefined;
  /** number of questions left in the selected mode (including the returned one) */
  remaining: number;
}

/** How many of the last questions are not asked again right away (if there are enough other questions). */
const RECENT_HISTORY = 10;

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  private questionCache: Observable<Question[]> = null;
  private recent: string[] = [];

  constructor(private httpClient: HttpClient, private store: Store) {}

  public getQuestions(): Observable<Question[]> {
    if (!this.questionCache) {
      this.questionCache = this.httpClient.get<Question[]>('assets/questions.json').pipe(shareReplay(1));
    }
    return this.questionCache;
  }

  public questionsOf(catalog: Catalog): Observable<Question[]> {
    return this.getQuestions().pipe(map((questions) => questions.filter((q) => catalog.types.includes(q.type))));
  }

  /** Statistics of a catalog, updated whenever a question is answered. */
  public stats(catalog: Catalog): Observable<CatalogStats> {
    return combineLatest([this.questionsOf(catalog), this.store.select(QuestionsState.questionsState)]).pipe(
      map(([questions, state]) => {
        const stats: CatalogStats = { total: questions.length, right: 0, wrong: 0, open: 0 };
        for (const q of questions) {
          const lastAnswer = state[q.id]?.lastAnswer;
          if (lastAnswer === QuestionsStateEnum.right) {
            stats.right++;
          } else if (lastAnswer === QuestionsStateEnum.wrong) {
            stats.wrong++;
          } else {
            stats.open++;
          }
        }
        return stats;
      })
    );
  }

  /** Number of marked questions in a catalog, updated whenever a question is (un)marked. */
  public markedCount(catalog: Catalog): Observable<number> {
    return combineLatest([this.questionsOf(catalog), this.store.select(QuestionsState.markedQuestions)]).pipe(
      map(([questions, marked]) => {
        const ids = new Set(marked);
        return questions.filter((q) => ids.has(q.id)).length;
      })
    );
  }

  /** Picks a random question of the catalog for the given mode, avoiding the recently asked ones. */
  public nextQuestion(catalog: Catalog, mode: QuizMode): Observable<NextQuestion> {
    return this.questionsOf(catalog).pipe(
      take(1),
      map((questions) => {
        const state = this.store.selectSnapshot(QuestionsState.questionsState);
        const marked = new Set(this.store.selectSnapshot(QuestionsState.markedQuestions));
        const pool = questions.filter((q) =>
          mode === 'marked' ? marked.has(q.id) : matchesMode(state[q.id], mode)
        );
        if (pool.length === 0) {
          return { question: undefined, remaining: 0 };
        }
        const historySize = Math.min(RECENT_HISTORY, pool.length - 1);
        const recent = new Set(this.recent.slice(0, historySize));
        const candidates = pool.filter((q) => !recent.has(q.id));
        const question = candidates[Math.floor(Math.random() * candidates.length)];
        this.recent = [question.id, ...this.recent.filter((id) => id !== question.id)].slice(0, RECENT_HISTORY);
        return { question, remaining: pool.length };
      })
    );
  }
}

function matchesMode(state: QuestionState | undefined, mode: QuizMode): boolean {
  switch (mode) {
    case 'failed':
      return state?.lastAnswer === QuestionsStateEnum.wrong;
    case 'failed80':
      return state?.ratio < 0.8;
    case 'unanswered':
    default:
      return state?.lastAnswer !== QuestionsStateEnum.right;
  }
}
