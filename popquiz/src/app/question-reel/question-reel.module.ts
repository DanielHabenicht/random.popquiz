import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QuestionReelPageRoutingModule } from './question-reel-routing.module';

import { QuestionReelPage } from './question-reel.page';
import { QuestionComponentModule } from '../question/question.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, QuestionReelPageRoutingModule, QuestionComponentModule],
  declarations: [QuestionReelPage],
})
export class QuestionReelPageModule {}
