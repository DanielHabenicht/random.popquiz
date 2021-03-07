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

  @Output()
  public answered: EventEmitter<boolean> = new EventEmitter<boolean>();
  public init = false;

  constructor(private store: Store) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (this.question) {
      this.answers = shuffle(this.question.answers);
      this.showRight = false;
    }
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
    this.showRight = true;
    this.answered.emit(answer.right);
  }

  public getColor(answer: Answer) {
    if (this.showRight && answer && answer.right) {
      return 'success';
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
