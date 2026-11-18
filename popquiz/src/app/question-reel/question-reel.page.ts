import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { combineLatest } from 'rxjs';
import { QuestionsState, QuestionsStateEnum, QuizMode, SetQuestionsState } from 'src/app/state/questions.state';
import { Question, QuestionMode } from '../types/questions';
import { ToastController } from '@ionic/angular';
import { QuestionsService } from 'src/app/questions.service';
import { untilComponentDestroyed, OnDestroyMixin } from '@w11k/ngx-componentdestroyed';

const catalogTitles: { [type in QuestionMode]: string } = {
  all: 'Alle Fragen',
  basic: 'Basisfragen',
  advanced_sea: 'See',
  advanced_inland: 'Binnen',
  advanced_sail: 'Segeln',
  sks: 'SKS',
  fkn: 'FKN',
};

const modeTitles: { [mode in QuizMode]: string } = {
  unanswered: 'Noch nicht richtig beantwortet',
  failed: 'Zuletzt falsch beantwortet',
  failed80: 'Weniger als 80 % richtig',
};

@Component({
  selector: 'app-question-reel',
  templateUrl: './question-reel.page.html',
  styleUrls: ['./question-reel.page.scss'],
})
export class QuestionReelPage extends OnDestroyMixin implements OnInit {
  public type: QuestionMode;
  public mode: QuizMode;
  public currentQuestion: Question;
  public catalogTitle: string;
  public modeTitle: string;
  /** Statistics of the catalog, based on the last answer of every question. */
  public stats = { total: 0, right: 0, wrong: 0, open: 0 };

  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store,
    public toastController: ToastController,
    private questionService: QuestionsService
  ) {
    super();
  }

  ngOnInit() {
    this.type = this.activatedRoute.snapshot.paramMap.get('type') as QuestionMode;
    this.mode = this.activatedRoute.snapshot.paramMap.get('mode') as QuizMode;
    this.catalogTitle = catalogTitles[this.type] || this.type;
    this.modeTitle = modeTitles[this.mode] || this.mode;

    // update the statistics whenever a question is answered
    combineLatest([this.questionService.getQuestions(), this.store.select(QuestionsState.questionsState)])
      .pipe(untilComponentDestroyed(this))
      .subscribe(([questions, state]) => {
        const stats = { total: 0, right: 0, wrong: 0, open: 0 };
        for (const q of questions) {
          if (this.type !== 'all' && q.type !== this.type) {
            continue;
          }
          stats.total++;
          const lastAnswer = state[q.id]?.lastAnswer;
          if (lastAnswer === QuestionsStateEnum.right) {
            stats.right++;
          } else if (lastAnswer === QuestionsStateEnum.wrong) {
            stats.wrong++;
          } else {
            stats.open++;
          }
        }
        this.stats = stats;
      });

    this.nextQuestion();
  }

  public async answered(correct: boolean) {
    this.store.dispatch(
      new SetQuestionsState(this.currentQuestion.id, correct ? QuestionsStateEnum.right : QuestionsStateEnum.wrong)
    );
    const toast = await this.toastController.create({
      message: correct ? 'Richtig!' : 'Leider falsch.',
      color: correct ? 'success' : 'danger',
      duration: 1500,
    });
    toast.present();
    setTimeout(() => {
      this.nextQuestion();
    }, 1000);
  }

  public nextQuestion() {
    this.questionService
      .nextQuestion(this.type, this.mode)
      .pipe(untilComponentDestroyed(this))
      .subscribe((question) => {
        // copy so the question component resets even if the same question is picked again
        this.currentQuestion = question ? { ...question } : question;
      });
  }
}
