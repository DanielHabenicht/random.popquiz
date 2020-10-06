import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Action, createSelector, Selector, State, StateContext, Store } from '@ngxs/store';
import { Question, QuestionMode, QuestionType } from './types/questions';
import { QuestionsState, QuestionsStateEnum, QuizMode } from './state/questions.state';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class QuestionsService {
  private questionDictionary: Observable<QuestionDictionary> = null;
  private questionCache: Observable<Question[]> = null;

  constructor(private httpClient: HttpClient, private store: Store) {}

  public getQuestions(): Observable<Question[]> {
    if (this.questionCache) {
      return this.questionCache;
    }
    return this.httpClient.get<Question[]>('assets/questions.json').pipe(shareReplay(1));
  }

  public getQuestionsDictionary(): Observable<QuestionDictionary> {
    if (this.questionDictionary) {
      return this.questionDictionary;
    }
    return this.getQuestions().pipe(
      map((questions) =>
        questions.reduce((prev, q) => {
          return {
            ...prev,
            [q.id]: q,
          };
        }, {})
      ),
      shareReplay(1)
    );
  }

  public questionCount(type: QuestionMode, qState: QuestionsStateEnum = null): Observable<number> {
    return this.getQuestionsDictionary().pipe(
      map((questionDictionary) => {
        const state = this.store.selectSnapshot(QuestionsState.questionsState);
        return Object.keys(questionDictionary).reduce((prev, key) => {
          if (type !== 'all' && questionDictionary[key].type !== type) {
            return prev;
          }
          if (qState === null) {
            return prev + 1;
          }
          return prev + (state[key]?.lastAnswer === qState ? 1 : 0);
        }, 0);
      })
    );
  }

  public nextQuestion(type: QuestionMode, mode: QuizMode) {
    return this.getQuestionsDictionary().pipe(
      map((questionDictionary) => {
        const state = this.store.selectSnapshot(QuestionsState.questionsState);
        let selection = Object.keys(questionDictionary).filter((key) => {
          let keep = true;
          if (type !== 'all') {
            keep = questionDictionary[key].type === type;
          }
          if (mode !== 'unanswered') {
            keep = keep && state[key]?.lastAnswer === QuestionsStateEnum.wrong;
          }
          return keep;
        });
        return questionDictionary[selection[Math.floor(Math.random() * selection.length)]];
      })
    );
  }
}

type QuestionDictionary = { [key: string]: Question };
