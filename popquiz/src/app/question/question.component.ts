import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { Answer, Question } from '../types/questions';
import { Store } from '@ngxs/store';
import { QuestionsState, QuestionState } from '../state/questions.state';

/** Time the "Richtig!" feedback is shown before the next question appears. */
const NEXT_DELAY_RIGHT = 900;

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnChanges {
  @Input()
  public question: Question;

  /** Emitted once per question with the result. */
  @Output()
  public answered = new EventEmitter<boolean>();

  /** Emitted when the next question should be shown. */
  @Output()
  public next = new EventEmitter<void>();

  public readonly letters = ['a', 'b', 'c', 'd', 'e', 'f'];
  public answers: Answer[] = [];
  /** History of this question before it was shown. */
  public history: QuestionState;
  /** Multiple choice with more than one right answer. */
  public multipleRight = false;
  public selected = new Set<Answer>();
  /** Open questions: whether the official answer is shown. */
  public revealed = false;
  /** The question has been answered (result shown). */
  public done = false;
  public correct = false;
  private nextTimer: any;

  constructor(private store: Store, private element: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    clearTimeout(this.nextTimer);
    if (this.question) {
      this.answers = this.question.open ? this.question.answers : shuffle([...this.question.answers]);
      this.multipleRight = !this.question.open && this.answers.filter((a) => a.right).length > 1;
      this.history = this.store.selectSnapshot(QuestionsState.questionsState)[this.question.id];
    }
    this.selected = new Set<Answer>();
    this.revealed = false;
    this.done = false;
    this.correct = false;
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
    this.selected = new Set([answer]);
    this.finish(answer.right);
  }

  /** Multiple choice with more than one right answer: correct if exactly the right answers are selected. */
  public checkSelection() {
    if (this.done || this.selected.size === 0) {
      return;
    }
    this.finish(this.answers.every((a) => a.right === this.selected.has(a)));
  }

  /** Open questions: show the official answer. */
  public reveal() {
    this.revealed = true;
  }

  /** Open questions: the user rates whether their answer was right. The answer was already read, so go on. */
  public selfAssessment(knewIt: boolean) {
    if (this.done || !this.revealed) {
      return;
    }
    this.finish(knewIt);
    this.goOn();
  }

  public goOn() {
    clearTimeout(this.nextTimer);
    this.next.emit();
  }

  private finish(correct: boolean) {
    this.done = true;
    this.correct = correct;
    this.answered.emit(correct);
    if (correct && !this.question.open) {
      this.nextTimer = setTimeout(() => this.goOn(), NEXT_DELAY_RIGHT);
    }
  }

  public answerState(answer: Answer): string {
    if (this.done) {
      if (answer.right) {
        return 'right';
      }
      return this.selected.has(answer) ? 'wrong' : 'other';
    }
    return this.selected.has(answer) ? 'selected' : '';
  }

  /** Keyboard: 1-6 / a-f choose an answer, Enter checks / continues, Space reveals, G / N rate open questions. */
  @HostListener('document:keydown', ['$event'])
  public onKey(event: KeyboardEvent) {
    if (!this.question || event.ctrlKey || event.metaKey || event.altKey || !this.isVisible()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      return;
    }
    const key = event.key.toLowerCase();
    let handled = true;
    if (this.question.open) {
      if (!this.revealed && (key === ' ' || key === 'enter')) {
        this.reveal();
      } else if (this.revealed && !this.done && key === 'g') {
        this.selfAssessment(true);
      } else if (this.revealed && !this.done && key === 'n') {
        this.selfAssessment(false);
      } else {
        handled = false;
      }
    } else if (this.done && (key === 'enter' || key === ' ' || key === 'arrowright')) {
      this.goOn();
    } else if (!this.done && this.multipleRight && key === 'enter') {
      this.checkSelection();
    } else {
      const index = /^[1-6]$/.test(key) ? parseInt(key, 10) - 1 : this.letters.indexOf(key);
      if (index >= 0 && index < this.answers.length && !this.done) {
        this.answerAction(this.answers[index]);
      } else {
        handled = false;
      }
    }
    if (handled) {
      event.preventDefault();
    }
  }

  /** Ionic keeps previous pages in the DOM, only react if this page is shown. */
  private isVisible(): boolean {
    return !this.element.nativeElement.closest('.ion-page-hidden') && this.element.nativeElement.offsetParent !== null;
  }
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
