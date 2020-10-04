import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuestionReelPage } from './question-reel.page';

const routes: Routes = [
  {
    path: '',
    component: QuestionReelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuestionReelPageRoutingModule {}
