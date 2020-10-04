import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { QuestionsState, QuestionsStateEnum, SetQuestionsState } from 'src/app/state/questions.state';
import { HttpClient } from '@angular/common/http';
import { Question } from '../types/questions';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-question-reel',
  templateUrl: './question-reel.page.html',
  styleUrls: ['./question-reel.page.scss'],
})
export class QuestionReelPage implements OnInit {
  public mode: QuestionMode;
  public currentQuestion: Question;
  public allQuestions: Question[];
  public selectableQuestions: Question[];
  public totalAnswers: number;
  public totalQuestions: number;
  @Select(QuestionsState.questionsState) questionsState$: Observable<{ [id: string]: QuestionsStateEnum }>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private store: Store,
    public toastController: ToastController
  ) {}

  ngOnInit() {
    this.mode = this.activatedRoute.snapshot.paramMap.get('slug') as any;
    this.httpClient.get<Question[]>('assets/questions.json').subscribe((questions) => {
      this.allQuestions = questions;
      this.initQuestions();
    });
  }

  public initQuestions() {
    switch (this.mode) {
      case 'basic': {
        this.selectableQuestions = this.allQuestions.filter((q) => q.type === 'basic');
        this.totalQuestions = this.selectableQuestions.length;
        break;
      }
      case 'advanced': {
        this.selectableQuestions = this.allQuestions.filter((q) => q.type === 'advanced');
        this.totalQuestions = this.selectableQuestions.length;
        break;
      }
      case 'failed': {
        let state = this.store.selectSnapshot(QuestionsState.questionsState);
        this.selectableQuestions = this.allQuestions.filter((q) => state[q.id] === QuestionsStateEnum.wrong);
        this.totalQuestions = this.selectableQuestions.length;
        break;
      }
    }
    this.nextQuestion();
  }

  public async answered(correct: boolean) {
    this.store.dispatch(
      new SetQuestionsState(this.currentQuestion.id, correct ? QuestionsStateEnum.solved : QuestionsStateEnum.wrong)
    );
    const toast = await this.toastController.create({
      message: correct ? 'You answered correct!' : 'This was wrong :/',
      duration: 2000,
    });
    toast.present();
    this.nextQuestion();
  }

  public nextQuestion() {
    this.currentQuestion = this.selectableQuestions[Math.floor(Math.random() * this.selectableQuestions.length)];
    let state = this.store.selectSnapshot(QuestionsState.questionsState);
    this.totalAnswers = this.selectableQuestions.reduce((count, q) => {
      return count + (state[q.id] ? 1 : 0);
    }, 0);
  }
}

export type QuestionMode = 'basic' | 'advanced' | 'failed';
