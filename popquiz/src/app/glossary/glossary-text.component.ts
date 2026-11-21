import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { GlossaryEntry } from './glossary-data';
import { GlossaryService, TextSegment } from './glossary.service';

/** Shows a text and makes seafaring terms tappable to show a short explanation. */
@Component({
  selector: 'app-glossary-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *ngFor="let segment of segments"
    ><ng-container *ngIf="!segment.entry">{{ segment.text }}</ng-container
    ><span
      *ngIf="segment.entry"
      class="term"
      role="button"
      tabindex="0"
      [attr.aria-label]="segment.text + ' – Erklärung anzeigen'"
      (click)="explain($event, segment.entry)"
      (keydown.enter)="explain($event, segment.entry)"
      >{{ segment.text }}</span
    ></ng-container
  >`,
  styles: [
    `
      .term {
        text-decoration: underline dotted;
        text-decoration-thickness: 1.5px;
        text-underline-offset: 3px;
        text-decoration-color: var(--ion-color-primary);
        cursor: help;
      }
      .term:focus-visible {
        outline: 2px solid var(--ion-color-primary);
        border-radius: 2px;
      }
    `,
  ],
})
export class GlossaryTextComponent {
  public segments: TextSegment[] = [];

  @Input()
  set text(value: string) {
    this.segments = this.glossary.segments(value);
  }

  constructor(private glossary: GlossaryService, private toastController: ToastController) {}

  public async explain(event: Event, entry: GlossaryEntry) {
    // don't select the answer the term is part of
    event.stopPropagation();
    event.preventDefault();
    await this.toastController.dismiss(undefined, undefined, 'glossary').catch(() => undefined);
    const toast = await this.toastController.create({
      id: 'glossary',
      header: entry.term,
      message: entry.definition,
      position: 'bottom',
      duration: 8000,
      cssClass: 'glossary-toast',
      buttons: [{ icon: 'close', role: 'cancel', side: 'end' }],
    });
    await toast.present();
  }
}
