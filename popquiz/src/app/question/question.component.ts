import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Answer, Question } from '../types/questions';
import { Chart } from 'chart.js';
import { Store } from '@ngxs/store';
import { QuestionsState, QuestionState } from '../state/questions.state';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements AfterViewInit, OnChanges {
  @ViewChild('stats') stats: ElementRef;
  private statsChart: Chart = null;

  @Input()
  public question: Question;
  public qState: QuestionState;
  public answers: Answer[] = [];
  public showRight = false;
  /** Open questions: whether the official answer is shown. */
  public revealed = false;
  /** Multiple choice questions with more than one right answer: the answers selected so far. */
  public selected = new Set<Answer>();
  public multipleRight = false;
  private done = false;

  @Output()
  public answered: EventEmitter<boolean> = new EventEmitter<boolean>();
  public init = false;

  constructor(private store: Store) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (this.question) {
      this.answers = this.question.open ? this.question.answers : shuffle([...this.question.answers]);
      this.multipleRight = !this.question.open && this.answers.filter((a) => a.right).length > 1;
    }
    this.showRight = false;
    this.revealed = false;
    this.selected = new Set<Answer>();
    this.done = false;
    if (this.init) {
      this.updateStats();
    }
  }

  ngAfterViewInit() {
    this.init = true;
    this.updateStats();
  }
  updateStats() {
    this.qState = this.store.selectSnapshot(QuestionsState.questionsState)[this.question?.id];
    if (this.statsChart != null) {
      (this.statsChart.data.datasets = [
        {
          data: [this.qState?.right || 0],
          backgroundColor: '#00BC43',
          hoverBackgroundColor: '#00BC43',
        },
        {
          data: [this.qState?.wrong || 0],
          backgroundColor: '#FF0000',
          hoverBackgroundColor: '#FF0000',
        },
        {
          data: [!this.qState?.right && !this.qState?.wrong ? 1 : 0],
          backgroundColor: 'lightgrey',
          hoverBackgroundColor: 'lightgrey',
        },
      ]),
        this.statsChart.update();
      return;
    }
    this.statsChart = new Chart(this.stats.nativeElement, {
      type: 'horizontalBar',
      data: {
        labels: [],
        datasets: [
          {
            data: [this.qState?.right || 0],
            backgroundColor: '#00BC43',
            hoverBackgroundColor: '#00BC43',
          },
          {
            data: [this.qState?.wrong || 0],
            backgroundColor: '#FF0000',
            hoverBackgroundColor: '#FF0000',
          },
          {
            data: [!this.qState?.right && !this.qState?.wrong ? 1 : 0],
            backgroundColor: 'lightgrey',
            hoverBackgroundColor: 'lightgrey',
          },
        ],
      },
      options: {
        responsive: false,
        animation: {
          duration: 0, // general animation time
        },
        hover: {
          animationDuration: 0, // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0,
        showTooltips: false,
        legend: {
          display: false, // hides the legend
        },
        tooltips: {
          enabled: false, // hides the tooltip.
        },
        scales: {
          xAxes: [
            {
              display: false, // hides the horizontal scale
              stacked: true, // stacks the bars on the x axis
            },
          ],
          yAxes: [
            {
              display: false, // hides the vertical scale
              stacked: true, // stacks the bars on the y axis
            },
          ],
        },
      },
    });
  }

  public answerAction(answer: Answer) {
    if (!answer || this.done) {
      return;
    }
    if (this.multipleRight) {
      if (this.selected.has(answer)) {
        this.selected.delete(answer);
      } else {
        this.selected.add(answer);
      }
      return;
    }
    this.finish(answer.right);
  }

  /** Multiple choice with more than one right answer: correct if exactly the right answers are selected. */
  public checkSelection() {
    if (this.done) {
      return;
    }
    this.finish(this.answers.every((a) => a.right === this.selected.has(a)));
  }

  /** Open questions: show the official answer. */
  public reveal() {
    this.revealed = true;
  }

  /** Open questions: the user rates whether their answer was right. */
  public selfAssessment(knewIt: boolean) {
    if (this.done) {
      return;
    }
    this.finish(knewIt);
  }

  private finish(correct: boolean) {
    this.done = true;
    this.showRight = true;
    this.answered.emit(correct);
  }

  public getColor(answer: Answer) {
    if (this.showRight && answer && answer.right) {
      return 'success';
    }
    if (this.showRight && answer && this.selected.has(answer)) {
      return 'danger';
    }
    if (answer && this.selected.has(answer)) {
      return 'primary';
    }
    return 'tertiary';
  }
}

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
