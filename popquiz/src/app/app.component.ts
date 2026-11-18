import { Component, OnInit } from '@angular/core';

import { Platform, ToastController } from '@ionic/angular';
import { SwUpdate } from '@angular/service-worker';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public version = environment.version;
  public appPages = [
    {
      title: 'About',
      url: '/about',
      icon: 'mail',
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'mail',
    },
    {
      title: 'Basisfragen',
      url: '/questions/basic/unanswered',
      icon: 'warning',
    },
    {
      title: 'See',
      url: '/questions/advanced_sea/unanswered',
      icon: 'warning',
    },
    {
      title: 'Binnen',
      url: '/questions/advanced_inland/unanswered',
      icon: 'warning',
    },
    {
      title: 'Segeln',
      url: '/questions/advanced_sail/unanswered',
      icon: 'warning',
    },
    {
      title: 'SKS',
      url: '/questions/sks/unanswered',
      icon: 'warning',
    },
    {
      title: 'FKN',
      url: '/questions/fkn/unanswered',
      icon: 'warning',
    },
    {
      title: 'Falsch beantwortet 80%',
      url: '/questions/all/failed80',
      icon: 'warning',
    },
    {
      title: 'Falsch beantwortet',
      url: '/questions/all/failed',
      icon: 'warning',
    },
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private swUpdate: SwUpdate,
    private toastController: ToastController
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

  ngOnInit() {
    // path relative to the base href (the app is served from a sub path on GitHub Pages)
    const basePath = new URL(document.baseURI).pathname;
    const path = window.location.pathname.replace(basePath, '/').split('/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex((page) => page.title.toLowerCase() === path.toLowerCase());
    }
  }
}
