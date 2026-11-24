import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ExamOverviewPage } from './exam-overview.page';

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild([{ path: '', component: ExamOverviewPage }])],
  declarations: [ExamOverviewPage],
})
export class ExamOverviewPageModule {}
