import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { Chart } from 'chart.js';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionsService } from '../questions.service';
import { QuestionsState, QuestionsStateEnum } from '../state/questions.state';
import { QuestionMode, QuestionType } from '../types/questions';
import { untilComponentDestroyed, OnDestroyMixin } from '@w11k/ngx-componentdestroyed';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage extends OnDestroyMixin implements AfterViewInit {
  @ViewChild('overall') overall: ElementRef;
  @ViewChild('basic') basic: ElementRef;
  @ViewChild('advanced') advanced: ElementRef;
  private overallChart: Chart;
  private basichart: Chart;
  private advancedChart: Chart;

  constructor(private questionService: QuestionsService) {
    super();
  }

  ngAfterViewInit() {
    forkJoin({
      overall: this.getChart(this.overall, 'all'),
      basic: this.getChart(this.basic, 'basic'),
      advanced: this.getChart(this.advanced, 'advanced'),
    })
      .pipe(untilComponentDestroyed(this))
      .subscribe((val) => {
        this.overallChart = val.overall;
        this.basic = val.basic;
        this.advanced = val.advanced;
      });
  }

  private getChart(ref: ElementRef, mode: QuestionMode): Observable<Chart> {
    return forkJoin({
      count: this.questionService.questionCount(mode),
      right: this.questionService.questionCount(mode, QuestionsStateEnum.right),
      wrong: this.questionService.questionCount(mode, QuestionsStateEnum.wrong),
    }).pipe(
      map((val) => {
        return new Chart(ref.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['right', 'wrong', 'unanswered'],
            datasets: [
              {
                label: '# of Votes',
                data: [val.right, val.wrong, val.count - val.right - val.wrong],
                backgroundColor: ['#008450', '#B81D13', '#444444'],
              },
            ],
          },
        });
      })
    );
  }
}
