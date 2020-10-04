import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Answer, Question } from '../types/questions';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit, OnChanges {
  @Input()
  public question: Question;
  public answers: Answer[] = [];

  @Output()
  public answered: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (this.question) {
      this.answers = shuffle(this.question.answers);
    }
  }

  ngOnInit() {}

  public answerAction(answer: Answer) {
    this.answered.emit(answer.right);
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
