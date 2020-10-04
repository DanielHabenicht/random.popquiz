import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionReelPage } from './question-reel.page';

describe('QuestionReelPage', () => {
  let component: QuestionReelPage;
  let fixture: ComponentFixture<QuestionReelPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestionReelPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionReelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
