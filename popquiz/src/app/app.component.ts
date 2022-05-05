import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
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

  constructor(private platform: Platform, private splashScreen: SplashScreen, private statusBar: StatusBar) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  ngOnInit() {
    const path = window.location.pathname.split('/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex((page) => page.title.toLowerCase() === path.toLowerCase());
    }
  }
}
