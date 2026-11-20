import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

/** Hides or shows a catalog (e.g. a licence the user already has) on the start page and in the menu. */
export class SetCatalogHidden {
  public static readonly type: string = '[Settings] Set catalog hidden';
  constructor(public id: string, public hidden: boolean) {}
}

export interface SettingsStateModel {
  hiddenCatalogs: string[];
}

@State<SettingsStateModel>({
  name: 'settings',
  defaults: {
    hiddenCatalogs: [],
  },
})
@Injectable()
export class SettingsState {
  @Selector()
  public static hiddenCatalogs(state: SettingsStateModel): string[] {
    return state.hiddenCatalogs || [];
  }

  @Action(SetCatalogHidden)
  public setCatalogHidden(ctx: StateContext<SettingsStateModel>, action: SetCatalogHidden) {
    const hidden = (ctx.getState().hiddenCatalogs || []).filter((id) => id !== action.id);
    ctx.patchState({ hiddenCatalogs: action.hidden ? [...hidden, action.id] : hidden });
  }
}
