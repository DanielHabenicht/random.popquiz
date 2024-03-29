import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AboutPage } from './about/about.page';

const routes: Routes = [
  {
    path: 'questions/:type/:mode',
    loadChildren: () => import('./question-reel/question-reel.module').then((m) => m.QuestionReelPageModule),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardPageModule),
  },
  {
    path: 'about',
    component: AboutPage,
  },
  {
    path: '',
    redirectTo: 'about',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
