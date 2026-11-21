import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { Question, QuestionMode, QuestionType } from '../types/questions';

export class SetQuestionsState {
  public static readonly type: string = '[Questions State] Set quetions state';
  constructor(public id: string, public state: QuestionsStateEnum) {}
}

/** Forgets all answers. */
export class ResetQuestionsState {
  public static readonly type: string = '[Questions State] Reset questions state';
}

/** Marks / unmarks a question to practise it again later. */
export class ToggleMarkedQuestion {
  public static readonly type: string = '[Questions State] Toggle marked question';
  constructor(public id: string) {}
}

export enum QuestionsStateEnum {
  wrong = 0,
  right = 1,
}

export interface QuestionsStateModel {
  questionsState: QuestionStateDictionary;
  /** Ids of questions the user marked to practise again. Not affected by resetting the progress. */
  markedQuestions?: string[];
}

@State<QuestionsStateModel>({
  name: 'questionsstate',
  defaults: {
    questionsState: {},
    markedQuestions: [],
  },
})
@Injectable()
export class QuestionsState {
  @Selector()
  public static questionsState(state: QuestionsStateModel): QuestionStateDictionary {
    return state.questionsState;
  }

  @Selector()
  public static markedQuestions(state: QuestionsStateModel): string[] {
    return state.markedQuestions || [];
  }

  @Action(ToggleMarkedQuestion)
  public toggleMarked(ctx: StateContext<QuestionsStateModel>, action: ToggleMarkedQuestion) {
    const marked = ctx.getState().markedQuestions || [];
    ctx.patchState({
      markedQuestions: marked.includes(action.id) ? marked.filter((id) => id !== action.id) : [...marked, action.id],
    });
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

  @Action(ResetQuestionsState)
  public reset(ctx: StateContext<QuestionsStateModel>) {
    ctx.setState({ ...ctx.getState(), questionsState: {} });
  }
}

export interface QuestionState {
  lastAnswer: QuestionsStateEnum;
  wrong: number;
  right: number;
  ratio?: number;
}

export type QuizMode = 'failed80' | 'failed' | 'unanswered' | 'marked';

type QuestionStateDictionary = { [id: string]: QuestionState };
