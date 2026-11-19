import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { allQuestions, Catalog, licences } from '../catalogs';
import { CatalogStats, QuestionsService } from '../questions.service';

interface CatalogEntry {
  catalog: Catalog;
  stats$: Observable<CatalogStats>;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  public entries: CatalogEntry[];
  public all: CatalogEntry;

  constructor(questionService: QuestionsService) {
    this.entries = licences.map((catalog) => ({ catalog, stats$: questionService.stats(catalog) }));
    this.all = { catalog: allQuestions, stats$: questionService.stats(allQuestions) };
  }
}
