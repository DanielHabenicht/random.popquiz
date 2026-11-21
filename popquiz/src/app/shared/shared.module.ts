import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressComponent } from './progress.component';
import { GlossaryTextComponent } from '../glossary/glossary-text.component';

@NgModule({
  imports: [CommonModule],
  declarations: [ProgressComponent, GlossaryTextComponent],
  exports: [ProgressComponent, GlossaryTextComponent],
})
export class SharedModule {}
