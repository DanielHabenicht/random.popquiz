import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExamState, SheetResults } from '../../state/exam.state';
import { SettingsState } from '../../state/settings.state';
import { ExamGroup, examGroups } from '../exams';

interface GroupView {
  group: ExamGroup;
  passedCount: number;
}

@Component({
  selector: 'app-exam-overview',
  templateUrl: './exam-overview.page.html',
  styleUrls: ['./exam-overview.page.scss'],
})
export class ExamOverviewPage {
  public groups$: Observable<GroupView[]>;
  public results$: Observable<{ [sheetId: string]: SheetResults }>;

  constructor(store: Store) {
    this.results$ = store.select(ExamState.results);
    this.groups$ = combineLatest([store.select(SettingsState.hiddenCatalogs), this.results$]).pipe(
      map(([hidden, results]) =>
        examGroups
          .filter((g) => !hidden.includes(g.licenceId))
          .map((group) => ({ group, passedCount: group.sheets.filter((s) => results[s.id]?.everPassed).length }))
      )
    );
  }

  /** Short label for the sheet button, e.g. "3" or "S 3". */
  public label(title: string): string {
    return title.replace(/^(Fragebogen|Ergänzungsbogen)\s*(FKN\s*)?/, '');
  }
}
