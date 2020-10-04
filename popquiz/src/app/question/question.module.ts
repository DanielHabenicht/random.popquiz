import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QuestionComponent } from './question.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [QuestionComponent],
  exports: [QuestionComponent],
})
export class QuestionComponentModule {}
