import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ExamSheetPage } from './exam-sheet.page';

@NgModule({
  imports: [CommonModule, IonicModule, SharedModule, RouterModule.forChild([{ path: '', component: ExamSheetPage }])],
  declarations: [ExamSheetPage],
})
export class ExamSheetPageModule {}
