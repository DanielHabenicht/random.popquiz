import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { QuestionsState, QuestionsStateEnum, QuizMode, SetQuestionsState } from 'src/app/state/questions.state';
import { HttpClient } from '@angular/common/http';
import { Question, QuestionMode, QuestionType } from '../types/questions';
import { ToastController } from '@ionic/angular';
import { QuestionsService } from 'src/app/questions.service';
import { untilComponentDestroyed, OnDestroyMixin } from '@w11k/ngx-componentdestroyed';

@Component({
  selector: 'app-question-reel',
  templateUrl: './question-reel.page.html',
  styleUrls: ['./question-reel.page.scss'],
})
export class QuestionReelPage extends OnDestroyMixin implements OnInit {
  public type: QuestionMode;
  public mode: QuizMode;
  public currentQuestion: Question;
  public totalAnswers: number;
  public totalQuestions: number;
  @Select(QuestionsState.questionsState) questionsState$: Observable<{ [id: string]: QuestionsStateEnum }>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store,
    public toastController: ToastController,
    private questionService: QuestionsService
  ) {
    super();
  }

  ngOnInit() {
    this.type = this.activatedRoute.snapshot.paramMap.get('type') as any;
    this.mode = this.activatedRoute.snapshot.paramMap.get('mode') as any;
    this.questionService
      .questionCount(this.type)
      .pipe(untilComponentDestroyed(this))
      .subscribe((total) => {
        this.totalQuestions = total;
      });
    this.nextQuestion();
  }

  public async answered(correct: boolean) {
    this.store.dispatch(
      new SetQuestionsState(this.currentQuestion.id, correct ? QuestionsStateEnum.right : QuestionsStateEnum.wrong)
    );
    const toast = await this.toastController.create({
      message: correct ? 'You answered correct!' : 'This was wrong :/',
      duration: 2000,
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
        this.currentQuestion = question;
      });

    this.questionService
      .questionCount(this.type, QuestionsStateEnum.right)
      .pipe(untilComponentDestroyed(this))
      .subscribe((total) => {
        this.totalAnswers = total;
      });
  }
}
