import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: 'mail',
    },
    {
      title: 'Basic',
      url: '/questions/basic/unanswered',
      icon: 'warning',
    },
    {
      title: 'Sea',
      url: '/questions/advanced_sea/unanswered',
      icon: 'warning',
    },
    {
      title: 'Inland',
      url: '/questions/advanced_inland/unanswered',
      icon: 'warning',
    },
    {
      title: 'Sail',
      url: '/questions/advanced_sail/unanswered',
      icon: 'warning',
    },
    {
      title: 'Failed',
      url: '/questions/all/failed',
      icon: 'warning',
    },
    {
      title: 'Failed80',
      url: '/questions/all/failed80',
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
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex((page) => page.title.toLowerCase() === path.toLowerCase());
    }
  }
}
