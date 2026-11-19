import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { QuestionsStateEnum, QuizMode, SetQuestionsState } from 'src/app/state/questions.state';
import { Question } from '../types/questions';
import { CatalogStats, QuestionsService } from 'src/app/questions.service';
import { untilComponentDestroyed, OnDestroyMixin } from '@w11k/ngx-componentdestroyed';
import { Catalog, findCatalog } from '../catalogs';

const modeTitles: { [mode in QuizMode]: string } = {
  unanswered: 'Lernen',
  failed: 'Fehler wiederholen',
  failed80: 'Häufige Fehler',
};

@Component({
  selector: 'app-question-reel',
  templateUrl: './question-reel.page.html',
  styleUrls: ['./question-reel.page.scss'],
})
export class QuestionReelPage extends OnDestroyMixin implements OnInit {
  public catalog: Catalog;
  public mode: QuizMode;
  public modeTitle: string;
  public currentQuestion: Question;
  /** Questions left in the current mode (including the current one). */
  public remaining: number;
  public loading = true;
  public stats$: Observable<CatalogStats>;

  constructor(private activatedRoute: ActivatedRoute, private store: Store, private questionService: QuestionsService) {
    super();
  }

  ngOnInit() {
    this.catalog = findCatalog(this.activatedRoute.snapshot.paramMap.get('type'));
    this.mode = (this.activatedRoute.snapshot.paramMap.get('mode') as QuizMode) || 'unanswered';
    this.modeTitle = modeTitles[this.mode] || this.mode;
    this.stats$ = this.questionService.stats(this.catalog);
    this.nextQuestion();
  }

  public answered(correct: boolean) {
    this.store.dispatch(
      new SetQuestionsState(this.currentQuestion.id, correct ? QuestionsStateEnum.right : QuestionsStateEnum.wrong)
    );
  }

  public nextQuestion() {
    this.questionService
      .nextQuestion(this.catalog, this.mode)
      .pipe(untilComponentDestroyed(this))
      .subscribe((next) => {
        this.loading = false;
        this.remaining = next.remaining;
        // copy so the question component resets even if the same question is picked again
        this.currentQuestion = next.question ? { ...next.question } : undefined;
      });
  }
}
