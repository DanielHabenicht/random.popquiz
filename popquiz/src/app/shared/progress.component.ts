import { Component, Input } from '@angular/core';
import { CatalogStats } from '../questions.service';

/** Progress bar with the number of right / wrong / open questions. */
@Component({
  selector: 'app-progress',
  template: `
    <div class="legend" *ngIf="stats">
      <span class="right">✓ {{ stats.right }} richtig</span>
      <span class="wrong">✗ {{ stats.wrong }} falsch</span>
      <span class="open">{{ stats.open }} offen</span>
      <span class="percent">{{ percent }} %</span>
    </div>
    <div
      class="bar"
      role="progressbar"
      aria-valuemin="0"
      [attr.aria-valuemax]="stats?.total"
      [attr.aria-valuenow]="stats?.right"
      [attr.aria-label]="(stats?.right || 0) + ' von ' + (stats?.total || 0) + ' Fragen richtig beantwortet'"
    >
      <div class="right" [style.width.%]="stats?.total ? (100 * stats.right) / stats.total : 0"></div>
      <div class="wrong" [style.width.%]="stats?.total ? (100 * stats.wrong) / stats.total : 0"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 2px 12px;
        font-size: 0.85rem;
        margin-bottom: 6px;
      }
      .legend .right {
        color: var(--ion-color-success-shade);
      }
      .legend .wrong {
        color: var(--ion-color-danger);
      }
      .legend .open {
        color: var(--ion-color-medium);
      }
      .legend .percent {
        margin-left: auto;
        font-weight: 600;
      }
      .bar {
        display: flex;
        height: 6px;
        border-radius: 3px;
        overflow: hidden;
        background: var(--ion-color-step-150, #d7d8da);
      }
      .bar .right {
        background: var(--ion-color-success);
      }
      .bar .wrong {
        background: var(--ion-color-danger);
      }
    `,
  ],
})
export class ProgressComponent {
  @Input() stats: CatalogStats;

  get percent(): number {
    return this.stats?.total ? Math.round((100 * this.stats.right) / this.stats.total) : 0;
  }
}
