import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { allQuestions, Catalog, licences } from '../catalogs';
import { CatalogStats, QuestionsService } from '../questions.service';
import { SetCatalogHidden, SettingsState } from '../state/settings.state';

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
  private entries: CatalogEntry[];
  public visible$: Observable<CatalogEntry[]>;
  public hidden$: Observable<CatalogEntry[]>;
  public all: CatalogEntry;
  public markedCount$: Observable<number>;

  constructor(questionService: QuestionsService, private store: Store, private toastController: ToastController) {
    this.entries = licences.map((catalog) => ({ catalog, stats$: questionService.stats(catalog) }));
    const hiddenIds$ = this.store.select(SettingsState.hiddenCatalogs);
    this.visible$ = hiddenIds$.pipe(map((hidden) => this.entries.filter((e) => !hidden.includes(e.catalog.id))));
    this.hidden$ = hiddenIds$.pipe(map((hidden) => this.entries.filter((e) => hidden.includes(e.catalog.id))));
    this.all = { catalog: allQuestions, stats$: questionService.stats(allQuestions) };
    this.markedCount$ = questionService.markedCount(allQuestions);
  }

  public async hide(catalog: Catalog) {
    this.store.dispatch(new SetCatalogHidden(catalog.id, true));
    const toast = await this.toastController.create({
      message: `${catalog.title} ausgeblendet.`,
      duration: 4000,
      buttons: [{ text: 'Rückgängig', handler: () => this.show(catalog) }],
    });
    toast.present();
  }

  public show(catalog: Catalog) {
    this.store.dispatch(new SetCatalogHidden(catalog.id, false));
  }
}
