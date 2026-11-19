import { Component } from '@angular/core';

import { AlertController, Platform, ToastController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { licences } from './catalogs';
import { ResetQuestionsState } from './state/questions.state';
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
    { title: 'Statistik', url: '/dashboard', icon: 'stats-chart' },
  ];
  public learnPages = [
    ...licences.map((c) => ({ title: c.title, url: `/questions/${c.id}/unanswered`, icon: c.icon })),
    { title: 'Alle Fehler wiederholen', url: '/questions/all/failed', icon: 'refresh' },
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private swUpdate: SwUpdate,
    private toastController: ToastController,
    private alertController: AlertController,
    private store: Store
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

  public async resetProgress() {
    const alert = await this.alertController.create({
      header: 'Fortschritt zurücksetzen?',
      message: 'Alle deine Antworten in allen Fragenkatalogen werden gelöscht. Das kann nicht rückgängig gemacht werden.',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Zurücksetzen',
          role: 'destructive',
          cssClass: 'danger',
          handler: () => {
            this.store.dispatch(new ResetQuestionsState()).subscribe(async () => {
              const toast = await this.toastController.create({
                message: 'Fortschritt wurde zurückgesetzt.',
                duration: 2000,
              });
              toast.present();
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
