import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { NgxsModule } from '@ngxs/store';
import { QuestionsState } from 'src/app/state/questions.state';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { QuestionsService } from 'src/app/questions.service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    NgxsModule.forRoot([QuestionsState], {
      developmentMode: !environment.production,
    }),
    NgxsLoggerPluginModule.forRoot({
      disabled: environment.production,
    }),
    NgxsStoragePluginModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [StatusBar, SplashScreen, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, QuestionsService],
  bootstrap: [AppComponent],
})
export class AppModule {}
