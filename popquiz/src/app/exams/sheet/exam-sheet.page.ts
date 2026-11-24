import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { QuestionsService } from '../../questions.service';
import { SaveExamResult } from '../../state/exam.state';
import { QuestionsStateEnum, SetQuestionsState } from '../../state/questions.state';
import { Answer, Question } from '../../types/questions';
import { ExamGroup, ExamResult, ExamSheet, findGroup, findSheet, scoreSheet } from '../exams';

interface ExamItem {
  question: Question;
  partTitle: string;
  /** Answers in the (shuffled) order shown in this attempt. */
  answers: Answer[];
  multipleRight: boolean;
  /** Multiple choice: selected answers. */
  selected: Set<Answer>;
  /** Open questions: answer revealed and self assessment. */
  revealed: boolean;
  knewIt?: boolean;
}

type Phase = 'intro' | 'running' | 'result';

@Component({
  selector: 'app-exam-sheet',
  templateUrl: './exam-sheet.page.html',
  styleUrls: ['./exam-sheet.page.scss'],
})
export class ExamSheetPage implements OnInit, OnDestroy {
  public sheet: ExamSheet;
  public group: ExamGroup;
  public items: ExamItem[] = [];
  public index = 0;
  public phase: Phase = 'intro';
  public result: ExamResult;
  public readonly letters = ['a', 'b', 'c', 'd', 'e', 'f'];
  public elapsedSeconds = 0;
  public usedSeconds = 0;
  public loading = true;
  private timer: any;
  private startedAt = 0;

  constructor(
    private route: ActivatedRoute,
    private questionService: QuestionsService,
    private store: Store,
    private alertController: AlertController,
    private element: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    this.sheet = findSheet(this.route.snapshot.paramMap.get('sheetId'));
    this.group = this.sheet && findGroup(this.sheet.groupId);
    this.loading = false;
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  get current(): ExamItem {
    return this.items[this.index];
  }

  get answeredCount(): number {
    return this.items.filter((i) => this.isAnswered(i)).length;
  }

  public start() {
    this.questionService
      .getQuestions()
      .pipe(take(1))
      .subscribe((questions) => {
        const byId = new Map(questions.map((q) => [q.id, q]));
        this.items = [];
        for (const part of this.sheet.parts) {
          for (const id of part.questionIds) {
            const question = byId.get(id);
            if (!question) {
              continue;
            }
            this.items.push({
              question,
              partTitle: part.title,
              answers: question.open ? question.answers : shuffle([...question.answers]),
              multipleRight: !question.open && question.answers.filter((a) => a.right).length > 1,
              selected: new Set<Answer>(),
              revealed: false,
            });
          }
        }
        this.index = 0;
        this.phase = 'running';
        this.startedAt = Date.now();
        this.elapsedSeconds = 0;
        clearInterval(this.timer);
        this.timer = setInterval(() => (this.elapsedSeconds = Math.floor((Date.now() - this.startedAt) / 1000)), 1000);
        this.scrollTop();
      });
  }

  public select(item: ExamItem, answer: Answer) {
    if (item.multipleRight) {
      if (item.selected.has(answer)) {
        item.selected.delete(answer);
      } else {
        item.selected.add(answer);
      }
    } else {
      item.selected = new Set([answer]);
    }
  }

  public isAnswered(item: ExamItem): boolean {
    return item.question.open ? item.knewIt !== undefined : item.selected.size > 0;
  }

  public isCorrect(item: ExamItem): boolean {
    if (item.question.open) {
      return item.knewIt === true;
    }
    return item.selected.size > 0 && item.answers.every((a) => a.right === item.selected.has(a));
  }

  public goTo(index: number) {
    if (index >= 0 && index < this.items.length) {
      this.index = index;
      this.scrollTop();
      // keep the current question visible in the navigator
      setTimeout(() =>
        this.element.nativeElement
          .querySelector('.navigator .current')
          ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
      );
    }
  }

  public async submit() {
    const open = this.items.length - this.answeredCount;
    if (open > 0) {
      const alert = await this.alertController.create({
        header: 'Bogen abgeben?',
        message: `${open} ${open === 1 ? 'Frage ist' : 'Fragen sind'} noch nicht beantwortet und ${
          open === 1 ? 'zählt' : 'zählen'
        } als falsch.`,
        buttons: [
          { text: 'Weiter bearbeiten', role: 'cancel' },
          { text: 'Abgeben', handler: () => this.finish() },
        ],
      });
      await alert.present();
    } else {
      this.finish();
    }
  }

  private finish() {
    clearInterval(this.timer);
    this.usedSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    const byId = new Map(this.items.map((i) => [i.question.id, i]));
    this.result = scoreSheet(this.sheet, (id) => {
      const item = byId.get(id);
      return !!item && this.isCorrect(item);
    });
    // answered questions also count for the learning progress
    for (const item of this.items.filter((i) => this.isAnswered(i))) {
      this.store.dispatch(
        new SetQuestionsState(
          item.question.id,
          this.isCorrect(item) ? QuestionsStateEnum.right : QuestionsStateEnum.wrong
        )
      );
    }
    this.store.dispatch(new SaveExamResult(this.sheet.id, this.result));
    this.phase = 'result';
    this.scrollTop();
  }

  public answerClass(item: ExamItem, answer: Answer): string {
    if (this.phase === 'result') {
      if (answer.right) {
        return 'right';
      }
      return item.selected.has(answer) ? 'wrong' : 'other';
    }
    return item.selected.has(answer) ? 'selected' : '';
  }

  public formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  get overTime(): boolean {
    return !!this.sheet?.minutes && this.elapsedSeconds > this.sheet.minutes * 60;
  }

  /** Keyboard: 1-6 / a-f choose an answer, arrow keys navigate, Space reveals, G / N rate open questions. */
  @HostListener('document:keydown', ['$event'])
  public onKey(event: KeyboardEvent) {
    if (this.phase !== 'running' || event.ctrlKey || event.metaKey || event.altKey || !this.isVisible()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      return;
    }
    const item = this.current;
    const key = event.key.toLowerCase();
    let handled = true;
    if (key === 'arrowright') {
      this.goTo(this.index + 1);
    } else if (key === 'arrowleft') {
      this.goTo(this.index - 1);
    } else if (item.question.open) {
      if (key === ' ' && !item.revealed) {
        item.revealed = true;
      } else if (key === 'g' && item.revealed) {
        item.knewIt = true;
      } else if (key === 'n' && item.revealed) {
        item.knewIt = false;
      } else {
        handled = false;
      }
    } else {
      const index = /^[1-6]$/.test(key) ? parseInt(key, 10) - 1 : this.letters.indexOf(key);
      if (index >= 0 && index < item.answers.length) {
        this.select(item, item.answers[index]);
      } else {
        handled = false;
      }
    }
    if (handled) {
      event.preventDefault();
    }
  }

  /** Warn before closing the tab during a running exam. */
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent) {
    if (this.phase === 'running' && this.isVisible()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private isVisible(): boolean {
    return !this.element.nativeElement.classList.contains('ion-page-hidden');
  }

  private scrollTop() {
    const content = this.element.nativeElement.querySelector('ion-content') as any;
    content?.scrollToTop?.(200);
  }
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
