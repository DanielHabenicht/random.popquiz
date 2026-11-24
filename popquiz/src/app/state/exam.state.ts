import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ExamResult } from '../exams/exams';

/** Stores the result of a finished exam sheet. */
export class SaveExamResult {
  public static readonly type: string = '[Exam] Save result';
  constructor(public sheetId: string, public result: ExamResult) {}
}

export interface SheetResults {
  last: ExamResult;
  attempts: number;
  /** Has the sheet been passed at least once? */
  everPassed: boolean;
}

export interface ExamStateModel {
  results: { [sheetId: string]: SheetResults };
}

@State<ExamStateModel>({
  name: 'exams',
  defaults: {
    results: {},
  },
})
@Injectable()
export class ExamState {
  @Selector()
  public static results(state: ExamStateModel): { [sheetId: string]: SheetResults } {
    return state.results || {};
  }

  @Action(SaveExamResult)
  public save(ctx: StateContext<ExamStateModel>, action: SaveExamResult) {
    const results = ctx.getState().results || {};
    const previous = results[action.sheetId];
    ctx.patchState({
      results: {
        ...results,
        [action.sheetId]: {
          last: action.result,
          attempts: (previous?.attempts || 0) + 1,
          everPassed: !!previous?.everPassed || action.result.passed,
        },
      },
    });
  }
}
