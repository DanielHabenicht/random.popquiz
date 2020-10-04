import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

export class SetQuestionsState {
  public static readonly type: string = '[Questions State] Set quetions state';
  constructor(public id: string, public state: QuestionsStateEnum) {}
}

export enum QuestionsStateEnum {
  untouched = 0,
  solved = 1,
  wrong = 2,
}

export interface QuestionsStateModel {
  questionsState: { [id: string]: QuestionsStateEnum };
}

@State<QuestionsStateModel>({
  name: 'questionsstate',
  defaults: {
    questionsState: [] as any,
  },
})
@Injectable()
export class QuestionsState {
  @Selector()
  public static questionsState(state: QuestionsStateModel): { [id: string]: QuestionsStateEnum } {
    return state.questionsState;
  }

  @Action(SetQuestionsState)
  public serviceWorkerNotificationDisplayed(ctx: StateContext<QuestionsStateModel>, action: SetQuestionsState) {
    const state = ctx.getState();
    ctx.setState({
      ...state,
      questionsState: {
        ...state.questionsState,
        [action.id]: action.state,
      },
    });
  }
}
