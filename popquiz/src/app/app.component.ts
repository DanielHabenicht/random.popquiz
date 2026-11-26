import { Component } from '@angular/core';

import { AlertController, Platform, ToastController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { licences } from './catalogs';
import { ResetQuestionsState } from './state/questions.state';
import { ResetExamResults } from './state/exam.state';
import { examGroups } from './exams/exams';
import { QuestionsService } from './questions.service';
import { SettingsState } from './state/settings.state';
import { map, take } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public version = environment.version;
  public mainPages = [
    { title: 'Übersicht', url: '/home', icon: 'home' },
    { title: 'Prüfungsbögen', url: '/exams', icon: 'school' },
    { title: 'Statistik', url: '/dashboard', icon: 'stats-chart' },
  ];
  /** Licences the user has not hidden, plus repeating all mistakes. */
  public learnPages$ = this.store.select(SettingsState.hiddenCatalogs).pipe(
    map((hidden) => [
      ...licences
        .filter((c) => !hidden.includes(c.id))
        .map((c) => ({ title: c.title, url: `/questions/${c.id}/unanswered`, icon: c.icon })),
      { title: 'Alle Fehler wiederholen', url: '/questions/all/failed', icon: 'refresh' },
      { title: 'Markierte Fragen üben', url: '/questions/all/marked', icon: 'bookmark' },
    ])
  );

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private swUpdate: SwUpdate,
    private toastController: ToastController,
    private alertController: AlertController,
    private store: Store,
    private questionService: QuestionsService
  ) {
    this.initializeApp();
    this.offerUpdates();
  }

  /**
   * The service worker serves the cached version and downloads a new one in the background.
   * Offer to switch to the new version right away instead of only on the next start.
   */
  private offerUpdates() {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.available.subscribe(async () => {
      const toast = await this.toastController.create({
        message: 'Eine neue Version ist verfügbar.',
        position: 'bottom',
        buttons: [
          {
            text: 'Aktualisieren',
            handler: () => {
              this.swUpdate.activateUpdate().then(() => document.location.reload());
            },
          },
          { text: 'Später', role: 'cancel' },
        ],
      });
      toast.present();
    });
    // also check when the app stays open for a long time
    setInterval(() => this.swUpdate.checkForUpdate(), 60 * 60 * 1000);
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  /** Lets the user choose what to reset: everything, one licence or only the exam results. */
  public async resetProgress() {
    const alert = await this.alertController.create({
      header: 'Fortschritt zurücksetzen',
      message: 'Was soll zurückgesetzt werden? Markierte Fragen bleiben erhalten.',
      inputs: [
        { type: 'radio', label: 'Alles', value: 'all', checked: true },
        ...licences.map((c) => ({ type: 'radio' as const, label: c.title, value: c.id })),
        { type: 'radio', label: 'Nur Prüfungsergebnisse', value: 'exams' },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Weiter', handler: (choice: string) => this.confirmReset(choice) },
      ],
    });
    await alert.present();
  }

  private async confirmReset(choice: string) {
    const licence = licences.find((c) => c.id === choice);
    let message: string;
    if (choice === 'all') {
      message = 'Alle Antworten in allen Fragenkatalogen und alle Prüfungsergebnisse werden gelöscht.';
    } else if (choice === 'exams') {
      message = 'Die Ergebnisse aller Prüfungsbögen werden gelöscht. Deine Antworten im Lernmodus bleiben erhalten.';
    } else {
      message = `Alle Antworten und Prüfungsergebnisse für „${licence.title}“ (${licence.subtitle}) werden gelöscht.`;
      if (licence.types.includes('basic')) {
        message += ' Die Basisfragen gehören zu allen SBF-Scheinen und werden dort ebenfalls zurückgesetzt.';
      }
    }
    const confirm = await this.alertController.create({
      header: 'Wirklich zurücksetzen?',
      message: message + ' Das kann nicht rückgängig gemacht werden.',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Zurücksetzen', role: 'destructive', cssClass: 'danger', handler: () => this.reset(choice) },
      ],
    });
    await confirm.present();
  }

  private reset(choice: string) {
    const done = async () => {
      const toast = await this.toastController.create({ message: 'Fortschritt wurde zurückgesetzt.', duration: 2000 });
      toast.present();
    };
    if (choice === 'all') {
      this.store.dispatch([new ResetQuestionsState(), new ResetExamResults()]).subscribe(done);
      return;
    }
    if (choice === 'exams') {
      this.store.dispatch(new ResetExamResults()).subscribe(done);
      return;
    }
    const licence = licences.find((c) => c.id === choice);
    const sheetIds = examGroups
      .filter((g) => g.licenceId === choice)
      .reduce((ids, g) => ids.concat(g.sheets.map((s) => s.id)), [] as string[]);
    this.questionService
      .questionsOf(licence)
      .pipe(take(1))
      .subscribe((questions) => {
        this.store
          .dispatch([new ResetQuestionsState(questions.map((q) => q.id)), new ResetExamResults(sheetIds)])
          .subscribe(done);
      });
  }
}
