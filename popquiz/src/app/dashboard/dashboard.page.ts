import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { allQuestions, Catalog, licences, parts } from '../catalogs';
import { CatalogStats, QuestionsService } from '../questions.service';

interface Row {
  catalog: Catalog;
  stats$: Observable<CatalogStats>;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  public groups: { title: string; rows: Row[] }[];

  constructor(questionService: QuestionsService) {
    const rows = (catalogs: Catalog[]) =>
      catalogs.map((catalog) => ({ catalog, stats$: questionService.stats(catalog) }));
    this.groups = [
      { title: 'Gesamt', rows: rows([allQuestions]) },
      { title: 'Führerscheine', rows: rows(licences) },
      { title: 'SBF-Fragenkataloge', rows: rows(parts) },
    ];
  }
}
