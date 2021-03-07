import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { Question, QuestionMode, QuestionType } from '../types/questions';

export class SetQuestionsState {
  public static readonly type: string = '[Questions State] Set quetions state';
  constructor(public id: string, public state: QuestionsStateEnum) {}
}

export enum QuestionsStateEnum {
  wrong = 0,
  right = 1,
}

export interface QuestionsStateModel {
  questionsState: QuestionStateDictionary;
}

@State<QuestionsStateModel>({
  name: 'questionsstate',
  defaults: {
    questionsState: {},
  },
})
@Injectable()
export class QuestionsState {
  @Selector()
  public static questionsState(state: QuestionsStateModel): QuestionStateDictionary {
    return state.questionsState;
  }

  @Action(SetQuestionsState)
  public serviceWorkerNotificationDisplayed(ctx: StateContext<QuestionsStateModel>, action: SetQuestionsState) {
    const state = ctx.getState();
    let right = (state.questionsState[action.id]?.right || 0) + (action.state ? 1 : 0);
    let wrong = (state.questionsState[action.id]?.wrong || 0) + (!action.state ? 1 : 0);
    ctx.setState({
      ...state,
      questionsState: {
        ...state.questionsState,
        [action.id]: {
          lastAnswer: action.state,
          right: right,
          wrong: wrong,
          ratio: wrong !== 0 ? right / wrong : 1,
        },
      },
    });
  }
}

export interface QuestionState {
  lastAnswer: QuestionsStateEnum;
  wrong: number;
  right: number;
  ratio?: number;
}

export type QuizMode = 'failed80' | 'failed' | 'unanswered';

type QuestionStateDictionary = { [id: string]: QuestionState };
